import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User.js';
import { PasswordResetModel } from '../models/PasswordReset.js';
import { generateToken } from '../utils/jwt.js';
import type { RegisterInput, LoginInput, AuthResult, JwtPayload } from '../types/index.js';

const SALT_ROUNDS = 12;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

export const AuthService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    // Check if email already exists
    const existingUser = await UserModel.emailExists(input.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user
    const user = await UserModel.create({
      email: input.email,
      password_hash,
      name: input.name,
    });

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    // Find user
    const user = await UserModel.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(input.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    // Get is_admin status
    const isAdmin = await UserModel.isAdmin(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: isAdmin,
      },
      token,
    };
  },

  async verifyAndGetUser(payload: JwtPayload) {
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      is_admin: user.is_admin || false,
    };
  },

  async requestPasswordReset(email: string): Promise<{ resetUrl?: string }> {
    const user = await UserModel.findByEmail(email);

    // If user doesn't exist, return silently to prevent email enumeration
    if (!user) {
      return {};
    }

    // Generate reset token
    const token = await PasswordResetModel.createToken(user.id);

    // Build reset URL
    const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;

    // In production, send email here
    // await sendPasswordResetEmail(user.email, resetUrl);

    // For development, return the URL
    console.log(`Password reset link for ${email}: ${resetUrl}`);

    return { resetUrl };
  },

  async validateResetToken(token: string): Promise<boolean> {
    const resetToken = await PasswordResetModel.findValidToken(token);
    return !!resetToken;
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await PasswordResetModel.findValidToken(token);

    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    const user = await UserModel.findById(resetToken.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user's password
    await UserModel.updatePassword(user.id, password_hash);

    // Mark token as used
    await PasswordResetModel.markAsUsed(token);
  },
};
