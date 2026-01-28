import { ActivityLogModel } from '../models/ActivityLog.js';

export type EntityType = 'project' | 'task' | 'milestone' | 'member' | 'stakeholder' | 'budget_item' | 'file';
export type ActionType = 'created' | 'updated' | 'deleted' | 'status_changed' | 'member_added' | 'member_removed';

interface AuditLogOptions {
  projectId: number;
  entityType: EntityType;
  entityId: number;
  action: ActionType;
  performedBy?: number;
  metadata?: Record<string, unknown>;
}

// Log a simple action (create, delete)
export async function logAction(options: AuditLogOptions): Promise<void> {
  await ActivityLogModel.log(options.projectId, {
    entity_type: options.entityType,
    entity_id: options.entityId,
    action: options.action,
    performed_by: options.performedBy,
    metadata: options.metadata
  });
}

// Log field changes for an update
export async function logFieldChanges(
  options: Omit<AuditLogOptions, 'action'>,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): Promise<void> {
  const changes: { field: string; old: unknown; new: unknown }[] = [];

  for (const key of Object.keys(newValues)) {
    if (oldValues[key] !== newValues[key]) {
      changes.push({
        field: key,
        old: oldValues[key],
        new: newValues[key]
      });
    }
  }

  if (changes.length > 0) {
    await ActivityLogModel.logMultipleFields(
      options.projectId,
      options.entityType,
      options.entityId,
      'updated',
      changes,
      options.performedBy
    );
  }
}

// Helper to extract relevant fields from an object for comparison
export function extractFields<T extends Record<string, unknown>>(obj: T, fields: (keyof T)[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in obj) {
      result[field as string] = obj[field];
    }
  }
  return result;
}
