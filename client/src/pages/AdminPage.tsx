import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import type { RegistrationRequest } from '../types';

export function AdminPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadRequests();
  }, [activeTab]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getRegistrationRequests(activeTab);
      setRequests(data);
    } catch (error) {
      console.error('Failed to load registration requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: RegistrationRequest) => {
    if (!confirm(`Approve registration for ${request.name}?`)) return;

    try {
      setProcessingId(request.id);
      await adminApi.approveRequest(request.id);
      loadRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      alert('Failed to approve registration');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (request: RegistrationRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingId(selectedRequest.id);
      await adminApi.rejectRequest(selectedRequest.id, rejectionReason);
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject registration');
    } finally {
      setProcessingId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage user registrations and system settings</p>
        </div>
      </div>

      {/* Registration Requests Card */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Requests</CardTitle>
          <CardDescription>Review and approve or reject user registration requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pending
                {activeTab !== 'pending' && pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Approved
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <XCircle className="h-4 w-4" />
                Rejected
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    {activeTab === 'pending' ? (
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    ) : activeTab === 'approved' ? (
                      <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <XCircle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    No {activeTab} registration requests
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                      {activeTab === 'pending' && <TableHead className="text-right">Actions</TableHead>}
                      {activeTab === 'rejected' && <TableHead>Reason</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(request.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{request.name}</p>
                              {request.title && (
                                <p className="text-xs text-muted-foreground">{request.title}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{request.email}</TableCell>
                        <TableCell>{request.department || '-'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(request.created_at)}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        {activeTab === 'pending' && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApprove(request)}
                                disabled={processingId === request.id}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openRejectDialog(request)}
                                disabled={processingId === request.id}
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        )}
                        {activeTab === 'rejected' && (
                          <TableCell className="max-w-xs">
                            <p className="text-sm text-muted-foreground truncate">
                              {request.rejection_reason || '-'}
                            </p>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Reject Registration
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject the registration request from{' '}
              <strong>{selectedRequest?.name}</strong>? Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processingId === selectedRequest?.id || !rejectionReason.trim()}
            >
              <UserX className="h-4 w-4 mr-2" />
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
