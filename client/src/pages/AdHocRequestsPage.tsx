import { useState, useEffect } from 'react';
import { adhocApi, userApi } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  Circle,
  Pause,
  XCircle,
  Send,
  Trash2,
} from 'lucide-react';
import type { AdHocRequest, CreateAdHocRequestData, AdHocStats, RequestComment, User } from '../types';

const priorityColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'secondary',
  medium: 'default',
  high: 'destructive',
  urgent: 'destructive',
};

const statusIcons: Record<string, React.ReactNode> = {
  new: <Circle className="h-4 w-4 text-blue-500" />,
  in_progress: <Clock className="h-4 w-4 text-yellow-500" />,
  on_hold: <Pause className="h-4 w-4 text-gray-500" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  cancelled: <XCircle className="h-4 w-4 text-red-500" />,
};

export function AdHocRequestsPage() {
  const [requests, setRequests] = useState<AdHocRequest[]>([]);
  const [stats, setStats] = useState<AdHocStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdHocRequest | null>(null);
  const [comments, setComments] = useState<RequestComment[]>([]);
  const [newComment, setNewComment] = useState('');

  const [newRequest, setNewRequest] = useState<CreateAdHocRequestData>({
    title: '',
    description: '',
    requestor_name: '',
    requestor_email: '',
    requestor_department: '',
    priority: 'medium',
    due_date: '',
    estimated_hours: undefined,
  });

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, statsData, usersData] = await Promise.all([
        adhocApi.getAll(statusFilter ? { status: statusFilter } : undefined),
        adhocApi.getStats(),
        userApi.getAll(),
      ]);
      setRequests(requestsData);
      setStats(statsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (requestId: number) => {
    try {
      const data = await adhocApi.getComments(requestId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.title || !newRequest.requestor_name) return;

    try {
      await adhocApi.create(newRequest);
      setShowAddDialog(false);
      setNewRequest({
        title: '',
        description: '',
        requestor_name: '',
        requestor_email: '',
        requestor_department: '',
        priority: 'medium',
        due_date: '',
        estimated_hours: undefined,
      });
      loadData();
    } catch (error) {
      console.error('Failed to create request:', error);
      alert('Failed to create request');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await adhocApi.update(id, { status: status as AdHocRequest['status'] });
      loadData();
      if (selectedRequest?.id === id) {
        setSelectedRequest({ ...selectedRequest, status: status as AdHocRequest['status'] });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleAssign = async (id: number, userId: number | null) => {
    try {
      await adhocApi.update(id, { assigned_to: userId || undefined });
      loadData();
    } catch (error) {
      console.error('Failed to assign request:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      await adhocApi.delete(id);
      setSelectedRequest(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete request:', error);
    }
  };

  const handleAddComment = async () => {
    if (!selectedRequest || !newComment.trim()) return;

    try {
      await adhocApi.addComment(selectedRequest.id, newComment);
      setNewComment('');
      loadComments(selectedRequest.id);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const selectRequest = async (request: AdHocRequest) => {
    setSelectedRequest(request);
    loadComments(request.id);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (request: AdHocRequest) => {
    if (!request.due_date || ['completed', 'cancelled'].includes(request.status)) return false;
    return new Date(request.due_date) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-blue-500">{stats.by_status.new}</div>
                <div className="text-sm text-gray-500">New</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">{stats.by_status.in_progress}</div>
                <div className="text-sm text-gray-500">In Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-green-500">{stats.by_status.completed}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
                <div className="text-sm text-gray-500">Overdue</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Label className="text-sm">Filter by status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No requests found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <Card
                key={request.id}
                className={`cursor-pointer hover:border-primary transition-colors ${isOverdue(request) ? 'border-red-300' : ''}`}
                onClick={() => selectRequest(request)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className="pt-1">{statusIcons[request.status]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{request.title}</span>
                        <Badge variant={priorityColors[request.priority]}>
                          {request.priority}
                        </Badge>
                        {isOverdue(request) && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        From: {request.requestor_name}
                        {request.requestor_department && ` (${request.requestor_department})`}
                      </div>
                      {request.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{request.description}</p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-gray-500">Due: {formatDate(request.due_date)}</div>
                      {request.assigned_to_name && (
                        <div className="text-gray-400 mt-1">Assigned: {request.assigned_to_name}</div>
                      )}
                      {request.comment_count && request.comment_count > 0 && (
                        <div className="flex items-center justify-end gap-1 mt-1 text-gray-400">
                          <MessageSquare className="h-3 w-3" />
                          {request.comment_count}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedRequest.title}</DialogTitle>
                    <DialogDescription>
                      From {selectedRequest.requestor_name}
                      {selectedRequest.requestor_department && ` (${selectedRequest.requestor_department})`}
                    </DialogDescription>
                  </div>
                  <Badge variant={priorityColors[selectedRequest.priority]}>
                    {selectedRequest.priority}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Status and Assignment */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={selectedRequest.status}
                      onValueChange={(value) => handleUpdateStatus(selectedRequest.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assigned To</Label>
                    <Select
                      value={selectedRequest.assigned_to?.toString() || ''}
                      onValueChange={(value) => handleAssign(selectedRequest.id, value ? parseInt(value) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                {selectedRequest.description && (
                  <div>
                    <Label className="text-sm text-gray-500">Description</Label>
                    <p className="mt-1">{selectedRequest.description}</p>
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-500">Due Date</Label>
                    <div>{formatDate(selectedRequest.due_date)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Estimated Hours</Label>
                    <div>{selectedRequest.estimated_hours || '-'}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Requestor Email</Label>
                    <div>{selectedRequest.requestor_email || '-'}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Created</Label>
                    <div>{formatDate(selectedRequest.created_at)}</div>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <Label className="text-sm text-gray-500 mb-2 block">Comments</Label>
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-sm text-gray-400">No comments yet</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{comment.user_name || 'Unknown'}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{comment.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(selectedRequest.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Request Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Ad-Hoc Request</DialogTitle>
            <DialogDescription>Create a new request from a stakeholder</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddRequest} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newRequest.title}
                onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                placeholder="Request title"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Requestor Name *</Label>
                <Input
                  value={newRequest.requestor_name}
                  onChange={(e) => setNewRequest({ ...newRequest, requestor_name: e.target.value })}
                  placeholder="Who is requesting?"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Requestor Email</Label>
                <Input
                  type="email"
                  value={newRequest.requestor_email || ''}
                  onChange={(e) => setNewRequest({ ...newRequest, requestor_email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={newRequest.requestor_department || ''}
                  onChange={(e) => setNewRequest({ ...newRequest, requestor_department: e.target.value })}
                  placeholder="e.g., Marketing"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newRequest.priority}
                  onValueChange={(value: AdHocRequest['priority']) =>
                    setNewRequest({ ...newRequest, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newRequest.due_date || ''}
                  onChange={(e) => setNewRequest({ ...newRequest, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Hours</Label>
                <Input
                  type="number"
                  value={newRequest.estimated_hours || ''}
                  onChange={(e) => setNewRequest({ ...newRequest, estimated_hours: parseFloat(e.target.value) || undefined })}
                  placeholder="0"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newRequest.description || ''}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                placeholder="Describe the request..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
