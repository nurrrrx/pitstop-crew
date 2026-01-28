import { pool } from '../config/database.js';

export interface CrewMember {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar_url: string | null;
  hourly_rate: number;
  employment_type: 'fte' | 'contractor';
  department: string | null;
  title: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  // Cost calculation fields
  band?: string | null; // 'G', 'H', 'I' for FTE
  rate_category?: string | null; // 'A', 'AA', 'AAA', 'AAAA' for contractors
  daily_rate?: number;
  monthly_rate?: number;
  // Computed fields
  total_hours?: number;
  total_projects?: number;
  current_projects?: number;
  chargeability?: number;
}

export interface CostPlan {
  id: number;
  user_id: number;
  year: number;
  month: number;
  planned_hours: number;
  planned_rate: number;
  actual_hours: number;
  actual_cost: number;
  notes: string | null;
}

export interface Deliverable {
  id: number;
  project_id: number;
  user_id: number | null;
  name: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  project_name?: string;
}

export interface CollaboratorInfo {
  user_id: number;
  name: string;
  projects_together: number;
  hours_together: number;
}

export interface MonthlyStats {
  year: number;
  month: number;
  hours: number;
  cost: number;
  projects: number;
}

export interface CreateCrewMemberData {
  email: string;
  name: string;
  password?: string;
  role?: string;
  hourly_rate?: number;
  employment_type?: 'fte' | 'contractor';
  department?: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  // Cost calculation fields
  band?: string; // 'G', 'H', 'I' for FTE
  rate_category?: string; // 'A', 'AA', 'AAA', 'AAAA' for contractors
  daily_rate?: number;
  monthly_rate?: number;
}

export class Crew {
  // Create a new crew member
  static async create(data: CreateCrewMemberData): Promise<CrewMember> {
    // For crew members without login, use a placeholder password hash
    const passwordHash = data.password
      ? await import('bcryptjs').then(bcrypt => bcrypt.default.hash(data.password!, 10))
      : '$2a$10$placeholder.no.login.allowed';

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, hourly_rate, employment_type, department, title, start_date, end_date, band, rate_category, daily_rate, monthly_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id, email, name, role, avatar_url, hourly_rate, employment_type, department, title, start_date, end_date, created_at, band, rate_category, daily_rate, monthly_rate`,
      [
        data.email,
        passwordHash,
        data.name,
        data.role || 'member',
        data.hourly_rate || 0,
        data.employment_type || 'fte',
        data.department || null,
        data.title || null,
        data.start_date || null,
        data.end_date || null,
        data.band || null,
        data.rate_category || null,
        data.daily_rate || 0,
        data.monthly_rate || 0,
      ]
    );

    return {
      ...result.rows[0],
      total_hours: 0,
      total_projects: 0,
      current_projects: 0,
    };
  }

  // Delete/archive a crew member (set end_date instead of deleting)
  static async archive(id: number, endDate?: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE users SET end_date = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id`,
      [id, endDate || new Date().toISOString().split('T')[0]]
    );
    return result.rows.length > 0;
  }

  // Permanently delete a crew member
  static async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows.length > 0;
  }

  // Reactivate a crew member (remove end_date)
  static async reactivate(id: number): Promise<boolean> {
    const result = await pool.query(
      `UPDATE users SET end_date = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows.length > 0;
  }

  // Get all crew members with stats
  static async getAll(employmentType?: 'fte' | 'contractor', includeInactive?: boolean): Promise<CrewMember[]> {
    let query = `
      SELECT
        u.id, u.email, u.name, u.role, u.avatar_url, u.hourly_rate,
        u.employment_type, u.department, u.title, u.start_date, u.end_date, u.created_at,
        u.band, u.rate_category, u.daily_rate, u.monthly_rate,
        COALESCE(SUM(te.hours), 0) as total_hours,
        COUNT(DISTINCT pm.project_id) as total_projects,
        COUNT(DISTINCT CASE WHEN p.status IN ('planning', 'active') THEN pm.project_id END) as current_projects
      FROM users u
      LEFT JOIN time_entries te ON u.id = te.user_id
      LEFT JOIN project_members pm ON u.id = pm.user_id
      LEFT JOIN projects p ON pm.project_id = p.id
    `;

    const conditions: string[] = [];
    const params: (string | boolean)[] = [];
    let paramIndex = 1;

    if (employmentType) {
      conditions.push(`u.employment_type = $${paramIndex}`);
      params.push(employmentType);
      paramIndex++;
    }

    if (!includeInactive) {
      conditions.push(`(u.end_date IS NULL OR u.end_date > CURRENT_DATE)`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY u.id
      ORDER BY u.end_date IS NOT NULL, u.name
    `;

    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      ...row,
      total_hours: parseFloat(row.total_hours) || 0,
      total_projects: parseInt(row.total_projects) || 0,
      current_projects: parseInt(row.current_projects) || 0,
    }));
  }

  // Get crew member by ID with detailed stats
  static async getById(id: number): Promise<CrewMember | null> {
    const result = await pool.query(
      `SELECT
        u.id, u.email, u.name, u.role, u.avatar_url, u.hourly_rate,
        u.employment_type, u.department, u.title, u.start_date, u.end_date, u.created_at,
        u.band, u.rate_category, u.daily_rate, u.monthly_rate,
        COALESCE(SUM(te.hours), 0) as total_hours,
        COUNT(DISTINCT pm.project_id) as total_projects,
        COUNT(DISTINCT CASE WHEN p.status IN ('planning', 'active') THEN pm.project_id END) as current_projects
      FROM users u
      LEFT JOIN time_entries te ON u.id = te.user_id
      LEFT JOIN project_members pm ON u.id = pm.user_id
      LEFT JOIN projects p ON pm.project_id = p.id
      WHERE u.id = $1
      GROUP BY u.id`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      total_hours: parseFloat(row.total_hours) || 0,
      total_projects: parseInt(row.total_projects) || 0,
      current_projects: parseInt(row.current_projects) || 0,
    };
  }

  // Update crew member info
  static async update(id: number, data: Partial<CrewMember>): Promise<CrewMember | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const allowedFields = ['name', 'role', 'avatar_url', 'hourly_rate', 'employment_type', 'department', 'title', 'start_date', 'end_date', 'band', 'rate_category', 'daily_rate', 'monthly_rate'];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) return this.getById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    return this.getById(id);
  }

  // Get projects for a crew member
  static async getProjects(userId: number): Promise<{id: number; name: string; status: string; role: string; hours: number}[]> {
    const result = await pool.query(
      `SELECT
        p.id, p.name, p.status, pm.role,
        COALESCE(SUM(te.hours), 0) as hours
      FROM projects p
      INNER JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN time_entries te ON p.id = te.project_id AND te.user_id = $1
      WHERE pm.user_id = $1
      GROUP BY p.id, pm.role
      ORDER BY p.status = 'active' DESC, p.name`,
      [userId]
    );
    return result.rows.map(row => ({
      ...row,
      hours: parseFloat(row.hours) || 0,
    }));
  }

  // Get frequent collaborators
  static async getCollaborators(userId: number): Promise<CollaboratorInfo[]> {
    const result = await pool.query(
      `SELECT
        u.id as user_id,
        u.name,
        COUNT(DISTINCT pm1.project_id) as projects_together,
        COALESCE(SUM(te.hours), 0) as hours_together
      FROM users u
      INNER JOIN project_members pm2 ON u.id = pm2.user_id
      INNER JOIN project_members pm1 ON pm2.project_id = pm1.project_id AND pm1.user_id = $1
      LEFT JOIN time_entries te ON pm2.project_id = te.project_id AND te.user_id = u.id
      WHERE u.id != $1
      GROUP BY u.id
      ORDER BY projects_together DESC, hours_together DESC
      LIMIT 10`,
      [userId]
    );
    return result.rows.map(row => ({
      ...row,
      projects_together: parseInt(row.projects_together) || 0,
      hours_together: parseFloat(row.hours_together) || 0,
    }));
  }

  // Get monthly stats
  static async getMonthlyStats(userId: number, year?: number): Promise<MonthlyStats[]> {
    const currentYear = year || new Date().getFullYear();
    const result = await pool.query(
      `SELECT
        EXTRACT(YEAR FROM te.date)::int as year,
        EXTRACT(MONTH FROM te.date)::int as month,
        SUM(te.hours) as hours,
        SUM(CASE WHEN te.billable THEN te.hours * COALESCE(te.hourly_rate, u.hourly_rate, 0) ELSE 0 END) as cost,
        COUNT(DISTINCT te.project_id) as projects
      FROM time_entries te
      INNER JOIN users u ON te.user_id = u.id
      WHERE te.user_id = $1 AND EXTRACT(YEAR FROM te.date) = $2
      GROUP BY year, month
      ORDER BY year, month`,
      [userId, currentYear]
    );
    return result.rows.map(row => ({
      year: row.year,
      month: row.month,
      hours: parseFloat(row.hours) || 0,
      cost: parseFloat(row.cost) || 0,
      projects: parseInt(row.projects) || 0,
    }));
  }

  // Get average monthly cost (for FTEs - shows average without specific amounts)
  static async getAverageMonthlyCost(userId: number): Promise<{average_hours: number; average_projects: number}> {
    const result = await pool.query(
      `SELECT
        AVG(monthly_hours) as average_hours,
        AVG(monthly_projects) as average_projects
      FROM (
        SELECT
          EXTRACT(YEAR FROM te.date) as year,
          EXTRACT(MONTH FROM te.date) as month,
          SUM(te.hours) as monthly_hours,
          COUNT(DISTINCT te.project_id) as monthly_projects
        FROM time_entries te
        WHERE te.user_id = $1
        GROUP BY year, month
      ) monthly`,
      [userId]
    );

    const row = result.rows[0] || {};
    return {
      average_hours: parseFloat(row.average_hours) || 0,
      average_projects: parseFloat(row.average_projects) || 0,
    };
  }

  // Cost planning for contractors
  static async getCostPlans(userId: number, year?: number): Promise<CostPlan[]> {
    let query = `
      SELECT * FROM contractor_cost_plans
      WHERE user_id = $1
    `;
    const params: (number)[] = [userId];

    if (year) {
      query += ` AND year = $2`;
      params.push(year);
    }

    query += ` ORDER BY year DESC, month ASC`;

    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      ...row,
      planned_hours: parseFloat(row.planned_hours) || 0,
      planned_rate: parseFloat(row.planned_rate) || 0,
      actual_hours: parseFloat(row.actual_hours) || 0,
      actual_cost: parseFloat(row.actual_cost) || 0,
    }));
  }

  // Create or update cost plan
  static async upsertCostPlan(userId: number, year: number, month: number, data: Partial<CostPlan>): Promise<CostPlan> {
    const result = await pool.query(
      `INSERT INTO contractor_cost_plans (user_id, year, month, planned_hours, planned_rate, actual_hours, actual_cost, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, year, month)
       DO UPDATE SET
         planned_hours = COALESCE($4, contractor_cost_plans.planned_hours),
         planned_rate = COALESCE($5, contractor_cost_plans.planned_rate),
         actual_hours = COALESCE($6, contractor_cost_plans.actual_hours),
         actual_cost = COALESCE($7, contractor_cost_plans.actual_cost),
         notes = COALESCE($8, contractor_cost_plans.notes),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, year, month, data.planned_hours ?? 0, data.planned_rate ?? 0, data.actual_hours ?? 0, data.actual_cost ?? 0, data.notes ?? null]
    );

    const row = result.rows[0];
    return {
      ...row,
      planned_hours: parseFloat(row.planned_hours) || 0,
      planned_rate: parseFloat(row.planned_rate) || 0,
      actual_hours: parseFloat(row.actual_hours) || 0,
      actual_cost: parseFloat(row.actual_cost) || 0,
    };
  }

  // Get deliverables for a user
  static async getDeliverables(userId: number): Promise<Deliverable[]> {
    const result = await pool.query(
      `SELECT
        d.*, p.name as project_name
      FROM deliverables d
      LEFT JOIN projects p ON d.project_id = p.id
      WHERE d.user_id = $1
      ORDER BY d.status = 'pending' DESC, d.due_date ASC`,
      [userId]
    );
    return result.rows;
  }

  // Calculate chargeability (billable hours / total available hours)
  static async getChargeability(userId: number, startDate?: string, endDate?: string): Promise<{billable_hours: number; total_hours: number; chargeability: number}> {
    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT
        SUM(CASE WHEN billable THEN hours ELSE 0 END) as billable_hours,
        SUM(hours) as total_hours
      FROM time_entries
      WHERE user_id = $1 AND date >= $2 AND date <= $3`,
      [userId, start, end]
    );

    const row = result.rows[0] || {};
    const billableHours = parseFloat(row.billable_hours) || 0;
    const totalHours = parseFloat(row.total_hours) || 0;

    return {
      billable_hours: billableHours,
      total_hours: totalHours,
      chargeability: totalHours > 0 ? (billableHours / totalHours) * 100 : 0,
    };
  }
}
