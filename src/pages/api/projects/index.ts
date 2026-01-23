import type { APIRoute } from 'astro';
import { Project } from '@/lib/models/Project';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';
import mongoose from 'mongoose';

export const GET: APIRoute = async (context) => {
  try {
    try {
      await connectDB();
    } catch (dbError: any) {
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
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No autenticado',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { user } = authResult;
    
    let query: any = {};
    
    if (user.role !== 'administrador') {
      query.$or = [
        { leader: user._id },
        { members: user._id },
      ];
    }

    const projects = await Project.find(query)
      .populate('leader', 'name email role')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    return new Response(
      JSON.stringify({
        success: true,
        count: projects.length,
        data: { projects },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al obtener proyectos: ${error.message || 'Error desconocido'}`,
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
    const { name, description, members } = await context.request.json();

    // Convertir emails a IDs si se proporcionan como emails
    let memberIds: mongoose.Types.ObjectId[] = [];
    if (members && Array.isArray(members) && members.length > 0) {
      const { User } = await import('@/lib/models/User');
      for (const member of members) {
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

    const project = await Project.create({
      name,
      description,
      leader: user._id,
      members: memberIds,
    });

    await project.populate('leader', 'name email role');
    await project.populate('members', 'name email role');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Proyecto creado correctamente',
        data: { project },
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
        message: 'Error al crear proyecto',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
