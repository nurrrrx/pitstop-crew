import { query } from '../config/database.js';

export interface RegistrationRequest {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  department?: string;
  title?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number;
  reviewed_at?: Date;
  rejection_reason?: string;
  created_at: Date;
}

export interface CreateRegistrationData {
  email: string;
  password_hash: string;
  name: string;
  department?: string;
  title?: string;
}

export const RegistrationRequestModel = {
  async create(data: CreateRegistrationData): Promise<RegistrationRequest> {
    const result = await query(
      `INSERT INTO registration_requests (email, password_hash, name, department, title)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.email.toLowerCase(), data.password_hash, data.name, data.department || null, data.title || null]
    );
    return result.rows[0];
  },

  async findByEmail(email: string): Promise<RegistrationRequest | null> {
    const result = await query(
      'SELECT * FROM registration_requests WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  async findById(id: number): Promise<RegistrationRequest | null> {
    const result = await query(
      'SELECT * FROM registration_requests WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async getAll(status?: string): Promise<RegistrationRequest[]> {
    if (status) {
      const result = await query(
        'SELECT * FROM registration_requests WHERE status = $1 ORDER BY created_at DESC',
        [status]
      );
      return result.rows;
    }
    const result = await query(
      'SELECT * FROM registration_requests ORDER BY created_at DESC'
    );
    return result.rows;
  },

  async approve(id: number, reviewerId: number): Promise<RegistrationRequest | null> {
    const result = await query(
      `UPDATE registration_requests
       SET status = 'approved', reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, reviewerId]
    );
    return result.rows[0] || null;
  },

  async reject(id: number, reviewerId: number, reason: string): Promise<RegistrationRequest | null> {
    const result = await query(
      `UPDATE registration_requests
       SET status = 'rejected', reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = $3
       WHERE id = $1
       RETURNING *`,
      [id, reviewerId, reason]
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<void> {
    await query('DELETE FROM registration_requests WHERE id = $1', [id]);
  },

  async emailExists(email: string): Promise<boolean> {
    const result = await query(
      'SELECT 1 FROM registration_requests WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows.length > 0;
  },
};
