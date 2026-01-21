import type { APIRoute } from 'astro';
import { User } from '@/lib/models/User';
import { generateToken } from '@/lib/utils/jwt';
import { connectDB } from '@/lib/config/database';

export const POST: APIRoute = async ({ request }) => {
  try {
    await connectDB();
    
    const { name, email, password, role } = await request.json();

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
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
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'desarrollador',
    });

    // Generar token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuario registrado correctamente',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
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
        message: 'Error al registrar usuario',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
