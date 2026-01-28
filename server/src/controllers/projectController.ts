import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProjectModel } from '../models/Project.js';
import { MilestoneModel } from '../models/Milestone.js';
import { TimeEntryModel } from '../models/TimeEntry.js';
import { TaskModel } from '../models/Task.js';
import { BudgetItemModel } from '../models/BudgetItem.js';
import { StakeholderModel } from '../models/Stakeholder.js';
import { ProjectFileModel } from '../models/ProjectFile.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { logAction } from '../utils/auditLogger.js';
import type { AuthenticatedRequest } from '../types/index.js';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.number().optional(),
  color: z.string().optional(),
  members: z.array(z.number()).optional(),
});

const createMilestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
});

const createTimeEntrySchema = z.object({
  hours: z.number().min(0.1, 'Hours must be at least 0.1'),
  description: z.string().optional(),
  date: z.string(),
  billable: z.boolean().optional(),
  hourly_rate: z.number().optional(),
});

const createTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  milestone_id: z.number().optional(),
  assignee_id: z.number().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  estimated_hours: z.number().optional(),
});

const createBudgetItemSchema = z.object({
  category: z.enum(['people_cost', 'licenses', 'external_consulting', 'external_data', 'infrastructure', 'other']),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  estimated_cost: z.number().optional(),
  actual_cost: z.number().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

const createStakeholderSchema = z.object({
  user_id: z.number().optional(),
  external_name: z.string().optional(),
  external_email: z.string().email().optional(),
  external_organization: z.string().optional(),
  role: z.enum(['sponsor', 'business_owner', 'steering_committee', 'subject_matter_expert']),
  is_primary: z.boolean().optional(),
  notes: z.string().optional(),
});

const createFileSchema = z.object({
  file_name: z.string().min(1, 'File name is required'),
  file_path: z.string().min(1, 'File path is required'),
  file_size: z.number().optional(),
  mime_type: z.string().optional(),
  category: z.enum(['business_case', 'proposal', 'charter', 'budget', 'status_report', 'other']).optional(),
});

export const ProjectController = {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await ProjectModel.findAll();
      res.json(projects);
    } catch (error) {
      next(error);
    }
  },

  async getMyProjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }
      const projects = await ProjectModel.getProjectsForUser(req.user.userId);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await ProjectModel.findById(parseInt(String(req.params.id)));
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.json(project);
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

      const data = createProjectSchema.parse(req.body);
      const project = await ProjectModel.create({
        ...data,
        owner_id: req.user.userId,
      });

      // Add members if specified
      if (data.members && data.members.length > 0) {
        for (const userId of data.members) {
          await ProjectModel.addMember(project.id, userId);
        }
      }

      // Add creator as a member with 'owner' role
      await ProjectModel.addMember(project.id, req.user.userId, 'owner');

      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProjectSchema.partial().parse(req.body);
      const project = await ProjectModel.update(parseInt(String(req.params.id)), data);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const success = await ProjectModel.delete(parseInt(String(req.params.id)));
      if (!success) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // Members
  async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const members = await ProjectModel.getMembers(parseInt(String(req.params.id)));
      res.json(members);
    } catch (error) {
      next(error);
    }
  },

  async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id, role } = req.body;
      await ProjectModel.addMember(parseInt(String(req.params.id)), user_id, role);
      res.status(201).json({ message: 'Member added' });
    } catch (error) {
      next(error);
    }
  },

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      await ProjectModel.removeMember(parseInt(String(req.params.id)), parseInt(String(req.params.userId)));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // Milestones
  async getMilestones(req: Request, res: Response, next: NextFunction) {
    try {
      const milestones = await MilestoneModel.findByProject(parseInt(String(req.params.id)));
      res.json(milestones);
    } catch (error) {
      next(error);
    }
  },

  async createMilestone(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createMilestoneSchema.parse(req.body);
      const milestone = await MilestoneModel.create({
        ...data,
        project_id: parseInt(String(req.params.id)),
      });
      res.status(201).json(milestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  },

  async updateMilestone(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createMilestoneSchema.partial().parse(req.body);
      const milestone = await MilestoneModel.update(parseInt(String(req.params.milestoneId)), data);
      if (!milestone) {
        res.status(404).json({ error: 'Milestone not found' });
        return;
      }
      res.json(milestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  },

  async deleteMilestone(req: Request, res: Response, next: NextFunction) {
    try {
      const success = await MilestoneModel.delete(parseInt(String(req.params.milestoneId)));
      if (!success) {
        res.status(404).json({ error: 'Milestone not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // Time Entries
  async getTimeEntries(req: Request, res: Response, next: NextFunction) {
    try {
      const entries = await TimeEntryModel.findByProject(parseInt(String(req.params.id)));
      res.json(entries);
    } catch (error) {
      next(error);
    }
  },

  async createTimeEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const data = createTimeEntrySchema.parse(req.body);
      const entry = await TimeEntryModel.create({
        ...data,
        project_id: parseInt(String(req.params.id)),
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

  async getProjectSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await TimeEntryModel.getProjectSummary(parseInt(String(req.params.id)));
      res.json(summary);
    } catch (error) {
      next(error);
    }
  },

  // Tasks
  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await TaskModel.findByProject(parseInt(String(req.params.id)));
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  },

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTaskSchema.parse(req.body);
      const task = await TaskModel.create({
        ...data,
        project_id: parseInt(String(req.params.id)),
      });
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  },

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTaskSchema.partial().parse(req.body);
      const task = await TaskModel.update(parseInt(String(req.params.taskId)), data);
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  },

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const success = await TaskModel.delete(parseInt(String(req.params.taskId)));
      if (!success) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async updateTaskStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      if (!['todo', 'in_progress', 'review', 'completed'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }
      const oldTask = await TaskModel.findById(parseInt(String(req.params.taskId)));
      const task = await TaskModel.updateStatus(parseInt(String(req.params.taskId)), status);
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      // Log the status change
      if (oldTask) {
        await logAction({
          projectId: parseInt(String(req.params.id)),
          entityType: 'task',
          entityId: task.id,
          action: 'status_changed',
          performedBy: req.user?.userId,
          metadata: { old_status: oldTask.status, new_status: status }
        });
      }
      res.json(task);
    } catch (error) {
      next(error);
    }
  },

  // Budget Items
  async getBudgetItems(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await BudgetItemModel.findByProject(parseInt(String(req.params.id)));
      res.json(items);
    } catch (error) {
      next(error);
    }
  },

  async createBudgetItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createBudgetItemSchema.parse(req.body);
      const item = await BudgetItemModel.create(parseInt(String(req.params.id)), data);
      await logAction({
        projectId: parseInt(String(req.params.id)),
        entityType: 'budget_item',
        entityId: item.id,
        action: 'created',
        performedBy: req.user?.userId,
        metadata: { name: item.name, category: item.category }
      });
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  },

  async updateBudgetItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createBudgetItemSchema.partial().parse(req.body);
      const item = await BudgetItemModel.update(parseInt(String(req.params.itemId)), data);
      if (!item) {
        res.status(404).json({ error: 'Budget item not found' });
        return;
      }
      await logAction({
        projectId: parseInt(String(req.params.id)),
        entityType: 'budget_item',
        entityId: item.id,
        action: 'updated',
        performedBy: req.user?.userId
      });
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  },

  async deleteBudgetItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const item = await BudgetItemModel.findById(parseInt(String(req.params.itemId)));
      const success = await BudgetItemModel.delete(parseInt(String(req.params.itemId)));
      if (!success) {
        res.status(404).json({ error: 'Budget item not found' });
        return;
      }
      if (item) {
        await logAction({
          projectId: parseInt(String(req.params.id)),
          entityType: 'budget_item',
          entityId: parseInt(String(req.params.itemId)),
          action: 'deleted',
          performedBy: req.user?.userId,
          metadata: { name: item.name }
        });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async getBudgetSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await BudgetItemModel.getBudgetSummary(parseInt(String(req.params.id)));
      const totals = await BudgetItemModel.getProjectTotals(parseInt(String(req.params.id)));
      res.json({ categories: summary, totals });
    } catch (error) {
      next(error);
    }
  },

  // Stakeholders
  async getStakeholders(req: Request, res: Response, next: NextFunction) {
    try {
      const stakeholders = await StakeholderModel.findByProject(parseInt(String(req.params.id)));
      res.json(stakeholders);
    } catch (error) {
      next(error);
    }
  },

  async createStakeholder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createStakeholderSchema.parse(req.body);
      const stakeholder = await StakeholderModel.create(parseInt(String(req.params.id)), data);
      await logAction({
        projectId: parseInt(String(req.params.id)),
        entityType: 'stakeholder',
        entityId: stakeholder.id,
        action: 'created',
        performedBy: req.user?.userId,
        metadata: { role: stakeholder.role }
      });
      res.status(201).json(stakeholder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  },

  async updateStakeholder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createStakeholderSchema.partial().parse(req.body);
      const stakeholder = await StakeholderModel.update(parseInt(String(req.params.stakeholderId)), data);
      if (!stakeholder) {
        res.status(404).json({ error: 'Stakeholder not found' });
        return;
      }
      await logAction({
        projectId: parseInt(String(req.params.id)),
        entityType: 'stakeholder',
        entityId: stakeholder.id,
        action: 'updated',
        performedBy: req.user?.userId
      });
      res.json(stakeholder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  },

  async deleteStakeholder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const success = await StakeholderModel.delete(parseInt(String(req.params.stakeholderId)));
      if (!success) {
        res.status(404).json({ error: 'Stakeholder not found' });
        return;
      }
      await logAction({
        projectId: parseInt(String(req.params.id)),
        entityType: 'stakeholder',
        entityId: parseInt(String(req.params.stakeholderId)),
        action: 'deleted',
        performedBy: req.user?.userId
      });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // Files
  async getFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as string | undefined;
      const files = await ProjectFileModel.findByProject(parseInt(String(req.params.id)), category);
      res.json(files);
    } catch (error) {
      next(error);
    }
  },

  async createFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createFileSchema.parse(req.body);
      const file = await ProjectFileModel.create(parseInt(String(req.params.id)), {
        ...data,
        uploaded_by: req.user?.userId
      });
      await logAction({
        projectId: parseInt(String(req.params.id)),
        entityType: 'file',
        entityId: file.id,
        action: 'created',
        performedBy: req.user?.userId,
        metadata: { file_name: file.file_name, category: file.category }
      });
      res.status(201).json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      next(error);
    }
  },

  async updateFileCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { category } = req.body;
      const file = await ProjectFileModel.updateCategory(parseInt(String(req.params.fileId)), category);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      await logAction({
        projectId: parseInt(String(req.params.id)),
        entityType: 'file',
        entityId: file.id,
        action: 'updated',
        performedBy: req.user?.userId,
        metadata: { category }
      });
      res.json(file);
    } catch (error) {
      next(error);
    }
  },

  async deleteFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const file = await ProjectFileModel.findById(parseInt(String(req.params.fileId)));
      const success = await ProjectFileModel.delete(parseInt(String(req.params.fileId)));
      if (!success) {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      if (file) {
        await logAction({
          projectId: parseInt(String(req.params.id)),
          entityType: 'file',
          entityId: parseInt(String(req.params.fileId)),
          action: 'deleted',
          performedBy: req.user?.userId,
          metadata: { file_name: file.file_name }
        });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // Activity Log
  async getActivityLog(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const logs = await ActivityLogModel.findByProject(parseInt(String(req.params.id)), limit, offset);
      const total = await ActivityLogModel.countByProject(parseInt(String(req.params.id)));
      res.json({ logs, total, limit, offset });
    } catch (error) {
      next(error);
    }
  },

  // Time Calendar - aggregated view of hours per member per day
  async getTimeCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(String(req.params.id));
      const weekStart = req.query.weekStart as string || new Date().toISOString().split('T')[0];

      // Get all time entries for this project
      const entries = await TimeEntryModel.findByProject(projectId);

      // Calculate week boundaries
      const startDate = new Date(weekStart);
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // End of week (Saturday)

      // Group entries by user and date
      const memberMap = new Map<number, {
        userId: number;
        userName: string;
        days: Map<string, number>;
        weekTotal: number;
      }>();

      for (const entry of entries) {
        const entryDate = new Date(entry.date);
        if (entryDate >= startDate && entryDate <= endDate) {
          if (!memberMap.has(entry.user_id)) {
            memberMap.set(entry.user_id, {
              userId: entry.user_id,
              userName: entry.user_name || 'Unknown',
              days: new Map(),
              weekTotal: 0
            });
          }

          const member = memberMap.get(entry.user_id)!;
          const dateKey = entry.date;
          const currentHours = member.days.get(dateKey) || 0;
          member.days.set(dateKey, currentHours + entry.hours);
          member.weekTotal += entry.hours;
        }
      }

      // Convert to array format
      const members = Array.from(memberMap.values()).map(m => ({
        userId: m.userId,
        userName: m.userName,
        days: Array.from(m.days.entries()).map(([date, hours]) => ({ date, hours })),
        weekTotal: m.weekTotal
      }));

      res.json({
        weekStart: startDate.toISOString().split('T')[0],
        weekEnd: endDate.toISOString().split('T')[0],
        members
      });
    } catch (error) {
      next(error);
    }
  },
};
