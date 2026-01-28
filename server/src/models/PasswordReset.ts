import { query } from '../config/database.js';
import crypto from 'crypto';

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

export const PasswordResetModel = {
  async createToken(userId: number): Promise<string> {
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Invalidate any existing tokens for this user
    await query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [userId]
    );

    // Create new token
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );

    return token;
  },

  async findValidToken(token: string): Promise<PasswordResetToken | null> {
    const result = await query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
      [token]
    );
    return result.rows[0] || null;
  },

  async markAsUsed(token: string): Promise<void> {
    await query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = $1',
      [token]
    );
  },

  async cleanupExpiredTokens(): Promise<void> {
    await query(
      'DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE'
    );
  }
};
