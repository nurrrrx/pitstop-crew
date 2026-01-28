import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

export const statsRouter = Router();

// All routes require authentication
statsRouter.use(authenticateToken);

export interface DashboardStats {
  totalProjects: number;
  closedYTD: number;
  inProgress: number;
  pastDeadlineNotDelivered: number;
  projectsAssignedToMe: number;
  tasksAssignedToMe: number;
  myCompletedTasks: number;
  myPendingTasks: number;
}

// Get dashboard statistics
statsRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const currentYear = new Date().getFullYear();
    const today = new Date().toISOString().split('T')[0];

    // Total projects
    const totalResult = await query('SELECT COUNT(*) as count FROM projects');
    const totalProjects = parseInt(totalResult.rows[0].count);

    // Closed YTD (completed or cancelled this year)
    const closedResult = await query(
      `SELECT COUNT(*) as count FROM projects
       WHERE status IN ('completed', 'cancelled')
       AND EXTRACT(YEAR FROM updated_at) = $1`,
      [currentYear]
    );
    const closedYTD = parseInt(closedResult.rows[0].count);

    // In Progress (active or planning)
    const inProgressResult = await query(
      `SELECT COUNT(*) as count FROM projects WHERE status IN ('active', 'planning')`
    );
    const inProgress = parseInt(inProgressResult.rows[0].count);

    // Past deadline and not delivered
    const pastDeadlineResult = await query(
      `SELECT COUNT(*) as count FROM projects
       WHERE end_date < $1
       AND status NOT IN ('completed', 'cancelled')`,
      [today]
    );
    const pastDeadlineNotDelivered = parseInt(pastDeadlineResult.rows[0].count);

    // Projects assigned to me (where I'm a member)
    const myProjectsResult = await query(
      `SELECT COUNT(DISTINCT pm.project_id) as count
       FROM project_members pm
       JOIN projects p ON pm.project_id = p.id
       WHERE pm.user_id = $1`,
      [userId]
    );
    const projectsAssignedToMe = parseInt(myProjectsResult.rows[0].count);

    // Tasks assigned to me
    const myTasksResult = await query(
      `SELECT COUNT(*) as count FROM tasks WHERE assignee_id = $1`,
      [userId]
    );
    const tasksAssignedToMe = parseInt(myTasksResult.rows[0].count);

    // My completed tasks
    const myCompletedResult = await query(
      `SELECT COUNT(*) as count FROM tasks WHERE assignee_id = $1 AND status = 'completed'`,
      [userId]
    );
    const myCompletedTasks = parseInt(myCompletedResult.rows[0].count);

    // My pending tasks (not completed)
    const myPendingResult = await query(
      `SELECT COUNT(*) as count FROM tasks WHERE assignee_id = $1 AND status != 'completed'`,
      [userId]
    );
    const myPendingTasks = parseInt(myPendingResult.rows[0].count);

    const stats: DashboardStats = {
      totalProjects,
      closedYTD,
      inProgress,
      pastDeadlineNotDelivered,
      projectsAssignedToMe,
      tasksAssignedToMe,
      myCompletedTasks,
      myPendingTasks,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});
