import { useState, useEffect } from 'react';
import { projectApi, timeApi } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Clock, Save, Trash2 } from 'lucide-react';
import type { Project, TimeEntry } from '../types';

export function TimeChargePage() {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const [formData, setFormData] = useState({
    project_id: '',
    hours: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    billable: true,
    hourly_rate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, entriesData] = await Promise.all([
        projectApi.getAll(),
        timeApi.getMyTimeEntries(),
      ]);
      setProjects(projectsData);
      setTimeEntries(entriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.hours) return;

    setLoading(true);

    try {
      await timeApi.create({
        project_id: parseInt(formData.project_id),
        hours: parseFloat(formData.hours),
        description: formData.description || undefined,
        date: formData.date,
        billable: formData.billable,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
      });

      // Reset form and reload entries
      setFormData({
        project_id: '',
        hours: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        billable: true,
        hourly_rate: '',
      });
      loadData();
    } catch (error) {
      console.error('Failed to log time:', error);
      alert('Failed to log time');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;

    try {
      await timeApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete time entry:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalHoursThisWeek = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    return timeEntries
      .filter(entry => new Date(entry.date) >= weekStart)
      .reduce((total, entry) => total + entry.hours, 0);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Time Entry Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Log Time
                </CardTitle>
                <CardDescription>Record hours worked on a project</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project">Project *</Label>
                    <Select
                      value={formData.project_id}
                      onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: project.color }}
                              />
                              {project.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hours">Hours *</Label>
                      <Input
                        id="hours"
                        type="number"
                        value={formData.hours}
                        onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                        placeholder="0.0"
                        min="0.1"
                        step="0.5"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What did you work on?"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Billable</Label>
                      <Select
                        value={formData.billable ? 'yes' : 'no'}
                        onValueChange={(value) => setFormData({ ...formData, billable: value === 'yes' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || !formData.project_id || !formData.hours}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Log Time'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {getTotalHoursThisWeek().toFixed(1)}h
                </div>
                <p className="text-sm text-gray-500 mt-1">Total hours logged</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Recent Time Entries */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Time Entries</h2>
          {loadingEntries ? (
            <p className="text-gray-500">Loading...</p>
          ) : timeEntries.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No time entries yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {timeEntries.slice(0, 10).map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <div className="font-medium">{entry.project_name}</div>
                          <div className="text-gray-500">{formatDate(entry.date)}</div>
                        </div>
                        {entry.description && (
                          <div className="text-sm text-gray-500 max-w-md truncate">
                            {entry.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">{entry.hours}h</div>
                          {entry.billable && entry.hourly_rate && (
                            <div className="text-xs text-gray-500">
                              ${(entry.hours * entry.hourly_rate).toFixed(0)}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
    </div>
  );
}
