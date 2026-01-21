import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { JWTPayload } from '../middleware/auth.js';

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expire,
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.jwt.secret) as JWTPayload;
};
