import { query } from '../config/database.js';

export interface UserFavorite {
  id: number;
  user_id: number;
  project_id: number;
  created_at: Date;
}

export const FavoriteModel = {
  async getUserFavorites(userId: number): Promise<number[]> {
    const result = await query(
      'SELECT project_id FROM user_favorites WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map(row => row.project_id);
  },

  async addFavorite(userId: number, projectId: number): Promise<void> {
    await query(
      `INSERT INTO user_favorites (user_id, project_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, project_id) DO NOTHING`,
      [userId, projectId]
    );
  },

  async removeFavorite(userId: number, projectId: number): Promise<void> {
    await query(
      'DELETE FROM user_favorites WHERE user_id = $1 AND project_id = $2',
      [userId, projectId]
    );
  },

  async isFavorite(userId: number, projectId: number): Promise<boolean> {
    const result = await query(
      'SELECT 1 FROM user_favorites WHERE user_id = $1 AND project_id = $2',
      [userId, projectId]
    );
    return result.rows.length > 0;
  },
};
