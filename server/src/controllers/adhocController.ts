import { Request, Response, NextFunction } from 'express';
import { AdHocRequestModel, CreateAdHocRequestData } from '../models/AdHocRequest.js';

// Get all ad-hoc requests
export const getAllRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, assigned_to, requestor } = req.query;

    const requests = await AdHocRequestModel.getAll({
      status: status as string | undefined,
      assigned_to: assigned_to ? parseInt(assigned_to as string) : undefined,
      requestor: requestor as string | undefined,
    });

    res.json(requests);
  } catch (error) {
    next(error);
  }
};

// Get request by ID
export const getRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const request = await AdHocRequestModel.getById(parseInt(id));

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    next(error);
  }
};

// Create a new request
export const createRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: CreateAdHocRequestData = req.body;

    if (!data.title || !data.requestor_name) {
      return res.status(400).json({ error: 'Title and requestor name are required' });
    }

    const request = await AdHocRequestModel.create(data);
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};

// Update a request
export const updateRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const request = await AdHocRequestModel.update(parseInt(id), req.body);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    next(error);
  }
};

// Delete a request
export const deleteRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const success = await AdHocRequestModel.delete(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get comments for a request
export const getRequestComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const comments = await AdHocRequestModel.getComments(parseInt(id));
    res.json(comments);
  } catch (error) {
    next(error);
  }
};

// Add a comment to a request
export const addRequestComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { comment } = req.body;
    const userId = (req as Request & { user?: { userId: number } }).user?.userId;

    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const newComment = await AdHocRequestModel.addComment(parseInt(id), userId, comment);
    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

// Get request stats
export const getRequestStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await AdHocRequestModel.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
