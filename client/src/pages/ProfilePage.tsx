import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Mail,
  MapPin,
  Phone,
  Linkedin,
  Briefcase,
  Calendar,
  Edit2,
  Save,
  User,
  Shield,
} from 'lucide-react';
import type { UserProfile, UpdateProfileData, ActivityData } from '../types';

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<UpdateProfileData>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileData, activityResponse] = await Promise.all([
        userApi.getProfile(),
        user?.id ? userApi.getActivityHeatmap(user.id) : Promise.resolve([]),
      ]);
      setProfile(profileData);
      setActivityData(activityResponse);
      setEditData({
        name: profileData.name,
        avatar_url: profileData.avatar_url || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        phone: profileData.phone || '',
        linkedin_url: profileData.linkedin_url || '',
        department: profileData.department || '',
        title: profileData.title || '',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      const updatedProfile = await userApi.updateProfile(editData);
      setProfile(updatedProfile);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center md:items-start">
          <Avatar className="h-48 w-48 md:h-64 md:w-64">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.name} />
            ) : null}
            <AvatarFallback className="text-4xl">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-4 w-full md:w-auto">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Avatar URL</Label>
                  <Input
                    value={editData.avatar_url || ''}
                    onChange={(e) => setEditData({ ...editData, avatar_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    value={editData.bio || ''}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      value={editData.department || ''}
                      onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={editData.title || ''}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={editData.location || ''}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input
                    value={editData.linkedin_url || ''}
                    onChange={(e) => setEditData({ ...editData, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            {profile.is_admin && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
            )}
          </div>

          {(profile.title || profile.department) && (
            <p className="text-lg text-muted-foreground mb-4">
              {profile.title}
              {profile.title && profile.department && ' • '}
              {profile.department}
            </p>
          )}

          {profile.bio && (
            <p className="text-muted-foreground mb-4">{profile.bio}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {profile.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${profile.email}`} className="hover:text-primary">
                  {profile.email}
                </a>
              </div>
            )}

            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}

            {profile.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <a href={`tel:${profile.phone}`} className="hover:text-primary">
                  {profile.phone}
                </a>
              </div>
            )}

            {profile.linkedin_url && (
              <div className="flex items-center gap-1">
                <Linkedin className="h-4 w-4" />
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  LinkedIn
                </a>
              </div>
            )}

            {profile.start_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Joined {formatDate(profile.start_date)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contribution Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap data={activityData} />
        </CardContent>
      </Card>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm">{profile.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Employment Type</span>
              <span className="text-sm capitalize">{profile.employment_type || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="text-sm capitalize">{profile.role || 'Member'}</span>
            </div>
            {profile.created_at && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Account Created</span>
                <span className="text-sm">{formatDate(profile.created_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Work Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Department</span>
              <span className="text-sm">{profile.department || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Title</span>
              <span className="text-sm">{profile.title || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Hourly Rate</span>
              <span className="text-sm">
                {profile.hourly_rate ? `$${profile.hourly_rate}/hr` : 'N/A'}
              </span>
            </div>
            {profile.start_date && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Start Date</span>
                <span className="text-sm">{formatDate(profile.start_date)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
