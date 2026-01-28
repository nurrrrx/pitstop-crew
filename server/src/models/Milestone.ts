import { query } from '../config/database.js';

export interface Milestone {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMilestoneData {
  project_id: number;
  name: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  status?: string;
}

export const MilestoneModel = {
  async findByProject(projectId: number): Promise<Milestone[]> {
    const result = await query(`
      SELECT * FROM milestones
      WHERE project_id = $1
      ORDER BY due_date ASC NULLS LAST, created_at ASC
    `, [projectId]);
    return result.rows;
  },

  async findById(id: number): Promise<Milestone | null> {
    const result = await query('SELECT * FROM milestones WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data: CreateMilestoneData): Promise<Milestone> {
    const result = await query(`
      INSERT INTO milestones (project_id, name, description, start_date, due_date, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      data.project_id,
      data.name,
      data.description || null,
      data.start_date || null,
      data.due_date || null,
      data.status || 'pending'
    ]);
    return result.rows[0];
  },

  async update(id: number, data: Partial<CreateMilestoneData>): Promise<Milestone | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.start_date !== undefined) {
      fields.push(`start_date = $${paramCount++}`);
      values.push(data.start_date);
    }
    if (data.due_date !== undefined) {
      fields.push(`due_date = $${paramCount++}`);
      values.push(data.due_date);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(data.status);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE milestones SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM milestones WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
};
