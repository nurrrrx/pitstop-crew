import { pool } from '../config/database.js';

export interface AdHocRequest {
  id: number;
  title: string;
  description: string | null;
  requestor_name: string;
  requestor_email: string | null;
  requestor_department: string | null;
  assigned_to: number | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number;
  project_id: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  assigned_to_name?: string;
  project_name?: string;
  comment_count?: number;
}

export interface CreateAdHocRequestData {
  title: string;
  description?: string;
  requestor_name: string;
  requestor_email?: string;
  requestor_department?: string;
  assigned_to?: number;
  priority?: AdHocRequest['priority'];
  status?: AdHocRequest['status'];
  due_date?: string;
  estimated_hours?: number;
  project_id?: number;
}

export interface RequestComment {
  id: number;
  request_id: number;
  user_id: number | null;
  comment: string;
  created_at: string;
  user_name?: string;
}

export class AdHocRequestModel {
  // Get all requests with optional filters
  static async getAll(filters?: {
    status?: string;
    assigned_to?: number;
    requestor?: string;
  }): Promise<AdHocRequest[]> {
    let query = `
      SELECT
        r.*,
        u.name as assigned_to_name,
        p.name as project_name,
        (SELECT COUNT(*) FROM adhoc_request_comments WHERE request_id = r.id) as comment_count
      FROM adhoc_requests r
      LEFT JOIN users u ON r.assigned_to = u.id
      LEFT JOIN projects p ON r.project_id = p.id
    `;

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      conditions.push(`r.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.assigned_to) {
      conditions.push(`r.assigned_to = $${paramIndex}`);
      params.push(filters.assigned_to);
      paramIndex++;
    }

    if (filters?.requestor) {
      conditions.push(`r.requestor_name ILIKE $${paramIndex}`);
      params.push(`%${filters.requestor}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY
      CASE r.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      r.due_date ASC NULLS LAST,
      r.created_at DESC
    `;

    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      ...row,
      estimated_hours: row.estimated_hours ? parseFloat(row.estimated_hours) : null,
      actual_hours: parseFloat(row.actual_hours) || 0,
      comment_count: parseInt(row.comment_count) || 0,
    }));
  }

  // Get a single request by ID
  static async getById(id: number): Promise<AdHocRequest | null> {
    const result = await pool.query(
      `SELECT
        r.*,
        u.name as assigned_to_name,
        p.name as project_name,
        (SELECT COUNT(*) FROM adhoc_request_comments WHERE request_id = r.id) as comment_count
      FROM adhoc_requests r
      LEFT JOIN users u ON r.assigned_to = u.id
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      estimated_hours: row.estimated_hours ? parseFloat(row.estimated_hours) : null,
      actual_hours: parseFloat(row.actual_hours) || 0,
      comment_count: parseInt(row.comment_count) || 0,
    };
  }

  // Create a new request
  static async create(data: CreateAdHocRequestData): Promise<AdHocRequest> {
    const result = await pool.query(
      `INSERT INTO adhoc_requests
        (title, description, requestor_name, requestor_email, requestor_department,
         assigned_to, priority, status, due_date, estimated_hours, project_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.title,
        data.description || null,
        data.requestor_name,
        data.requestor_email || null,
        data.requestor_department || null,
        data.assigned_to || null,
        data.priority || 'medium',
        data.status || 'new',
        data.due_date || null,
        data.estimated_hours || null,
        data.project_id || null,
      ]
    );

    return this.getById(result.rows[0].id) as Promise<AdHocRequest>;
  }

  // Update a request
  static async update(id: number, data: Partial<CreateAdHocRequestData> & { actual_hours?: number; status?: string }): Promise<AdHocRequest | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'title', 'description', 'requestor_name', 'requestor_email', 'requestor_department',
      'assigned_to', 'priority', 'status', 'due_date', 'estimated_hours', 'actual_hours', 'project_id'
    ];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value === undefined ? null : value);
        paramIndex++;
      }
    }

    // Handle status changes
    if (data.status === 'completed') {
      fields.push(`completed_at = CURRENT_TIMESTAMP`);
    } else if (data.status && data.status !== 'completed') {
      fields.push(`completed_at = NULL`);
    }

    if (fields.length === 0) return this.getById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await pool.query(
      `UPDATE adhoc_requests SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    return this.getById(id);
  }

  // Delete a request
  static async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM adhoc_requests WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows.length > 0;
  }

  // Get comments for a request
  static async getComments(requestId: number): Promise<RequestComment[]> {
    const result = await pool.query(
      `SELECT
        c.*, u.name as user_name
      FROM adhoc_request_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.request_id = $1
      ORDER BY c.created_at ASC`,
      [requestId]
    );
    return result.rows;
  }

  // Add a comment
  static async addComment(requestId: number, userId: number, comment: string): Promise<RequestComment> {
    const result = await pool.query(
      `INSERT INTO adhoc_request_comments (request_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [requestId, userId, comment]
    );

    // Get the comment with user name
    const fullResult = await pool.query(
      `SELECT c.*, u.name as user_name
       FROM adhoc_request_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [result.rows[0].id]
    );

    return fullResult.rows[0];
  }

  // Get stats
  static async getStats(): Promise<{
    total: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    overdue: number;
  }> {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'new') as new,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'on_hold') as on_hold,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent,
        COUNT(*) FILTER (WHERE priority = 'high') as high,
        COUNT(*) FILTER (WHERE priority = 'medium') as medium,
        COUNT(*) FILTER (WHERE priority = 'low') as low,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled')) as overdue
      FROM adhoc_requests
    `);

    const row = result.rows[0];
    return {
      total: parseInt(row.total),
      by_status: {
        new: parseInt(row.new),
        in_progress: parseInt(row.in_progress),
        on_hold: parseInt(row.on_hold),
        completed: parseInt(row.completed),
        cancelled: parseInt(row.cancelled),
      },
      by_priority: {
        urgent: parseInt(row.urgent),
        high: parseInt(row.high),
        medium: parseInt(row.medium),
        low: parseInt(row.low),
      },
      overdue: parseInt(row.overdue),
    };
  }
}
