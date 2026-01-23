import type { APIRoute } from 'astro';
import { User } from '@/lib/models/User';
import { connectDB } from '@/lib/config/database';
import crypto from 'crypto';

export const POST: APIRoute = async (context) => {
  try {
    await connectDB();
    
    const { token, password } = await context.request.json();

    if (!token || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Token y nueva contraseña son requeridos',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanToken = token.trim();
    const hashedToken = crypto.createHash('sha256').update(cleanToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      const expiredUser = await User.findOne({
        resetPasswordToken: hashedToken,
      });

      if (expiredUser) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'El enlace de restablecimiento ha expirado. Por favor solicita un nuevo enlace.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Token inválido. Por favor solicita un nuevo enlace de restablecimiento.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contraseña restablecida correctamente',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
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
        message: `Error al restablecer contraseña: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
