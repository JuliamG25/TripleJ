import type { APIRoute } from 'astro';
import { Task } from '@/lib/models/Task';
import { Project } from '@/lib/models/Project';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';

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
    const url = new URL(context.request.url);
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status');

    let query: any = {};

    if (projectId) {
      query.projectId = projectId;
    }

    if (status) {
      query.status = status;
    }

    if (user.role !== 'administrador') {
      const userProjects = await Project.find({
        $or: [
          { leader: user._id },
          { members: user._id },
        ],
      }).select('_id');

      const projectIds = userProjects.map(p => p._id);
      
      if (projectIds.length === 0) {
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
    }

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

    // Verificar tareas vencidas y crear notificaciones (en background, no bloquea la respuesta)
    try {
      const { checkAndNotifyOverdueTasks } = await import('@/lib/utils/notifications');
      // Ejecutar en background sin esperar
      checkAndNotifyOverdueTasks().catch(() => {});
    } catch (err) {
      // No crítico si falla
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: tasks.length,
        data: { tasks },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
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
    const { title, description, status, priority, assignees, projectId, dueDate } = await context.request.json();

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
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    await task.populate('assignees', 'name email role');
    await task.populate('projectId', 'name');

    // Crear notificaciones para los asignados (no crítico si falla)
    if (assigneesArray.length > 0) {
      try {
        const { notifyTaskAssigned } = await import('@/lib/utils/notifications');
        await notifyTaskAssigned(task._id.toString(), assigneesArray, user);
      } catch (notifError) {
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
