import { query } from '../config/database.js';
import type { User, CreateUserData } from '../types/index.js';

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  role?: string;
  avatar_url?: string;
  hourly_rate?: number;
  employment_type?: string;
  department?: string;
  title?: string;
  bio?: string;
  location?: string;
  phone?: string;
  linkedin_url?: string;
  start_date?: string;
  is_admin?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateProfileData {
  name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  phone?: string;
  linkedin_url?: string;
  department?: string;
  title?: string;
}

export const UserModel = {
  async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  async findById(id: number): Promise<Omit<User, 'password_hash'> & { is_admin?: boolean } | null> {
    const result = await query(
      'SELECT id, email, name, is_admin, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async getProfile(userId: number): Promise<UserProfile | null> {
    const result = await query(
      `SELECT id, email, name, role, avatar_url, hourly_rate, employment_type,
              department, title, bio, location, phone, linkedin_url, start_date,
              is_admin, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  async updateProfile(userId: number, data: UpdateProfileData): Promise<UserProfile | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.avatar_url !== undefined) {
      fields.push(`avatar_url = $${paramIndex++}`);
      values.push(data.avatar_url);
    }
    if (data.bio !== undefined) {
      fields.push(`bio = $${paramIndex++}`);
      values.push(data.bio);
    }
    if (data.location !== undefined) {
      fields.push(`location = $${paramIndex++}`);
      values.push(data.location);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.linkedin_url !== undefined) {
      fields.push(`linkedin_url = $${paramIndex++}`);
      values.push(data.linkedin_url);
    }
    if (data.department !== undefined) {
      fields.push(`department = $${paramIndex++}`);
      values.push(data.department);
    }
    if (data.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }

    if (fields.length === 0) {
      return this.getProfile(userId);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, email, name, role, avatar_url, hourly_rate, employment_type,
                 department, title, bio, location, phone, linkedin_url, start_date,
                 is_admin, created_at, updated_at`,
      values
    );
    return result.rows[0] || null;
  },

  async isAdmin(userId: number): Promise<boolean> {
    const result = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.is_admin === true;
  },

  async create(data: CreateUserData): Promise<Omit<User, 'password_hash'>> {
    const result = await query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at, updated_at`,
      [data.email.toLowerCase(), data.password_hash, data.name]
    );
    return result.rows[0];
  },

  async emailExists(email: string): Promise<boolean> {
    const result = await query(
      'SELECT 1 FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows.length > 0;
  },

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, userId]
    );
  },
};
