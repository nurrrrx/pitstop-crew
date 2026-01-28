import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FolderKanban,
  CheckSquare,
  Milestone,
  Users,
  UserCheck,
  Wallet,
  FileText,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { projectApi } from '../services/api';
import type { ActivityLog, EntityType, ActionType } from '../types';

interface ActivityLogTabProps {
  projectId: number;
}

const ENTITY_CONFIG: Record<EntityType, { label: string; icon: React.ElementType; color: string }> = {
  project: { label: 'Project', icon: FolderKanban, color: '#3b82f6' },
  task: { label: 'Task', icon: CheckSquare, color: '#10b981' },
  milestone: { label: 'Milestone', icon: Milestone, color: '#f59e0b' },
  member: { label: 'Member', icon: Users, color: '#8b5cf6' },
  stakeholder: { label: 'Stakeholder', icon: UserCheck, color: '#ec4899' },
  budget_item: { label: 'Budget', icon: Wallet, color: '#06b6d4' },
  file: { label: 'File', icon: FileText, color: '#6b7280' },
};

const ACTION_CONFIG: Record<ActionType, { label: string; icon: React.ElementType; color: string }> = {
  created: { label: 'Created', icon: Plus, color: '#10b981' },
  updated: { label: 'Updated', icon: Pencil, color: '#3b82f6' },
  deleted: { label: 'Deleted', icon: Trash2, color: '#ef4444' },
  status_changed: { label: 'Status changed', icon: RefreshCw, color: '#f59e0b' },
};

const ITEMS_PER_PAGE = 20;

export function ActivityLogTab({ projectId }: ActivityLogTabProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [entityFilter, setEntityFilter] = useState<string>('all');

  useEffect(() => {
    setOffset(0);
    loadLogs(0);
  }, [projectId, entityFilter]);

  const loadLogs = async (newOffset: number) => {
    try {
      setLoading(true);
      const data = await projectApi.getActivityLog(projectId, {
        entity_type: entityFilter !== 'all' ? entityFilter : undefined,
        limit: ITEMS_PER_PAGE,
        offset: newOffset,
      });
      setLogs(data.logs);
      setTotal(data.total);
      setOffset(newOffset);
    } catch (error) {
      console.error('Failed to load activity log:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    loadLogs(offset + ITEMS_PER_PAGE);
  };

  const loadPrevious = () => {
    loadLogs(Math.max(0, offset - ITEMS_PER_PAGE));
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatValue = (value: string | null) => {
    if (!value) return '-';
    // Try to parse JSON for better display
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object') {
        return JSON.stringify(parsed, null, 2);
      }
      return String(parsed);
    } catch {
      return value;
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getActionDescription = (log: ActivityLog) => {
    const entityConfig = ENTITY_CONFIG[log.entity_type];
    const actionConfig = ACTION_CONFIG[log.action];

    if (log.action === 'status_changed' && log.field_name === 'status') {
      return (
        <span>
          changed {entityConfig.label.toLowerCase()} status from{' '}
          <Badge variant="outline" className="mx-1">{formatValue(log.old_value)}</Badge>
          <ArrowRight className="h-3 w-3 inline mx-1" />
          <Badge variant="outline" className="mx-1">{formatValue(log.new_value)}</Badge>
        </span>
      );
    }

    if (log.action === 'updated' && log.field_name) {
      return (
        <span>
          updated {entityConfig.label.toLowerCase()}'s <strong>{log.field_name}</strong>
          {log.old_value && log.new_value && (
            <span>
              {' '}from <Badge variant="outline" className="mx-1">{formatValue(log.old_value)}</Badge>
              <ArrowRight className="h-3 w-3 inline mx-1" />
              <Badge variant="outline" className="mx-1">{formatValue(log.new_value)}</Badge>
            </span>
          )}
        </span>
      );
    }

    return (
      <span>
        {actionConfig.label.toLowerCase()} {entityConfig.label.toLowerCase()}
        {log.new_value && log.action === 'created' && (
          <strong className="ml-1">{formatValue(log.new_value)}</strong>
        )}
      </span>
    );
  };

  if (loading && logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading activity log...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {offset + 1} - {Math.min(offset + logs.length, total)} of {total} activities
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((entity) => (
              <SelectItem key={entity} value={entity}>
                {ENTITY_CONFIG[entity].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Log List */}
      {logs.length === 0 ? (
        <div className="text-center py-8">
          <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No activities recorded yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Changes to the project will be logged here.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log, index) => {
            const entityConfig = ENTITY_CONFIG[log.entity_type];
            const actionConfig = ACTION_CONFIG[log.action];
            const EntityIcon = entityConfig.icon;
            const ActionIcon = actionConfig.icon;

            return (
              <div
                key={log.id}
                className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 ${
                  index < logs.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                {/* User Avatar */}
                <Avatar className="h-8 w-8 mt-0.5">
                  <AvatarFallback className="text-xs">
                    {getInitials(log.performer_name)}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {log.performer_name || 'System'}
                    </span>
                    <span className="text-sm text-gray-600">
                      {getActionDescription(log)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: entityConfig.color + '15',
                        color: entityConfig.color
                      }}
                    >
                      <EntityIcon className="h-3 w-3" />
                      {entityConfig.label}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(log.performed_at)}
                    </span>
                  </div>
                </div>

                {/* Action Icon */}
                <div
                  className="p-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: actionConfig.color + '15' }}
                >
                  <ActionIcon
                    className="h-3.5 w-3.5"
                    style={{ color: actionConfig.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > ITEMS_PER_PAGE && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPrevious}
            disabled={offset === 0 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={offset + logs.length >= total || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
