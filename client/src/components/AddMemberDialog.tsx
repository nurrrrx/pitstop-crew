import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { userApi, projectApi } from '../services/api';
import type { User, ProjectMember } from '../types';

interface AddMemberDialogProps {
  projectId: number;
  existingMembers: ProjectMember[];
  onMemberAdded: () => void;
}

const MEMBER_ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'lead', label: 'Lead' },
  { value: 'manager', label: 'Manager' },
  { value: 'developer', label: 'Developer' },
  { value: 'designer', label: 'Designer' },
  { value: 'analyst', label: 'Analyst' },
];

export function AddMemberDialog({ projectId, existingMembers, onMemberAdded }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('member');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      const allUsers = await userApi.getAll();
      // Filter out users who are already members
      const existingIds = new Set(existingMembers.map(m => m.id));
      const availableUsers = allUsers.filter(u => !existingIds.has(u.id));
      setUsers(availableUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    try {
      await projectApi.addMember(projectId, parseInt(selectedUserId), selectedRole);
      setSelectedUserId('');
      setSelectedRole('member');
      setOpen(false);
      onMemberAdded();
    } catch (error) {
      console.error('Failed to add member:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Select User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {users.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No available users</div>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{user.name}</span>
                        <span className="text-muted-foreground text-xs">({user.email})</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEMBER_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !selectedUserId}>
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
