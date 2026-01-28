import { query } from '../config/database.js';

export interface ProjectFile {
  id: number;
  project_id: number;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  category: string;
  uploaded_by: number | null;
  uploaded_at: Date;
  // Joined fields
  uploader_name?: string;
}

export interface CreateProjectFileData {
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  category?: string;
  uploaded_by?: number;
}

export const ProjectFileModel = {
  async findByProject(projectId: number, category?: string): Promise<ProjectFile[]> {
    let sql = `
      SELECT
        f.*,
        u.name as uploader_name
      FROM project_files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      WHERE f.project_id = $1
    `;
    const params: unknown[] = [projectId];

    if (category) {
      sql += ` AND f.category = $2`;
      params.push(category);
    }

    sql += ` ORDER BY f.uploaded_at DESC`;

    const result = await query(sql, params);
    return result.rows;
  },

  async findById(id: number): Promise<ProjectFile | null> {
    const result = await query(`
      SELECT
        f.*,
        u.name as uploader_name
      FROM project_files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      WHERE f.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async create(projectId: number, data: CreateProjectFileData): Promise<ProjectFile> {
    const result = await query(`
      INSERT INTO project_files (project_id, file_name, file_path, file_size, mime_type, category, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      projectId,
      data.file_name,
      data.file_path,
      data.file_size || null,
      data.mime_type || null,
      data.category || 'other',
      data.uploaded_by || null
    ]);
    return result.rows[0];
  },

  async updateCategory(id: number, category: string): Promise<ProjectFile | null> {
    const result = await query(`
      UPDATE project_files
      SET category = $1
      WHERE id = $2
      RETURNING *
    `, [category, id]);
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query(`
      DELETE FROM project_files WHERE id = $1
    `, [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async getByCategory(projectId: number): Promise<{ category: string; count: number }[]> {
    const result = await query(`
      SELECT category, COUNT(*) as count
      FROM project_files
      WHERE project_id = $1
      GROUP BY category
      ORDER BY category
    `, [projectId]);
    return result.rows;
  }
};
