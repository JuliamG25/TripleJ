import type { APIRoute } from 'astro';
import { User } from '@/lib/models/User';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';

export const GET: APIRoute = async (context) => {
  try {
    await connectDB();
    
    const authResult = await authenticate(context);
    
    if (!authResult) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No autenticado',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { user } = authResult;
    const url = new URL(context.request.url);
    const role = url.searchParams.get('role');

    let query: any = {};

    // Si se especifica un rol, filtrar por ese rol
    if (role) {
      query.role = role;
    }

    // Si no es administrador, solo mostrar usuarios de proyectos donde participa
    if (user.role !== 'administrador') {
      // Por ahora, mostrar todos los usuarios (se puede mejorar filtrando por proyectos)
      // En el futuro se podría filtrar solo usuarios de proyectos donde el usuario actual participa
    }

    const users = await User.find(query)
      .select('name email role')
      .sort({ name: 1 });

    return new Response(
      JSON.stringify({
        success: true,
        count: users.length,
        data: { users },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error en GET /api/users:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al obtener usuarios: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
