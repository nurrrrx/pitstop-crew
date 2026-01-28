import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

export const authRouter = Router();

// Public routes
authRouter.post('/register', AuthController.register);
authRouter.post('/login', AuthController.login);
authRouter.post('/forgot-password', AuthController.forgotPassword);
authRouter.post('/reset-password', AuthController.resetPassword);
authRouter.get('/validate-reset-token/:token', AuthController.validateResetToken);

// Protected routes
authRouter.get('/verify', authenticateToken, AuthController.verifyToken);
authRouter.get('/me', authenticateToken, AuthController.me);
