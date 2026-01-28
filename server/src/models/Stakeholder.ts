import { query } from '../config/database.js';

export interface Stakeholder {
  id: number;
  project_id: number;
  user_id: number | null;
  external_name: string | null;
  external_email: string | null;
  external_organization: string | null;
  role: string;
  is_primary: boolean;
  notes: string | null;
  created_at: Date;
  // Joined fields
  user_name?: string;
  user_email?: string;
}

export interface CreateStakeholderData {
  user_id?: number;
  external_name?: string;
  external_email?: string;
  external_organization?: string;
  role: string;
  is_primary?: boolean;
  notes?: string;
}

export const StakeholderModel = {
  async findByProject(projectId: number): Promise<Stakeholder[]> {
    const result = await query(`
      SELECT
        s.*,
        u.name as user_name,
        u.email as user_email
      FROM project_stakeholders s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.project_id = $1
      ORDER BY s.is_primary DESC, s.role, COALESCE(s.external_name, u.name)
    `, [projectId]);
    return result.rows;
  },

  async findById(id: number): Promise<Stakeholder | null> {
    const result = await query(`
      SELECT
        s.*,
        u.name as user_name,
        u.email as user_email
      FROM project_stakeholders s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async create(projectId: number, data: CreateStakeholderData): Promise<Stakeholder> {
    const result = await query(`
      INSERT INTO project_stakeholders (project_id, user_id, external_name, external_email, external_organization, role, is_primary, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      projectId,
      data.user_id || null,
      data.external_name || null,
      data.external_email || null,
      data.external_organization || null,
      data.role,
      data.is_primary || false,
      data.notes || null
    ]);
    return result.rows[0];
  },

  async update(id: number, data: Partial<CreateStakeholderData>): Promise<Stakeholder | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.user_id !== undefined) {
      fields.push(`user_id = $${paramCount++}`);
      values.push(data.user_id);
    }
    if (data.external_name !== undefined) {
      fields.push(`external_name = $${paramCount++}`);
      values.push(data.external_name);
    }
    if (data.external_email !== undefined) {
      fields.push(`external_email = $${paramCount++}`);
      values.push(data.external_email);
    }
    if (data.external_organization !== undefined) {
      fields.push(`external_organization = $${paramCount++}`);
      values.push(data.external_organization);
    }
    if (data.role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(data.role);
    }
    if (data.is_primary !== undefined) {
      fields.push(`is_primary = $${paramCount++}`);
      values.push(data.is_primary);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${paramCount++}`);
      values.push(data.notes);
    }

    if (fields.length === 0) return null;

    values.push(id);

    const result = await query(`
      UPDATE project_stakeholders
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query(`
      DELETE FROM project_stakeholders WHERE id = $1
    `, [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async setPrimary(projectId: number, stakeholderId: number): Promise<void> {
    // First, unset all primary stakeholders for this project
    await query(`
      UPDATE project_stakeholders
      SET is_primary = false
      WHERE project_id = $1
    `, [projectId]);

    // Then set the specified stakeholder as primary
    await query(`
      UPDATE project_stakeholders
      SET is_primary = true
      WHERE id = $1
    `, [stakeholderId]);
  }
};
