import type { APIRoute } from 'astro';
import { Project } from '@/lib/models/Project';
import { User } from '@/lib/models/User';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';
import mongoose from 'mongoose';

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

    const project = await Project.findById(context.params.id)
      .populate('leader', 'name email role')
      .populate('members', 'name email role');

    if (!project) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Proyecto no encontrado',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { project },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error al obtener proyecto',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

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

    // Buscar el proyecto existente
    const existingProject = await Project.findById(context.params.id);
    
    if (!existingProject) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Proyecto no encontrado',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permisos: solo administradores pueden cambiar el líder
    // Los líderes solo pueden editar sus propios proyectos
    if (user.role === 'lider') {
      // El líder solo puede editar proyectos donde es líder
      if (existingProject.leader.toString() !== user._id.toString()) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No tienes permisos para editar este proyecto',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // Los líderes no pueden cambiar el líder del proyecto
      if (body.leader && body.leader !== existingProject.leader.toString()) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No tienes permisos para cambiar el líder del proyecto',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (user.role !== 'administrador') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No tienes permisos para editar proyectos',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    
    // Convertir miembros de emails a IDs si es necesario
    if (body.members !== undefined) {
      let memberIds: mongoose.Types.ObjectId[] = [];
      if (Array.isArray(body.members) && body.members.length > 0) {
        for (const member of body.members) {
          // Si es un email, buscar el usuario
          if (typeof member === 'string' && member.includes('@')) {
            const foundUser = await User.findOne({ email: member.toLowerCase() });
            if (foundUser) {
              memberIds.push(foundUser._id);
            }
          } else {
            // Si ya es un ID, usarlo directamente
            try {
              memberIds.push(new mongoose.Types.ObjectId(member));
            } catch (e) {
            }
          }
        }
      }
      updateData.members = memberIds;
    }
    
    // Solo administradores pueden cambiar el líder
    if (body.leader !== undefined && user.role === 'administrador') {
      updateData.leader = body.leader;
    }

    const project = await Project.findByIdAndUpdate(
      context.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('leader', 'name email role avatar')
      .populate('members', 'name email role avatar');

    if (!project) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Proyecto no encontrado',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Proyecto actualizado correctamente',
        data: { project },
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
        message: `Error al actualizar proyecto: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async (context) => {
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

    const project = await Project.findByIdAndDelete(context.params.id);

    if (!project) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Proyecto no encontrado',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Proyecto eliminado correctamente',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error al eliminar proyecto',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
