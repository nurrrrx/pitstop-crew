import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getAllRequests,
  getRequest,
  createRequest,
  updateRequest,
  deleteRequest,
  getRequestComments,
  addRequestComment,
  getRequestStats,
} from '../controllers/adhocController.js';

export const adhocRouter = Router();

// All routes require authentication
adhocRouter.use(authenticateToken);

// Stats
adhocRouter.get('/stats', getRequestStats);

// Request CRUD
adhocRouter.get('/', getAllRequests);
adhocRouter.post('/', createRequest);
adhocRouter.get('/:id', getRequest);
adhocRouter.put('/:id', updateRequest);
adhocRouter.delete('/:id', deleteRequest);

// Comments
adhocRouter.get('/:id/comments', getRequestComments);
adhocRouter.post('/:id/comments', addRequestComment);
