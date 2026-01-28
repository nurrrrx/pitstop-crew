import { query } from '../config/database.js';

export interface ActivityLog {
  id: number;
  project_id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  performed_by: number | null;
  performed_at: Date;
  metadata: Record<string, unknown> | null;
  // Joined fields
  performer_name?: string;
}

export interface CreateActivityLogData {
  entity_type: string;
  entity_id: number;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  performed_by?: number;
  metadata?: Record<string, unknown>;
}

export const ActivityLogModel = {
  async log(projectId: number, data: CreateActivityLogData): Promise<ActivityLog> {
    const result = await query(`
      INSERT INTO activity_log (project_id, entity_type, entity_id, action, field_name, old_value, new_value, performed_by, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      projectId,
      data.entity_type,
      data.entity_id,
      data.action,
      data.field_name || null,
      data.old_value || null,
      data.new_value || null,
      data.performed_by || null,
      data.metadata ? JSON.stringify(data.metadata) : null
    ]);
    return result.rows[0];
  },

  async logMultipleFields(
    projectId: number,
    entityType: string,
    entityId: number,
    action: string,
    changes: { field: string; old: unknown; new: unknown }[],
    performedBy?: number
  ): Promise<void> {
    for (const change of changes) {
      await query(`
        INSERT INTO activity_log (project_id, entity_type, entity_id, action, field_name, old_value, new_value, performed_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        projectId,
        entityType,
        entityId,
        action,
        change.field,
        change.old !== null && change.old !== undefined ? String(change.old) : null,
        change.new !== null && change.new !== undefined ? String(change.new) : null,
        performedBy || null
      ]);
    }
  },

  async findByProject(projectId: number, limit: number = 50, offset: number = 0): Promise<ActivityLog[]> {
    const result = await query(`
      SELECT
        a.*,
        u.name as performer_name
      FROM activity_log a
      LEFT JOIN users u ON a.performed_by = u.id
      WHERE a.project_id = $1
      ORDER BY a.performed_at DESC
      LIMIT $2 OFFSET $3
    `, [projectId, limit, offset]);
    return result.rows;
  },

  async findByEntity(entityType: string, entityId: number): Promise<ActivityLog[]> {
    const result = await query(`
      SELECT
        a.*,
        u.name as performer_name
      FROM activity_log a
      LEFT JOIN users u ON a.performed_by = u.id
      WHERE a.entity_type = $1 AND a.entity_id = $2
      ORDER BY a.performed_at DESC
    `, [entityType, entityId]);
    return result.rows;
  },

  async countByProject(projectId: number): Promise<number> {
    const result = await query(`
      SELECT COUNT(*) as count FROM activity_log WHERE project_id = $1
    `, [projectId]);
    return parseInt(result.rows[0].count, 10);
  }
};
