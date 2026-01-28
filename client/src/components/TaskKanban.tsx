import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, GripVertical, Calendar, User, Flag, Clock, Trash2 } from 'lucide-react';
import { projectApi } from '../services/api';
import type { Task, Milestone, ProjectMember, CreateTaskData } from '../types';
import './TaskKanban.css';

interface TaskKanbanProps {
  projectId: number;
  tasks: Task[];
  milestones: Milestone[];
  members: ProjectMember[];
  onTasksChange: () => void;
}

const columns: { id: Task['status']; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: '#94a3b8' },
  { id: 'in_progress', title: 'In Progress', color: '#3b82f6' },
  { id: 'review', title: 'Review', color: '#f59e0b' },
  { id: 'completed', title: 'Completed', color: '#22c55e' },
];

const priorityColors: Record<string, string> = {
  low: 'secondary',
  medium: 'default',
  high: 'warning',
  critical: 'destructive',
};

export function TaskKanban({ projectId, tasks, milestones, members, onTasksChange }: TaskKanbanProps) {
  // Local state for optimistic updates
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState<CreateTaskData>({
    name: '',
    description: '',
    priority: 'medium',
    status: 'todo',
  });

  // Sync local state when props change (e.g., from other data refreshes)
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const getTasksByStatus = (status: Task['status']) => {
    return localTasks.filter(task => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      const previousTasks = localTasks;
      const taskId = draggedTask.id;

      // Optimistic update - update local state immediately
      setLocalTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status } : t
      ));

      try {
        await projectApi.updateTaskStatus(projectId, taskId, status);
        // No need to call onTasksChange() - local state is already updated
      } catch (error) {
        console.error('Failed to update task status:', error);
        // Rollback on failure
        setLocalTasks(previousTasks);
      }
    }
    setDraggedTask(null);
  };

  const handleAddTask = async () => {
    if (!newTask.name.trim()) return;
    try {
      const createdTask = await projectApi.createTask(projectId, newTask);
      // Add the new task to local state
      setLocalTasks(prev => [...prev, createdTask]);
      setNewTask({
        name: '',
        description: '',
        priority: 'medium',
        status: 'todo',
      });
      setIsAddingTask(false);
      // Optionally notify parent to refresh other data (e.g., task counts)
      onTasksChange();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Delete this task?')) return;
    const previousTasks = localTasks;

    // Optimistic update - remove from local state immediately
    setLocalTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await projectApi.deleteTask(projectId, taskId);
      // Optionally notify parent to refresh other data (e.g., task counts)
      onTasksChange();
    } catch (error) {
      console.error('Failed to delete task:', error);
      // Rollback on failure
      setLocalTasks(previousTasks);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="task-kanban">
      <div className="kanban-header">
        <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Task Name *</Label>
                <Input
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  placeholder="Enter task name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newTask.description || ''}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Task description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value as Task['priority'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={newTask.status}
                    onValueChange={(value) => setNewTask({ ...newTask, status: value as Task['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select
                    value={newTask.assignee_id?.toString() || ''}
                    onValueChange={(value) => setNewTask({ ...newTask, assignee_id: value ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Milestone</Label>
                  <Select
                    value={newTask.milestone_id?.toString() || ''}
                    onValueChange={(value) => setNewTask({ ...newTask, milestone_id: value ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select milestone" />
                    </SelectTrigger>
                    <SelectContent>
                      {milestones.map((milestone) => (
                        <SelectItem key={milestone.id} value={milestone.id.toString()}>
                          {milestone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newTask.due_date || ''}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Hours</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={newTask.estimated_hours || ''}
                    onChange={(e) => setNewTask({ ...newTask, estimated_hours: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingTask(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTask}>
                  Add Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="kanban-columns">
        {columns.map((column) => (
          <div
            key={column.id}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="kanban-column-header" style={{ borderTopColor: column.color }}>
              <span className="column-title">{column.title}</span>
              <Badge variant="secondary" className="column-count">
                {getTasksByStatus(column.id).length}
              </Badge>
            </div>
            <div className="kanban-column-body">
              {getTasksByStatus(column.id).map((task) => (
                <Card
                  key={task.id}
                  className={`kanban-card ${draggedTask?.id === task.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                >
                  <CardContent className="p-3">
                    <div className="kanban-card-header">
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                      <Badge variant={priorityColors[task.priority] as 'default' | 'secondary' | 'destructive' | 'outline'}>
                        {task.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-auto text-gray-400 hover:text-red-500"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <h4 className="kanban-card-title">{task.name}</h4>
                    {task.description && (
                      <p className="kanban-card-description">{task.description}</p>
                    )}
                    <div className="kanban-card-meta">
                      {task.assignee_name && (
                        <span className="meta-item">
                          <User className="h-3 w-3" />
                          {task.assignee_name}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="meta-item">
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.due_date)}
                        </span>
                      )}
                      {task.estimated_hours && (
                        <span className="meta-item">
                          <Clock className="h-3 w-3" />
                          {task.estimated_hours}h
                        </span>
                      )}
                      {task.milestone_name && (
                        <span className="meta-item">
                          <Flag className="h-3 w-3" />
                          {task.milestone_name}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
