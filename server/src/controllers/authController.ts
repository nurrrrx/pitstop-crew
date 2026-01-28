import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService.js';
import type { AuthenticatedRequest } from '../types/index.js';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await AuthService.register(validatedData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      if (error instanceof Error && error.message === 'Email already registered') {
        res.status(409).json({ error: error.message });
        return;
      }
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await AuthService.login(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      if (error instanceof Error && error.message === 'Invalid email or password') {
        res.status(401).json({ error: error.message });
        return;
      }
      next(error);
    }
  },

  async verifyToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }
      const user = await AuthService.verifyAndGetUser(req.user);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  },

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }
      const user = await AuthService.verifyAndGetUser(req.user);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const result = await AuthService.requestPasswordReset(email);

      // Always return success to prevent email enumeration
      res.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
        // In development, include the reset URL for testing
        ...(process.env.NODE_ENV !== 'production' && result.resetUrl && {
          resetUrl: result.resetUrl
        })
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      await AuthService.resetPassword(token, password);
      res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      if (error instanceof Error &&
          (error.message === 'Invalid or expired reset token' ||
           error.message === 'User not found')) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  },

  async validateResetToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const isValid = await AuthService.validateResetToken(token);
      res.json({ valid: isValid });
    } catch (error) {
      next(error);
    }
  },
};
