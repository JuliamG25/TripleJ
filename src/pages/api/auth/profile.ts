import type { APIRoute } from 'astro';
import { User } from '@/lib/models/User';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';
import bcrypt from 'bcryptjs';

export const PUT: APIRoute = async (context) => {
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
    
    // Preparar datos de actualización
    const updateData: any = {};
    
    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }
    
    if (body.email !== undefined) {
      // Verificar que el email no esté en uso por otro usuario
      const existingUser = await User.findOne({ 
        email: body.email.toLowerCase().trim(),
        _id: { $ne: user._id }
      });
      
      if (existingUser) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Este email ya está en uso',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      updateData.email = body.email.toLowerCase().trim();
    }
    
    if (body.avatar !== undefined) {
      updateData.avatar = body.avatar;
    }
    
    // Manejar cambio de contraseña
    if (body.currentPassword && body.newPassword) {
      // Obtener usuario con contraseña
      const userWithPassword = await User.findById(user._id).select('+password');
      
      if (!userWithPassword) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Usuario no encontrado',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Verificar contraseña actual
      const isPasswordValid = await userWithPassword.comparePassword(body.currentPassword);
      
      if (!isPasswordValid) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'La contraseña actual es incorrecta',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Validar nueva contraseña
      if (body.newPassword.length < 6) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'La nueva contraseña debe tener al menos 6 caracteres',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      updateData.password = body.newPassword;
    }
    
    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
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
        message: 'Perfil actualizado correctamente',
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
    console.error('❌ Error en PUT /api/auth/profile:', error);
    
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
        message: 'Error al actualizar perfil',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
