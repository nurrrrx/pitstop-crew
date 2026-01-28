import { Router, Request, Response } from 'express';
import { RegistrationRequestModel } from '../models/RegistrationRequest.js';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

export const adminRouter = Router();

// All admin routes require authentication and admin role
adminRouter.use(authenticateToken);
adminRouter.use(requireAdmin);

// Get all registration requests
adminRouter.get('/registration-requests', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const requests = await RegistrationRequestModel.getAll(status);

    // Fetch reviewer names
    const requestsWithReviewer = await Promise.all(
      requests.map(async (request) => {
        if (request.reviewed_by) {
          const result = await query('SELECT name FROM users WHERE id = $1', [request.reviewed_by]);
          return {
            ...request,
            reviewer_name: result.rows[0]?.name || null,
          };
        }
        return { ...request, reviewer_name: null };
      })
    );

    res.json(requestsWithReviewer);
  } catch (error) {
    console.error('Error getting registration requests:', error);
    res.status(500).json({ error: 'Failed to get registration requests' });
  }
});

// Approve a registration request
adminRouter.post('/registration-requests/:id/approve', async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const adminId = (req as any).user.userId;

    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const request = await RegistrationRequestModel.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Registration request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Create the user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, name, department, title, approval_status, approved_by, approved_at)
       VALUES ($1, $2, $3, $4, $5, 'approved', $6, CURRENT_TIMESTAMP)
       RETURNING id, email, name`,
      [request.email, request.password_hash, request.name, request.department, request.title, adminId]
    );

    // Update the registration request
    await RegistrationRequestModel.approve(requestId, adminId);

    res.json({
      success: true,
      user: userResult.rows[0],
      message: 'User account created successfully',
    });
  } catch (error: any) {
    console.error('Error approving registration:', error);
    if (error.code === '23505') {
      // Unique violation - email already exists
      return res.status(400).json({ error: 'A user with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to approve registration' });
  }
});

// Reject a registration request
adminRouter.post('/registration-requests/:id/reject', async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const adminId = (req as any).user.userId;
    const { reason } = req.body;

    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const request = await RegistrationRequestModel.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Registration request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    await RegistrationRequestModel.reject(requestId, adminId, reason);

    res.json({
      success: true,
      message: 'Registration request rejected',
    });
  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(500).json({ error: 'Failed to reject registration' });
  }
});

// Delete a registration request
adminRouter.delete('/registration-requests/:id', async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);

    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    await RegistrationRequestModel.delete(requestId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting registration request:', error);
    res.status(500).json({ error: 'Failed to delete registration request' });
  }
});
