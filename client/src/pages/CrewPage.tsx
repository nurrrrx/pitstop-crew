import { useState, useEffect } from 'react';
import { crewApi } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Users,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import type { CrewMember, CreateCrewMemberData, MonthlyStats, FTEBand, RateCategory } from '../types';
import { BAND_COSTS, RATE_CATEGORY_COSTS } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function CrewPage() {
  const [ftes, setFtes] = useState<CrewMember[]>([]);
  const [contractors, setContractors] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
  const [memberStats, setMemberStats] = useState<MonthlyStats[]>([]);

  const [newMember, setNewMember] = useState<CreateCrewMemberData>({
    email: '',
    name: '',
    employment_type: 'fte',
    department: '',
    title: '',
    hourly_rate: 0,
    start_date: new Date().toISOString().split('T')[0],
    band: undefined,
    rate_category: undefined,
    daily_rate: 0,
    monthly_rate: 0,
  });

  useEffect(() => {
    loadCrew();
  }, [showInactive]);

  const loadCrew = async () => {
    try {
      setLoading(true);
      const [fteData, contractorData] = await Promise.all([
        crewApi.getAll('fte', showInactive),
        crewApi.getAll('contractor', showInactive),
      ]);
      setFtes(fteData);
      setContractors(contractorData);
    } catch (error) {
      console.error('Failed to load crew:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberStats = async (member: CrewMember) => {
    try {
      const stats = await crewApi.getMonthlyStats(member.id);
      setMemberStats(stats);
    } catch (error) {
      console.error('Failed to load member stats:', error);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.email || !newMember.name) return;

    try {
      await crewApi.create(newMember);
      setShowAddDialog(false);
      setNewMember({
        email: '',
        name: '',
        employment_type: 'fte',
        department: '',
        title: '',
        hourly_rate: 0,
        start_date: new Date().toISOString().split('T')[0],
        band: undefined,
        rate_category: undefined,
        daily_rate: 0,
        monthly_rate: 0,
      });
      loadCrew();
    } catch (error) {
      console.error('Failed to add crew member:', error);
      alert('Failed to add crew member');
    }
  };

  const handleArchiveMember = async (id: number) => {
    if (!confirm('Are you sure you want to archive this crew member?')) return;

    try {
      await crewApi.archive(id);
      loadCrew();
      setSelectedMember(null);
    } catch (error) {
      console.error('Failed to archive crew member:', error);
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      await crewApi.reactivate(id);
      loadCrew();
    } catch (error) {
      console.error('Failed to reactivate crew member:', error);
    }
  };

  const selectMember = async (member: CrewMember) => {
    setSelectedMember(member);
    loadMemberStats(member);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderMemberCard = (member: CrewMember) => (
    <Card
      key={member.id}
      className={`cursor-pointer hover:border-primary transition-colors ${member.end_date ? 'opacity-60' : ''}`}
      onClick={() => selectMember(member)}
    >
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-lg">
              {member.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{member.name}</span>
              {member.end_date && <Badge variant="secondary">Inactive</Badge>}
            </div>
            <div className="text-sm text-gray-500">{member.title || member.role}</div>
            {member.department && (
              <div className="text-xs text-gray-400">{member.department}</div>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="font-medium">{member.current_projects || 0}</div>
            <div className="text-xs text-gray-500">Projects</div>
          </div>
          <div>
            <div className="font-medium">{(member.total_hours || 0).toFixed(0)}</div>
            <div className="text-xs text-gray-500">Hours</div>
          </div>
          <div>
            <div className="font-medium">
              {member.start_date ? formatDate(member.start_date).split(',')[0] : '-'}
            </div>
            <div className="text-xs text-gray-500">Started</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMemberDetail = () => {
    if (!selectedMember) return null;

    const currentYear = new Date().getFullYear();
    const yearStats = memberStats.filter(s => s.year === currentYear);

    return (
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-2xl">
                  {selectedMember.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">{selectedMember.name}</DialogTitle>
                <DialogDescription>
                  {selectedMember.title || selectedMember.role}
                  {selectedMember.department && ` • ${selectedMember.department}`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Status and Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Started:</span>
                <span>{formatDate(selectedMember.start_date)}</span>
              </div>
              {selectedMember.end_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Ended:</span>
                  <span>{formatDate(selectedMember.end_date)}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <Briefcase className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{selectedMember.current_projects || 0}</div>
                  <div className="text-sm text-gray-500">Active Projects</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{(selectedMember.total_hours || 0).toFixed(0)}</div>
                  <div className="text-sm text-gray-500">Total Hours</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">{selectedMember.total_projects || 0}</div>
                  <div className="text-sm text-gray-500">All Projects</div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Hours Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Monthly Hours ({currentYear})</CardTitle>
              </CardHeader>
              <CardContent>
                {yearStats.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No data for {currentYear}</p>
                ) : (
                  <div className="space-y-2">
                    {MONTHS.map((month, index) => {
                      const stat = yearStats.find(s => s.month === index + 1);
                      const hours = stat?.hours || 0;
                      const maxHours = Math.max(...yearStats.map(s => s.hours), 1);
                      return (
                        <div key={month} className="flex items-center gap-2">
                          <span className="w-8 text-xs text-gray-500">{month}</span>
                          <div className="flex-1">
                            <Progress value={(hours / maxHours) * 100} className="h-2" />
                          </div>
                          <span className="w-12 text-right text-sm">{hours.toFixed(0)}h</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contractor-specific: Cost info */}
            {selectedMember.employment_type === 'contractor' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cost Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedMember.rate_category && (
                      <div>
                        <div className="text-sm text-gray-500">Rate Category</div>
                        <div className="text-lg font-bold">
                          {selectedMember.rate_category}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-500">Daily Rate</div>
                      <div className="text-lg font-bold">
                        ${(selectedMember.daily_rate || selectedMember.hourly_rate * 8 || 0).toFixed(0)}/day
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Monthly Rate</div>
                      <div className="text-lg font-bold">
                        ${(selectedMember.monthly_rate || (selectedMember.hourly_rate || 0) * 160).toFixed(0)}/month
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Cost (Est.)</div>
                      <div className="text-lg font-bold">
                        ${((selectedMember.total_hours || 0) * (selectedMember.hourly_rate || 0)).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* FTE-specific: Band and cost info */}
            {selectedMember.employment_type === 'fte' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cost Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedMember.band && (
                      <div>
                        <div className="text-sm text-gray-500">Band</div>
                        <div className="text-lg font-bold">
                          Band {selectedMember.band}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-500">Monthly Cost</div>
                      <div className="text-lg font-bold">
                        ${(selectedMember.monthly_rate || (selectedMember.band ? BAND_COSTS[selectedMember.band] : 0)).toFixed(0)}/month
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* FTE-specific: Average monthly stats */}
            {selectedMember.employment_type === 'fte' && yearStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Average Monthly Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Avg Hours/Month</div>
                      <div className="text-lg font-bold">
                        {(yearStats.reduce((sum, s) => sum + s.hours, 0) / yearStats.length).toFixed(1)}h
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Avg Projects/Month</div>
                      <div className="text-lg font-bold">
                        {(yearStats.reduce((sum, s) => sum + s.projects, 0) / yearStats.length).toFixed(1)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="mt-6">
            {selectedMember.end_date ? (
              <Button variant="outline" onClick={() => handleReactivate(selectedMember.id)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Reactivate
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => handleArchiveMember(selectedMember.id)}>
                <UserMinus className="h-4 w-4 mr-2" />
                Archive
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading crew...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show inactive
        </label>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <Tabs defaultValue="fte">
          <TabsList className="mb-6">
            <TabsTrigger value="fte" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              FTEs ({ftes.length})
            </TabsTrigger>
            <TabsTrigger value="contractor" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Contractors ({contractors.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fte">
            {ftes.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No FTEs found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ftes.map(renderMemberCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contractor">
            {contractors.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No contractors found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contractors.map(renderMemberCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>

      {/* Member Detail Dialog */}
      {renderMemberDetail()}

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Crew Member</DialogTitle>
            <DialogDescription>Add a new FTE or contractor to the crew</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newMember.employment_type}
                  onValueChange={(value: 'fte' | 'contractor') =>
                    setNewMember({ ...newMember, employment_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fte">FTE</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={newMember.department || ''}
                  onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                  placeholder="e.g., Engineering"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newMember.title || ''}
                  onChange={(e) => setNewMember({ ...newMember, title: e.target.value })}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newMember.start_date || ''}
                  onChange={(e) => setNewMember({ ...newMember, start_date: e.target.value })}
                />
              </div>
            </div>

            {/* Band for FTE */}
            {newMember.employment_type === 'fte' && (
              <div className="space-y-2">
                <Label>Band (Monthly Cost)</Label>
                <Select
                  value={newMember.band || ''}
                  onValueChange={(value: FTEBand) => {
                    const monthlyCost = BAND_COSTS[value];
                    setNewMember({
                      ...newMember,
                      band: value,
                      monthly_rate: monthlyCost,
                      hourly_rate: monthlyCost / 160 // Approx 160 working hours/month
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select band" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G">Band G - 10,000/month</SelectItem>
                    <SelectItem value="H">Band H - 20,000/month</SelectItem>
                    <SelectItem value="I">Band I - 30,000/month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Rate Category for Contractor */}
            {newMember.employment_type === 'contractor' && (
              <div className="space-y-2">
                <Label>Rate Category (Daily / Monthly)</Label>
                <Select
                  value={newMember.rate_category || ''}
                  onValueChange={(value: RateCategory) => {
                    const rates = RATE_CATEGORY_COSTS[value];
                    setNewMember({
                      ...newMember,
                      rate_category: value,
                      daily_rate: rates.daily,
                      monthly_rate: rates.monthly,
                      hourly_rate: rates.daily / 8 // 8 hours per day
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rate category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Category A - 1,000/day (21,000/month)</SelectItem>
                    <SelectItem value="AA">Category AA - 1,500/day (31,500/month)</SelectItem>
                    <SelectItem value="AAA">Category AAA - 2,000/day (42,000/month)</SelectItem>
                    <SelectItem value="AAAA">Category AAAA - 3,000/day (63,000/month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Member</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
