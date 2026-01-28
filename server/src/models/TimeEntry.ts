import { query } from '../config/database.js';

export interface TimeEntry {
  id: number;
  project_id: number;
  user_id: number;
  hours: number;
  description: string | null;
  date: string;
  billable: boolean;
  hourly_rate: number | null;
  created_at: Date;
}

export interface CreateTimeEntryData {
  project_id: number;
  user_id: number;
  hours: number;
  description?: string;
  date: string;
  billable?: boolean;
  hourly_rate?: number;
}

export interface TimeEntryWithDetails extends TimeEntry {
  user_name?: string;
  project_name?: string;
}

export const TimeEntryModel = {
  async findByProject(projectId: number): Promise<TimeEntryWithDetails[]> {
    const result = await query(`
      SELECT te.*, u.name as user_name, p.name as project_name
      FROM time_entries te
      JOIN users u ON te.user_id = u.id
      JOIN projects p ON te.project_id = p.id
      WHERE te.project_id = $1
      ORDER BY te.date DESC, te.created_at DESC
    `, [projectId]);
    return result.rows;
  },

  async findByUser(userId: number): Promise<TimeEntryWithDetails[]> {
    const result = await query(`
      SELECT te.*, u.name as user_name, p.name as project_name
      FROM time_entries te
      JOIN users u ON te.user_id = u.id
      JOIN projects p ON te.project_id = p.id
      WHERE te.user_id = $1
      ORDER BY te.date DESC, te.created_at DESC
    `, [userId]);
    return result.rows;
  },

  async findByUserAndDateRange(userId: number, startDate: string, endDate: string): Promise<TimeEntryWithDetails[]> {
    const result = await query(`
      SELECT te.*, u.name as user_name, p.name as project_name
      FROM time_entries te
      JOIN users u ON te.user_id = u.id
      JOIN projects p ON te.project_id = p.id
      WHERE te.user_id = $1 AND te.date >= $2 AND te.date <= $3
      ORDER BY te.date DESC, te.created_at DESC
    `, [userId, startDate, endDate]);
    return result.rows;
  },

  async create(data: CreateTimeEntryData): Promise<TimeEntry> {
    const result = await query(`
      INSERT INTO time_entries (project_id, user_id, hours, description, date, billable, hourly_rate)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      data.project_id,
      data.user_id,
      data.hours,
      data.description || null,
      data.date,
      data.billable !== false,
      data.hourly_rate || null
    ]);

    // Update project spent amount
    if (data.billable !== false && data.hourly_rate) {
      await query(`
        UPDATE projects
        SET spent = spent + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [data.hours * data.hourly_rate, data.project_id]);
    }

    return result.rows[0];
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM time_entries WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async getTotalHoursByProject(projectId: number): Promise<number> {
    const result = await query(`
      SELECT COALESCE(SUM(hours), 0) as total_hours
      FROM time_entries
      WHERE project_id = $1
    `, [projectId]);
    return parseFloat(result.rows[0].total_hours);
  },

  async getProjectSummary(projectId: number) {
    const result = await query(`
      SELECT
        COALESCE(SUM(hours), 0) as total_hours,
        COALESCE(SUM(CASE WHEN billable THEN hours * COALESCE(hourly_rate, 0) ELSE 0 END), 0) as total_cost,
        COUNT(DISTINCT user_id) as contributors
      FROM time_entries
      WHERE project_id = $1
    `, [projectId]);
    return result.rows[0];
  }
};
