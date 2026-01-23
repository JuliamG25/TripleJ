import type { APIRoute } from 'astro';
import { User } from '@/lib/models/User';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';
import { getVisibleRoles } from '@/lib/utils/permissions';

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

    // Obtener roles visibles según el usuario
    const visibleRoles = getVisibleRoles(user as any);
    
    // Si el usuario no tiene permisos para ver usuarios, retornar vacío
    if (visibleRoles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No tienes permisos para ver usuarios',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let query: any = {};

    // Si se especifica un rol, filtrar por ese rol (solo si está en los roles visibles)
    if (role && visibleRoles.includes(role as any)) {
      query.role = role;
    } else {
      // Si no se especifica rol, mostrar solo los roles que el usuario puede ver
      query.role = { $in: visibleRoles };
    }

    const users = await User.find(query)
      .select('name email role avatar createdAt')
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
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al obtener usuarios: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async (context) => {
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
    const body = await context.request.json();
    const { name, email, password, role } = body;

    // Validar campos requeridos
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Nombre, email y contraseña son requeridos',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar que el rol sea válido
    const validRoles: ('administrador' | 'lider' | 'desarrollador')[] = ['administrador', 'lider', 'desarrollador'];
    const userRole = role || 'desarrollador';
    
    if (!validRoles.includes(userRole)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Rol inválido',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permisos para crear usuarios
    const { canCreateRole } = await import('@/lib/utils/permissions');
    
    if (!canCreateRole(user as any, userRole)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No tienes permisos para crear usuarios con este rol',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'El usuario ya existe',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear nuevo usuario
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
    });

    // No devolver la contraseña
    const { password: _, ...userWithoutPassword } = newUser.toObject();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuario creado correctamente',
        data: {
          user: {
            id: String(userWithoutPassword._id),
            name: userWithoutPassword.name,
            email: userWithoutPassword.email,
            role: userWithoutPassword.role,
            avatar: userWithoutPassword.avatar,
            createdAt: userWithoutPassword.createdAt,
          },
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return new Response(
        JSON.stringify({
          success: false,
          message: messages.join(', '),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al crear usuario: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
