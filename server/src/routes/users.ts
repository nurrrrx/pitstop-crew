import { Router, Request, Response } from 'express';
import { UserController } from '../controllers/userController.js';
import { UserModel } from '../models/User.js';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

export const userRouter = Router();

// All routes require authentication
userRouter.use(authenticateToken);

userRouter.get('/', UserController.getAll);

// Get current user's profile
userRouter.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const profile = await UserModel.getProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update current user's profile
userRouter.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, avatar_url, bio, location, phone, linkedin_url, department, title } = req.body;

    const profile = await UserModel.updateProfile(userId, {
      name,
      avatar_url,
      bio,
      location,
      phone,
      linkedin_url,
      department,
      title,
    });

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user activity heatmap data (past year)
userRouter.get('/:id/activity-heatmap', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get activity data for the past year, aggregated by date
    const result = await query(
      `SELECT activity_date as date, SUM(activity_count) as count
       FROM user_activity
       WHERE user_id = $1
         AND activity_date >= CURRENT_DATE - INTERVAL '1 year'
       GROUP BY activity_date
       ORDER BY activity_date`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting activity heatmap:', error);
    res.status(500).json({ error: 'Failed to get activity heatmap' });
  }
});

userRouter.get('/:id', UserController.getById);
