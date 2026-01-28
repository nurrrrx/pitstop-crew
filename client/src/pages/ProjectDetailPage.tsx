import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectApi } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MilestoneGanttChart } from '@/components/MilestoneGanttChart';
import { TaskKanban } from '@/components/TaskKanban';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { TimeLogCalendar } from '@/components/TimeLogCalendar';
import { BudgetBreakdownTab } from '@/components/BudgetBreakdownTab';
import { StakeholdersTab } from '@/components/StakeholdersTab';
import { ProjectFilesTab } from '@/components/ProjectFilesTab';
import { ActivityLogTab } from '@/components/ActivityLogTab';
import {
  Calendar,
  DollarSign,
  Users,
  Flag,
  Clock,
  Plus,
  CheckCircle,
  Circle,
  Trash2,
  GanttChart,
  SquareKanban,
  UserMinus,
  AlertTriangle,
  Target,
  CalendarDays,
  List,
  Wallet,
  UserCheck,
  FileText,
  History
} from 'lucide-react';
import type { Project, ProjectMember, Milestone, Task, TimeEntry, ProjectSummary } from '../types';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  planning: 'secondary',
  active: 'success',
  on_hold: 'warning',
  completed: 'default',
  cancelled: 'destructive',
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [newMilestone, setNewMilestone] = useState({ name: '', start_date: '', due_date: '', description: '' });
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [timeLogView, setTimeLogView] = useState<'list' | 'calendar'>('calendar');

  useEffect(() => {
    if (id) {
      loadProject(parseInt(id));
    }
  }, [id]);

  const loadProject = async (projectId: number) => {
    try {
      setLoading(true);
      const [projectData, membersData, milestonesData, tasksData, timeData, summaryData] = await Promise.all([
        projectApi.getById(projectId),
        projectApi.getMembers(projectId),
        projectApi.getMilestones(projectId),
        projectApi.getTasks(projectId),
        projectApi.getTimeEntries(projectId),
        projectApi.getSummary(projectId),
      ]);
      setProject(projectData);
      setMembers(membersData);
      setMilestones(milestonesData);
      setTasks(tasksData);
      setTimeEntries(timeData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newMilestone.name) return;

    try {
      await projectApi.createMilestone(parseInt(id), {
        name: newMilestone.name,
        start_date: newMilestone.start_date || undefined,
        due_date: newMilestone.due_date || undefined,
        description: newMilestone.description || undefined,
      });
      setNewMilestone({ name: '', start_date: '', due_date: '', description: '' });
      setShowMilestoneForm(false);
      loadProject(parseInt(id));
    } catch (error) {
      console.error('Failed to add milestone:', error);
    }
  };

  const handleToggleMilestone = async (milestone: Milestone) => {
    if (!id) return;
    const newStatus = milestone.status === 'completed' ? 'pending' : 'completed';
    try {
      await projectApi.updateMilestone(parseInt(id), milestone.id, { status: newStatus });
      loadProject(parseInt(id));
    } catch (error) {
      console.error('Failed to update milestone:', error);
    }
  };

  const handleDeleteMilestone = async (milestoneId: number) => {
    if (!id || !confirm('Delete this milestone?')) return;
    try {
      await projectApi.deleteMilestone(parseInt(id), milestoneId);
      loadProject(parseInt(id));
    } catch (error) {
      console.error('Failed to delete milestone:', error);
    }
  };

  const handleRemoveMember = async (userId: number, userName: string) => {
    if (!id || !confirm(`Remove ${userName} from this project?`)) return;
    try {
      await projectApi.removeMember(parseInt(id), userId);
      loadProject(parseInt(id));
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProjectProgress = () => {
    if (!project?.task_count || project.task_count === 0) return 0;
    return Math.round(((project.completed_tasks || 0) / project.task_count) * 100);
  };

  const getDeadlineInfo = () => {
    if (!project?.end_date) return null;
    const deadline = new Date(project.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: AlertTriangle,
        iconColor: 'text-red-500'
      };
    } else if (diffDays === 0) {
      return {
        text: 'Due today',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: AlertTriangle,
        iconColor: 'text-red-500'
      };
    } else if (diffDays <= 14) {
      return {
        text: `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        icon: Target,
        iconColor: 'text-amber-500'
      };
    } else {
      return {
        text: `${diffDays} days remaining`,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: Target,
        iconColor: 'text-green-500'
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: project.color }}
        />
        <h1 className="text-xl font-bold">{project.name}</h1>
        <Badge variant={statusColors[project.status] || 'default'}>
          {project.status.replace('_', ' ')}
        </Badge>
      </div>
      {project.description && (
        <p className="text-sm text-muted-foreground">{project.description}</p>
      )}

      {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Calendar className="h-4 w-4" />
                Timeline
              </div>
              <div className="text-sm font-medium">
                {formatDate(project.start_date)} - {formatDate(project.end_date)}
              </div>
            </CardContent>
          </Card>

          {/* Deadline Indicator */}
          {(() => {
            const deadlineInfo = getDeadlineInfo();
            if (!deadlineInfo) return null;
            const DeadlineIcon = deadlineInfo.icon;
            return (
              <Card className={`${deadlineInfo.bgColor} ${deadlineInfo.borderColor} border`}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <DeadlineIcon className={`h-4 w-4 ${deadlineInfo.iconColor}`} />
                    Deadline
                  </div>
                  <div className={`text-sm font-bold ${deadlineInfo.color}`}>
                    {deadlineInfo.text}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                Budget
              </div>
              <div className="text-lg font-bold">{formatCurrency(project.budget)}</div>
              <div className="text-xs text-gray-500">
                {formatCurrency(parseFloat(summary?.total_cost?.toString() || '0'))} spent
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Users className="h-4 w-4" />
                Team
              </div>
              <div className="text-lg font-bold">{members.length}</div>
              <div className="text-xs text-gray-500">members</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Clock className="h-4 w-4" />
                Hours
              </div>
              <div className="text-lg font-bold">{parseFloat(summary?.total_hours?.toString() || '0').toFixed(1)}</div>
              <div className="text-xs text-gray-500">logged</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card className="mb-8">
          <CardContent className="pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Project Progress</span>
              <span className="text-sm text-gray-500">{getProjectProgress()}%</span>
            </div>
            <Progress value={getProjectProgress()} className="h-2" />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="gantt">
          <TabsList className="mb-4">
            <TabsTrigger value="gantt">
              <GanttChart className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <SquareKanban className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="milestones">
              <Flag className="h-4 w-4 mr-2" />
              Milestones
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger value="time">
              <Clock className="h-4 w-4 mr-2" />
              Time Log
            </TabsTrigger>
            <TabsTrigger value="budget">
              <Wallet className="h-4 w-4 mr-2" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="stakeholders">
              <UserCheck className="h-4 w-4 mr-2" />
              Stakeholders
            </TabsTrigger>
            <TabsTrigger value="files">
              <FileText className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
            <TabsTrigger value="activity">
              <History className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Gantt Chart Tab */}
          <TabsContent value="gantt">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>Visual timeline of milestones and tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <MilestoneGanttChart milestones={milestones} tasks={tasks} project={project} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kanban Board Tab */}
          <TabsContent value="kanban">
            <Card>
              <CardHeader>
                <CardTitle>Task Board</CardTitle>
                <CardDescription>Manage tasks with drag-and-drop</CardDescription>
              </CardHeader>
              <CardContent>
                <TaskKanban
                  projectId={parseInt(id!)}
                  tasks={tasks}
                  milestones={milestones}
                  members={members}
                  onTasksChange={() => loadProject(parseInt(id!))}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Milestones</CardTitle>
                  <CardDescription>Track project milestones and deadlines</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowMilestoneForm(!showMilestoneForm)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </CardHeader>
              <CardContent>
                {showMilestoneForm && (
                  <form onSubmit={handleAddMilestone} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Milestone Name *</Label>
                        <Input
                          value={newMilestone.name}
                          onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                          placeholder="Enter milestone name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={newMilestone.start_date}
                          onChange={(e) => setNewMilestone({ ...newMilestone, start_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={newMilestone.due_date}
                          onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <Label>Description</Label>
                      <Textarea
                        value={newMilestone.description}
                        onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                        placeholder="Describe this milestone"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">Save</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowMilestoneForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {milestones.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No milestones yet</p>
                ) : (
                  <div className="space-y-3">
                    {milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          milestone.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white'
                        }`}
                      >
                        <button
                          onClick={() => handleToggleMilestone(milestone)}
                          className="mt-0.5"
                        >
                          {milestone.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className={`font-medium ${milestone.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                            {milestone.name}
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
                          )}
                          {milestone.due_date && (
                            <div className="text-xs text-gray-400 mt-1">
                              Due: {formatDate(milestone.due_date)}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMilestone(milestone.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>People working on this project</CardDescription>
                </div>
                <AddMemberDialog
                  projectId={parseInt(id!)}
                  existingMembers={members}
                  onMemberAdded={() => loadProject(parseInt(id!))}
                />
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No team members yet. Add members to get started.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border group hover:border-gray-300 transition-colors">
                        <Avatar>
                          <AvatarFallback>
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{member.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{member.role}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Log Tab */}
          <TabsContent value="time">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Time Log</CardTitle>
                  <CardDescription>Hours logged to this project</CardDescription>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={timeLogView === 'calendar' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeLogView('calendar')}
                  >
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Calendar
                  </Button>
                  <Button
                    variant={timeLogView === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeLogView('list')}
                  >
                    <List className="h-4 w-4 mr-1" />
                    List
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {timeLogView === 'calendar' ? (
                  <TimeLogCalendar projectId={parseInt(id!)} />
                ) : timeEntries.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No time entries</p>
                ) : (
                  <div className="space-y-2">
                    {timeEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <div className="font-medium text-sm">{entry.user_name}</div>
                          <div className="text-xs text-gray-500">{formatDate(entry.date)}</div>
                          {entry.description && (
                            <div className="text-sm text-gray-600 mt-1">{entry.description}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{entry.hours}h</div>
                          {entry.billable && entry.hourly_rate && (
                            <div className="text-xs text-gray-500">
                              {formatCurrency(entry.hours * entry.hourly_rate)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget">
            <Card>
              <CardHeader>
                <CardTitle>Budget Breakdown</CardTitle>
                <CardDescription>Detailed breakdown of project costs by category</CardDescription>
              </CardHeader>
              <CardContent>
                <BudgetBreakdownTab projectId={parseInt(id!)} projectBudget={project.budget} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stakeholders Tab */}
          <TabsContent value="stakeholders">
            <Card>
              <CardHeader>
                <CardTitle>Business Stakeholders</CardTitle>
                <CardDescription>Key business contacts and decision makers</CardDescription>
              </CardHeader>
              <CardContent>
                <StakeholdersTab projectId={parseInt(id!)} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>Project Documents</CardTitle>
                <CardDescription>Business case, proposals, and other project documents</CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectFilesTab projectId={parseInt(id!)} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Complete audit trail of all project changes</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityLogTab projectId={parseInt(id!)} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
