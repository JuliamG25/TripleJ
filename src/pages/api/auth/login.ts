import type { APIRoute } from 'astro';
import { User } from '@/lib/models/User';
import { generateToken } from '@/lib/utils/jwt';
import { connectDB } from '@/lib/config/database';

export const POST: APIRoute = async ({ request }) => {
  try {
    await connectDB();
    
    const { email, password } = await request.json();

    // Validar campos
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Por favor proporciona email y contraseña',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar usuario e incluir password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Credenciales inválidas',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Credenciales inválidas',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generar token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
          },
          token,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error al iniciar sesión',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
