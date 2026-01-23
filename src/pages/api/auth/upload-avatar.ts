import type { APIRoute } from 'astro';
import { User } from '@/lib/models/User';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';

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
    
    if (!body.avatar || typeof body.avatar !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Avatar es requerido',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validar que sea una imagen base64 válida
    if (!body.avatar.startsWith('data:image/')) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Formato de imagen inválido',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Actualizar avatar del usuario
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { avatar: body.avatar },
      {
        new: true,
        runValidators: true,
      }
    ).select('name email role avatar');
    
    if (!updatedUser) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Usuario no encontrado',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Avatar actualizado correctamente',
        data: {
          user: {
            id: updatedUser._id.toString(),
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error al actualizar avatar',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
