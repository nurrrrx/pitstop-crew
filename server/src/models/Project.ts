import { query } from '../config/database.js';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  spent: number;
  owner_id: number | null;
  color: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  status?: string;
  priority?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  owner_id?: number;
  color?: string;
}

export interface ProjectMember {
  id: number;
  name: string;
  avatar_url?: string;
  role: string;
}

export interface ProjectWithDetails extends Project {
  owner_name?: string;
  member_count?: number;
  task_count?: number;
  completed_tasks?: number;
  members?: ProjectMember[];
}

export const ProjectModel = {
  async findAll(): Promise<ProjectWithDetails[]> {
    // First get all projects
    const projectsResult = await query(`
      SELECT
        p.*,
        u.name as owner_name,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `);

    const projects = projectsResult.rows;

    // Then get all members for all projects
    const membersResult = await query(`
      SELECT pm.project_id, u.id, u.name, u.avatar_url, pm.role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      ORDER BY pm.role = 'lead' DESC, pm.added_at ASC
    `);

    // Group members by project
    const membersByProject: Record<number, ProjectMember[]> = {};
    for (const row of membersResult.rows) {
      if (!membersByProject[row.project_id]) {
        membersByProject[row.project_id] = [];
      }
      membersByProject[row.project_id].push({
        id: row.id,
        name: row.name,
        avatar_url: row.avatar_url,
        role: row.role,
      });
    }

    // Attach members to projects
    return projects.map(project => ({
      ...project,
      members: membersByProject[project.id] || [],
    }));
  },

  async findById(id: number): Promise<ProjectWithDetails | null> {
    const result = await query(`
      SELECT
        p.*,
        u.name as owner_name,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async create(data: CreateProjectData): Promise<Project> {
    const result = await query(`
      INSERT INTO projects (name, description, status, priority, start_date, end_date, budget, owner_id, color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      data.name,
      data.description || null,
      data.status || 'planning',
      data.priority || 'medium',
      data.start_date || null,
      data.end_date || null,
      data.budget || 0,
      data.owner_id || null,
      data.color || '#3498db'
    ]);
    return result.rows[0];
  },

  async update(id: number, data: Partial<CreateProjectData>): Promise<Project | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

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
    if (data.end_date !== undefined) {
      fields.push(`end_date = $${paramCount++}`);
      values.push(data.end_date);
    }
    if (data.budget !== undefined) {
      fields.push(`budget = $${paramCount++}`);
      values.push(data.budget);
    }
    if (data.color !== undefined) {
      fields.push(`color = $${paramCount++}`);
      values.push(data.color);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM projects WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async addMember(projectId: number, userId: number, role: string = 'member'): Promise<void> {
    await query(`
      INSERT INTO project_members (project_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3
    `, [projectId, userId, role]);
  },

  async removeMember(projectId: number, userId: number): Promise<void> {
    await query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
  },

  async getMembers(projectId: number) {
    const result = await query(`
      SELECT u.id, u.name, u.email, u.avatar_url, pm.role, pm.added_at
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY pm.added_at
    `, [projectId]);
    return result.rows;
  },

  async getProjectsForUser(userId: number): Promise<ProjectWithDetails[]> {
    const result = await query(`
      SELECT DISTINCT
        p.*,
        u.name as owner_name,
        (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.owner_id = $1 OR pm.user_id = $1
      ORDER BY p.created_at DESC
    `, [userId]);
    return result.rows;
  }
};
