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
      console.warn('⚠️ No se encontró header de autorización');
      return null;
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    console.log('🔑 Token recibido:', token.substring(0, 20) + '...');

    // Verificar token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      console.log('✅ Token verificado para usuario:', decoded.email);
    } catch (jwtError: any) {
      console.error('❌ Error al verificar token:', jwtError.message);
      return null;
    }

    // Obtener usuario de la base de datos
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.warn('⚠️ Usuario no encontrado en BD:', decoded.userId);
      return null;
    }

    console.log('✅ Usuario autenticado:', user.email);
    return { user };
  } catch (error: any) {
    console.error('❌ Error en authenticate:', error.message);
    return null;
  }
};
