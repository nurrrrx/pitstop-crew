import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit2, Star, Building, UserCircle } from 'lucide-react';
import { projectApi, userApi } from '../services/api';
import type { Stakeholder, StakeholderRole, CreateStakeholderData, User } from '../types';

interface StakeholdersTabProps {
  projectId: number;
}

const ROLE_CONFIG: Record<StakeholderRole, { label: string; color: string }> = {
  sponsor: { label: 'Sponsor', color: 'bg-purple-100 text-purple-700' },
  business_owner: { label: 'Business Owner', color: 'bg-blue-100 text-blue-700' },
  steering_committee: { label: 'Steering Committee', color: 'bg-amber-100 text-amber-700' },
  subject_matter_expert: { label: 'SME', color: 'bg-green-100 text-green-700' },
  end_user: { label: 'End User', color: 'bg-gray-100 text-gray-700' },
  other: { label: 'Other', color: 'bg-slate-100 text-slate-700' },
};

const ROLES: StakeholderRole[] = [
  'sponsor',
  'business_owner',
  'steering_committee',
  'subject_matter_expert',
  'end_user',
  'other'
];

export function StakeholdersTab({ projectId }: StakeholdersTabProps) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  const [stakeholderType, setStakeholderType] = useState<'internal' | 'external'>('internal');
  const [formData, setFormData] = useState<CreateStakeholderData>({
    role: 'business_owner',
    is_primary: false,
  });

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stakeholdersData, usersData] = await Promise.all([
        projectApi.getStakeholders(projectId),
        userApi.getAll(),
      ]);
      setStakeholders(stakeholdersData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load stakeholders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingStakeholder) {
        await projectApi.updateStakeholder(projectId, editingStakeholder.id, formData);
      } else {
        await projectApi.createStakeholder(projectId, formData);
      }
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save stakeholder:', error);
    }
  };

  const handleDelete = async (stakeholderId: number) => {
    if (!confirm('Remove this stakeholder?')) return;
    try {
      await projectApi.deleteStakeholder(projectId, stakeholderId);
      loadData();
    } catch (error) {
      console.error('Failed to delete stakeholder:', error);
    }
  };

  const handleEdit = (stakeholder: Stakeholder) => {
    setEditingStakeholder(stakeholder);
    setStakeholderType(stakeholder.user_id ? 'internal' : 'external');
    setFormData({
      user_id: stakeholder.user_id || undefined,
      external_name: stakeholder.external_name || undefined,
      external_email: stakeholder.external_email || undefined,
      external_organization: stakeholder.external_organization || undefined,
      role: stakeholder.role,
      is_primary: stakeholder.is_primary,
      notes: stakeholder.notes || undefined,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      role: 'business_owner',
      is_primary: false,
    });
    setEditingStakeholder(null);
    setStakeholderType('internal');
    setIsDialogOpen(false);
  };

  const getStakeholderName = (stakeholder: Stakeholder) => {
    return stakeholder.user_name || stakeholder.external_name || 'Unknown';
  };

  const getStakeholderEmail = (stakeholder: Stakeholder) => {
    return stakeholder.user_email || stakeholder.external_email;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isFormValid = () => {
    if (stakeholderType === 'internal') {
      return !!formData.user_id;
    }
    return !!formData.external_name;
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading stakeholders...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Stakeholder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStakeholder ? 'Edit Stakeholder' : 'Add Stakeholder'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Type Toggle */}
              {!editingStakeholder && (
                <Tabs value={stakeholderType} onValueChange={(v) => setStakeholderType(v as 'internal' | 'external')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="internal">
                      <UserCircle className="h-4 w-4 mr-2" />
                      Internal User
                    </TabsTrigger>
                    <TabsTrigger value="external">
                      <Building className="h-4 w-4 mr-2" />
                      External
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}

              {/* Internal User Selection */}
              {stakeholderType === 'internal' && (
                <div className="space-y-2">
                  <Label>Select User *</Label>
                  <Select
                    value={formData.user_id?.toString() || ''}
                    onValueChange={(value) => setFormData({ ...formData, user_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* External Contact Fields */}
              {stakeholderType === 'external' && (
                <>
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={formData.external_name || ''}
                      onChange={(e) => setFormData({ ...formData, external_name: e.target.value })}
                      placeholder="Contact name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.external_email || ''}
                        onChange={(e) => setFormData({ ...formData, external_email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Organization</Label>
                      <Input
                        value={formData.external_organization || ''}
                        onChange={(e) => setFormData({ ...formData, external_organization: e.target.value })}
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Common Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as StakeholderRole })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_CONFIG[role].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Primary Contact</Label>
                  <Select
                    value={formData.is_primary ? 'yes' : 'no'}
                    onValueChange={(value) => setFormData({ ...formData, is_primary: value === 'yes' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this stakeholder"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!isFormValid()}>
                  {editingStakeholder ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stakeholders List */}
      {stakeholders.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No stakeholders added yet. Add stakeholders to track business contacts.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stakeholders.map((stakeholder) => {
            const roleConfig = ROLE_CONFIG[stakeholder.role];
            return (
              <div
                key={stakeholder.id}
                className="flex items-start gap-3 p-4 rounded-lg border group hover:border-gray-300 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={stakeholder.user_id ? '' : 'bg-slate-100'}>
                    {getInitials(getStakeholderName(stakeholder))}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {getStakeholderName(stakeholder)}
                    </span>
                    {stakeholder.is_primary && (
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    )}
                    {!stakeholder.user_id && (
                      <Building className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {getStakeholderEmail(stakeholder)}
                  </div>
                  {stakeholder.external_organization && (
                    <div className="text-xs text-gray-400">
                      {stakeholder.external_organization}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={roleConfig.color}>
                      {roleConfig.label}
                    </Badge>
                  </div>
                  {stakeholder.notes && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {stakeholder.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(stakeholder)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(stakeholder.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
