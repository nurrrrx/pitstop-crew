import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getAllCrew,
  getCrewMember,
  createCrewMember,
  updateCrewMember,
  archiveCrewMember,
  deleteCrewMember,
  reactivateCrewMember,
  getCrewProjects,
  getCrewCollaborators,
  getCrewMonthlyStats,
  getCrewAverageCost,
  getCrewCostPlans,
  upsertCostPlan,
  getCrewDeliverables,
  getCrewChargeability,
} from '../controllers/crewController.js';

export const crewRouter = Router();

// All routes require authentication
crewRouter.use(authenticateToken);

// Crew member CRUD
crewRouter.get('/', getAllCrew);
crewRouter.post('/', createCrewMember);
crewRouter.get('/:id', getCrewMember);
crewRouter.put('/:id', updateCrewMember);
crewRouter.post('/:id/archive', archiveCrewMember);
crewRouter.delete('/:id', deleteCrewMember);
crewRouter.post('/:id/reactivate', reactivateCrewMember);

// Crew member details
crewRouter.get('/:id/projects', getCrewProjects);
crewRouter.get('/:id/collaborators', getCrewCollaborators);
crewRouter.get('/:id/monthly-stats', getCrewMonthlyStats);
crewRouter.get('/:id/average-cost', getCrewAverageCost);
crewRouter.get('/:id/deliverables', getCrewDeliverables);
crewRouter.get('/:id/chargeability', getCrewChargeability);

// Cost planning (for contractors)
crewRouter.get('/:id/cost-plans', getCrewCostPlans);
crewRouter.post('/:id/cost-plans', upsertCostPlan);
