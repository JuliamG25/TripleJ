import type { APIRoute } from 'astro';
import { User } from '@/lib/models/User';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';

export const GET: APIRoute = async (context) => {
  try {
    console.log('📥 GET /api/auth/me - Iniciando...');
    
    try {
      await connectDB();
      console.log('✅ MongoDB conectado');
    } catch (dbError: any) {
      console.error('❌ Error al conectar MongoDB:', dbError);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error de conexión a MongoDB: ${dbError.message || 'Verifica que MongoDB esté corriendo'}`,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const authResult = await authenticate(context);
    
    if (!authResult) {
      console.warn('⚠️ No autenticado');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No autenticado',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { user } = authResult;
    console.log('👤 Usuario autenticado:', user.email);
    
    const userData = await User.findById(user._id);

    if (!userData) {
      console.warn('⚠️ Usuario no encontrado:', user._id);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Usuario no encontrado',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Usuario encontrado:', userData.email);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: {
            id: String(userData._id), // Convertir ObjectId a string
            name: userData.name,
            email: userData.email,
            role: userData.role,
            avatar: userData.avatar,
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error en GET /api/auth/me:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al obtener información del usuario: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
