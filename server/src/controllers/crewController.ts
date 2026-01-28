import { Request, Response, NextFunction } from 'express';
import { Crew, CreateCrewMemberData } from '../models/Crew.js';

// Get all crew members
export const getAllCrew = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, includeInactive } = req.query;
    const employmentType = type === 'fte' || type === 'contractor' ? type : undefined;
    const showInactive = includeInactive === 'true';

    const crew = await Crew.getAll(employmentType, showInactive);
    res.json(crew);
  } catch (error) {
    next(error);
  }
};

// Get crew member by ID
export const getCrewMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const member = await Crew.getById(parseInt(id));

    if (!member) {
      return res.status(404).json({ error: 'Crew member not found' });
    }

    res.json(member);
  } catch (error) {
    next(error);
  }
};

// Create a new crew member
export const createCrewMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: CreateCrewMemberData = req.body;

    if (!data.email || !data.name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    const member = await Crew.create(data);
    res.status(201).json(member);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    next(error);
  }
};

// Update a crew member
export const updateCrewMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const member = await Crew.update(parseInt(id), req.body);

    if (!member) {
      return res.status(404).json({ error: 'Crew member not found' });
    }

    res.json(member);
  } catch (error) {
    next(error);
  }
};

// Archive a crew member (set end date)
export const archiveCrewMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { end_date } = req.body;

    const success = await Crew.archive(parseInt(id), end_date);

    if (!success) {
      return res.status(404).json({ error: 'Crew member not found' });
    }

    res.json({ message: 'Crew member archived successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete a crew member permanently
export const deleteCrewMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const success = await Crew.delete(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Crew member not found' });
    }

    res.json({ message: 'Crew member deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Reactivate an archived crew member
export const reactivateCrewMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const success = await Crew.reactivate(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Crew member not found' });
    }

    res.json({ message: 'Crew member reactivated successfully' });
  } catch (error) {
    next(error);
  }
};

// Get projects for a crew member
export const getCrewProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const projects = await Crew.getProjects(parseInt(id));
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// Get frequent collaborators
export const getCrewCollaborators = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const collaborators = await Crew.getCollaborators(parseInt(id));
    res.json(collaborators);
  } catch (error) {
    next(error);
  }
};

// Get monthly stats
export const getCrewMonthlyStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { year } = req.query;
    const stats = await Crew.getMonthlyStats(parseInt(id), year ? parseInt(year as string) : undefined);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

// Get average monthly cost (for FTEs)
export const getCrewAverageCost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const average = await Crew.getAverageMonthlyCost(parseInt(id));
    res.json(average);
  } catch (error) {
    next(error);
  }
};

// Get cost plans (for contractors)
export const getCrewCostPlans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { year } = req.query;
    const plans = await Crew.getCostPlans(parseInt(id), year ? parseInt(year as string) : undefined);
    res.json(plans);
  } catch (error) {
    next(error);
  }
};

// Create or update cost plan
export const upsertCostPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { year, month, ...data } = req.body;

    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }

    const plan = await Crew.upsertCostPlan(parseInt(id), year, month, data);
    res.json(plan);
  } catch (error) {
    next(error);
  }
};

// Get deliverables for a crew member
export const getCrewDeliverables = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deliverables = await Crew.getDeliverables(parseInt(id));
    res.json(deliverables);
  } catch (error) {
    next(error);
  }
};

// Get chargeability
export const getCrewChargeability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const chargeability = await Crew.getChargeability(
      parseInt(id),
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json(chargeability);
  } catch (error) {
    next(error);
  }
};
