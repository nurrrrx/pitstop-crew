import { query } from '../config/database.js';

export interface Task {
  id: number;
  project_id: number;
  milestone_id: number | null;
  assignee_id: number | null;
  name: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  assignee_name?: string;
  milestone_name?: string;
}

export interface CreateTaskData {
  project_id: number;
  milestone_id?: number;
  assignee_id?: number;
  name: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
}

export const TaskModel = {
  async findByProject(projectId: number): Promise<Task[]> {
    const result = await query(`
      SELECT t.*,
             u.name as assignee_name,
             m.name as milestone_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN milestones m ON t.milestone_id = m.id
      WHERE t.project_id = $1
      ORDER BY
        CASE t.status
          WHEN 'in_progress' THEN 1
          WHEN 'todo' THEN 2
          WHEN 'review' THEN 3
          WHEN 'completed' THEN 4
        END,
        CASE t.priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        t.due_date ASC NULLS LAST
    `, [projectId]);
    return result.rows;
  },

  async findById(id: number): Promise<Task | null> {
    const result = await query(`
      SELECT t.*,
             u.name as assignee_name,
             m.name as milestone_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN milestones m ON t.milestone_id = m.id
      WHERE t.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async create(data: CreateTaskData): Promise<Task> {
    const result = await query(`
      INSERT INTO tasks (project_id, milestone_id, assignee_id, name, description, status, priority, start_date, due_date, estimated_hours)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      data.project_id,
      data.milestone_id || null,
      data.assignee_id || null,
      data.name,
      data.description || null,
      data.status || 'todo',
      data.priority || 'medium',
      data.start_date || null,
      data.due_date || null,
      data.estimated_hours || null
    ]);
    return result.rows[0];
  },

  async update(id: number, data: Partial<CreateTaskData>): Promise<Task | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.milestone_id !== undefined) {
      fields.push(`milestone_id = $${paramCount++}`);
      values.push(data.milestone_id || null);
    }
    if (data.assignee_id !== undefined) {
      fields.push(`assignee_id = $${paramCount++}`);
      values.push(data.assignee_id || null);
    }
    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.priority !== undefined) {
      fields.push(`priority = $${paramCount++}`);
      values.push(data.priority);
    }
    if (data.start_date !== undefined) {
      fields.push(`start_date = $${paramCount++}`);
      values.push(data.start_date);
    }
    if (data.due_date !== undefined) {
      fields.push(`due_date = $${paramCount++}`);
      values.push(data.due_date);
    }
    if (data.estimated_hours !== undefined) {
      fields.push(`estimated_hours = $${paramCount++}`);
      values.push(data.estimated_hours);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM tasks WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async updateStatus(id: number, status: Task['status']): Promise<Task | null> {
    const result = await query(
      'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0] || null;
  }
};
