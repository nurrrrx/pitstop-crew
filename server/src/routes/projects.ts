import { Router } from 'express';
import { ProjectController } from '../controllers/projectController.js';
import { authenticateToken } from '../middleware/auth.js';

export const projectRouter = Router();

// All routes require authentication
projectRouter.use(authenticateToken);

// Projects
projectRouter.get('/', ProjectController.getAll);
projectRouter.get('/my', ProjectController.getMyProjects);
projectRouter.get('/:id', ProjectController.getById);
projectRouter.post('/', ProjectController.create);
projectRouter.put('/:id', ProjectController.update);
projectRouter.delete('/:id', ProjectController.delete);

// Project summary (time/cost)
projectRouter.get('/:id/summary', ProjectController.getProjectSummary);

// Project Members
projectRouter.get('/:id/members', ProjectController.getMembers);
projectRouter.post('/:id/members', ProjectController.addMember);
projectRouter.delete('/:id/members/:userId', ProjectController.removeMember);

// Milestones
projectRouter.get('/:id/milestones', ProjectController.getMilestones);
projectRouter.post('/:id/milestones', ProjectController.createMilestone);
projectRouter.put('/:id/milestones/:milestoneId', ProjectController.updateMilestone);
projectRouter.delete('/:id/milestones/:milestoneId', ProjectController.deleteMilestone);

// Time Entries for a project
projectRouter.get('/:id/time-entries', ProjectController.getTimeEntries);
projectRouter.post('/:id/time-entries', ProjectController.createTimeEntry);

// Tasks
projectRouter.get('/:id/tasks', ProjectController.getTasks);
projectRouter.post('/:id/tasks', ProjectController.createTask);
projectRouter.put('/:id/tasks/:taskId', ProjectController.updateTask);
projectRouter.patch('/:id/tasks/:taskId/status', ProjectController.updateTaskStatus);
projectRouter.delete('/:id/tasks/:taskId', ProjectController.deleteTask);

// Budget Items
projectRouter.get('/:id/budget-items', ProjectController.getBudgetItems);
projectRouter.post('/:id/budget-items', ProjectController.createBudgetItem);
projectRouter.put('/:id/budget-items/:itemId', ProjectController.updateBudgetItem);
projectRouter.delete('/:id/budget-items/:itemId', ProjectController.deleteBudgetItem);
projectRouter.get('/:id/budget-summary', ProjectController.getBudgetSummary);

// Stakeholders
projectRouter.get('/:id/stakeholders', ProjectController.getStakeholders);
projectRouter.post('/:id/stakeholders', ProjectController.createStakeholder);
projectRouter.put('/:id/stakeholders/:stakeholderId', ProjectController.updateStakeholder);
projectRouter.delete('/:id/stakeholders/:stakeholderId', ProjectController.deleteStakeholder);

// Files
projectRouter.get('/:id/files', ProjectController.getFiles);
projectRouter.post('/:id/files', ProjectController.createFile);
projectRouter.put('/:id/files/:fileId', ProjectController.updateFileCategory);
projectRouter.delete('/:id/files/:fileId', ProjectController.deleteFile);

// Activity Log
projectRouter.get('/:id/activity-log', ProjectController.getActivityLog);

// Time Calendar (aggregated view)
projectRouter.get('/:id/time-calendar', ProjectController.getTimeCalendar);
