import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import type { JwtPayload } from '../types/index.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const generateToken = (payload: JwtPayload): string => {
  // Use type assertion for expiresIn since jsonwebtoken accepts string values like '24h'
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
