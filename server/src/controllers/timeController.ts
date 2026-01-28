import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { TimeEntryModel } from '../models/TimeEntry.js';
import type { AuthenticatedRequest } from '../types/index.js';

const createTimeEntrySchema = z.object({
  project_id: z.number(),
  hours: z.number().min(0.1, 'Hours must be at least 0.1'),
  description: z.string().optional(),
  date: z.string(),
  billable: z.boolean().optional(),
  hourly_rate: z.number().optional(),
});

export const TimeController = {
  async getMyTimeEntries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { start_date, end_date } = req.query;

      let entries;
      if (start_date && end_date) {
        entries = await TimeEntryModel.findByUserAndDateRange(
          req.user.userId,
          start_date as string,
          end_date as string
        );
      } else {
        entries = await TimeEntryModel.findByUser(req.user.userId);
      }

      res.json(entries);
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const data = createTimeEntrySchema.parse(req.body);
      const entry = await TimeEntryModel.create({
        ...data,
        user_id: req.user.userId,
      });
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const success = await TimeEntryModel.delete(parseInt(req.params.id));
      if (!success) {
        res.status(404).json({ error: 'Time entry not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
