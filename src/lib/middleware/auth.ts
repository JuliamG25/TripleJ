import type { APIContext } from 'astro';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User, IUser } from '../models/User.js';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const authenticate = async (
  context: APIContext
): Promise<{ user: IUser } | null> => {
  try {
    // Obtener token del header
    const authHeader = context.request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch {
      return null;
    }

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return null;
    }

    return { user };
  } catch {
    return null;
  }
};
