import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import type { AuthenticatedRequest } from '../types/index.js';

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
};
