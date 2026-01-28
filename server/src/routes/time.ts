import { Router } from 'express';
import { TimeController } from '../controllers/timeController.js';
import { authenticateToken } from '../middleware/auth.js';

export const timeRouter = Router();

// All routes require authentication
timeRouter.use(authenticateToken);

// Time entries
timeRouter.get('/my', TimeController.getMyTimeEntries);
timeRouter.post('/', TimeController.create);
timeRouter.delete('/:id', TimeController.delete);
