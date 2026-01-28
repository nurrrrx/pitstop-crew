import { Router, Request, Response } from 'express';
import { FavoriteModel } from '../models/Favorite.js';
import { authenticateToken } from '../middleware/auth.js';

export const favoritesRouter = Router();

// All routes require authentication
favoritesRouter.use(authenticateToken);

// Get user's favorite project IDs
favoritesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const favorites = await FavoriteModel.getUserFavorites(userId);
    res.json(favorites);
  } catch (error) {
    console.error('Error getting favorites:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

// Add project to favorites
favoritesRouter.post('/:projectId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const projectId = parseInt(String(req.params.projectId));

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    await FavoriteModel.addFavorite(userId, projectId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Remove project from favorites
favoritesRouter.delete('/:projectId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const projectId = parseInt(String(req.params.projectId));

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    await FavoriteModel.removeFavorite(userId, projectId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});
