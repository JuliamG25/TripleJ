import type { APIRoute } from 'astro';
import { User } from '@/lib/models/User';
import { connectDB } from '@/lib/config/database';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/utils/email';
import { config } from '@/lib/config/env';

export const POST: APIRoute = async (context) => {
  try {
    await connectDB();
    
    const { email } = await context.request.json();

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Por favor proporciona un email',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar usuario
    const user = await User.findOne({ email: email.toLowerCase() });

    // Por seguridad, siempre devolver éxito aunque el usuario no exista
    // Esto previene que atacantes descubran qué emails están registrados
    if (!user) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generar token de restablecimiento
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Guardar token hasheado y fecha de expiración (1 hora)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Detectar URL base automáticamente desde el request o usar config
    let baseUrl = config.email.appUrl;
    if (context.request.headers) {
      const host = context.request.headers.get('host');
      const protocol = context.request.headers.get('x-forwarded-proto') || 
                      (context.request.headers.get('x-forwarded-ssl') === 'on' ? 'https' : 'http') ||
                      (host?.includes('localhost') ? 'http' : 'https');
      if (host) {
        baseUrl = `${protocol}://${host}`;
      }
    }
    
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Error al enviar el email. Por favor intenta nuevamente más tarde.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al procesar la solicitud: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
