import type { APIRoute } from 'astro';
import { Task } from '@/lib/models/Task';
import { Project } from '@/lib/models/Project';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';

export const GET: APIRoute = async (context) => {
  try {
    console.log('📥 GET /api/tasks - Iniciando...')
    
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
    const url = new URL(context.request.url);
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status');

    console.log('👤 Usuario solicitando tareas:', {
      userId: user._id,
      userEmail: user.email,
      userRole: user.role
    })

    let query: any = {};

    // Filtrar por proyecto si se proporciona
    if (projectId) {
      query.projectId = projectId;
      console.log('📌 Filtro por proyecto específico:', projectId)
    }

    // Filtrar por estado si se proporciona
    if (status) {
      query.status = status;
      console.log('📌 Filtro por estado:', status)
    }

    // Si no es administrador, solo mostrar tareas de proyectos donde es miembro
    if (user.role !== 'administrador') {
      console.log('🔍 Buscando proyectos del usuario...')
      const userProjects = await Project.find({
        $or: [
          { leader: user._id },
          { members: user._id },
        ],
      }).select('_id');

      const projectIds = userProjects.map(p => p._id);
      console.log('📁 Proyectos encontrados para el usuario:', {
        count: projectIds.length,
        projectIds: projectIds.map((id: any) => id.toString())
      })
      
      if (projectIds.length === 0) {
        console.warn('⚠️ Usuario no es miembro de ningún proyecto')
        // Si no es miembro de ningún proyecto, no puede ver tareas
        return new Response(
          JSON.stringify({
            success: true,
            count: 0,
            data: { tasks: [] },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      query.projectId = { $in: projectIds };
    } else {
      console.log('👑 Usuario es administrador, mostrando todas las tareas')
    }
    
    console.log('🔍 Query final para buscar tareas:', JSON.stringify(query, null, 2))

    const tasks = await Task.find(query)
      .populate('assignees', 'name email role')
      .populate('projectId', 'name')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name email role',
        },
      })
      .sort({ createdAt: -1 });

    console.log(`✅ Tareas encontradas: ${tasks.length}`)
    
    // Debug: verificar assignees
    tasks.forEach((task: any, index: number) => {
      console.log(`📋 Tarea ${index + 1}:`, {
        id: task._id,
        title: task.title,
        assigneesRaw: task.assignees,
        assigneesCount: task.assignees?.length || 0,
        assigneesArray: Array.isArray(task.assignees) ? 'Sí' : 'No',
        assigneesType: typeof task.assignees
      })
    })

    return new Response(
      JSON.stringify({
        success: true,
        count: tasks.length,
        data: { tasks },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error en GET /api/tasks:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al obtener tareas: ${error.message || 'Error desconocido'}`,
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
    const { title, description, status, priority, assignees, projectId } = await context.request.json();

    // Convertir assignees a array si viene como string o undefined
    const assigneesArray = Array.isArray(assignees) 
      ? assignees.filter(Boolean)
      : assignees 
        ? [assignees]
        : [];

    const task = await Task.create({
      title,
      description,
      status: status || 'pendiente',
      priority: priority || 'media',
      assignees: assigneesArray,
      projectId,
    });

    await task.populate('assignees', 'name email role');
    await task.populate('projectId', 'name');

    // Crear notificaciones para los asignados (no crítico si falla)
    if (assigneesArray.length > 0) {
      try {
        const { notifyTaskAssigned } = await import('@/lib/utils/notifications');
        await notifyTaskAssigned(task._id.toString(), assigneesArray, user);
      } catch (notifError) {
        console.error('⚠️ Error al crear notificaciones (no crítico):', notifError);
        // Continuar aunque falle la notificación
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tarea creada correctamente',
        data: { task },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error en POST /api/tasks:', error);
    
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
        message: `Error al crear tarea: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
