import type { APIRoute } from 'astro';
import { Project } from '@/lib/models/Project';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';

export const GET: APIRoute = async (context) => {
  try {
    console.log('📥 GET /api/projects - Iniciando...')
    
    try {
      await connectDB();
      console.log('✅ MongoDB conectado')
    } catch (dbError: any) {
      console.error('❌ Error al conectar MongoDB:', dbError)
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
      console.warn('⚠️ No autenticado')
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No autenticado',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { user } = authResult;
    console.log('👤 Usuario autenticado:', user.email)
    
    let query: any = {};
    
    // Si no es administrador, solo mostrar proyectos donde es líder o miembro
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

    console.log(`✅ Proyectos encontrados: ${projects.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        count: projects.length,
        data: { projects },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error en GET /api/projects:', error)
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

    const project = await Project.create({
      name,
      description,
      leader: user._id,
      members: members || [],
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
