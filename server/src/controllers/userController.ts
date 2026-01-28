import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';

export const UserController = {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await query(`
        SELECT id, email, name, role, avatar_url, hourly_rate, created_at
        FROM users
        ORDER BY name
      `);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await query(`
        SELECT id, email, name, role, avatar_url, hourly_rate, created_at
        FROM users
        WHERE id = $1
      `, [String(req.params.id)]);

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  },
};
