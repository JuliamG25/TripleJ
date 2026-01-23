import type { APIRoute } from 'astro';
import { Task } from '@/lib/models/Task';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';

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

    const task = await Task.findById(context.params.id)
      .populate('assignees', 'name email role')
      .populate('projectId', 'name description')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name email role',
        },
      });

    if (!task) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Tarea no encontrada',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { task },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error al obtener tarea',
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
    
    // Manejar assignees si viene en el body
    if (body.assignees !== undefined) {
      body.assignees = Array.isArray(body.assignees) 
        ? body.assignees.filter(Boolean)
        : body.assignees 
          ? [body.assignees]
          : [];
    }

    // Manejar dueDate: convertir a Date si viene como string, o establecer como null/undefined si se quiere eliminar
    if (body.dueDate !== undefined) {
      if (body.dueDate === null || body.dueDate === '') {
        body.dueDate = undefined;
      } else {
        body.dueDate = new Date(body.dueDate);
      }
    }

    const oldTask = await Task.findById(context.params.id);
    const task = await Task.findByIdAndUpdate(
      context.params.id,
      body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('assignees', 'name email role')
      .populate('projectId', 'name')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name email role',
        },
      });

    // Si se actualizaron los asignados, crear notificaciones (no crítico si falla)
    if (task && body.assignees && oldTask) {
      try {
        const oldAssignees = (oldTask.assignees || []).map((a: any) => a.toString());
        const newAssignees = (task.assignees || []).map((a: any) => a._id.toString());
        
        // Encontrar nuevos asignados
        const addedAssignees = newAssignees.filter(id => !oldAssignees.includes(id));
        
        if (addedAssignees.length > 0) {
          const { notifyTaskAssigned } = await import('@/lib/utils/notifications');
          await notifyTaskAssigned(task._id.toString(), addedAssignees, user);
        }
      } catch (notifError) {
        // Continuar aunque falle la notificación
      }
    }

    // Notificar a desarrolladores asignados cuando se actualiza la tarea (no crítico si falla)
    if (task) {
      try {
        const { notifyTaskUpdated } = await import('@/lib/utils/notifications');
        await notifyTaskUpdated(task._id.toString(), user);
      } catch (notifError) {
        console.error('⚠️ Error al crear notificación de actualización (no crítico):', notifError);
        // Continuar aunque falle la notificación
      }
    }

    if (!task) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Tarea no encontrada',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tarea actualizada correctamente',
        data: { task },
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
        message: 'Error al actualizar tarea',
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

    const task = await Task.findByIdAndDelete(context.params.id);

    if (!task) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Tarea no encontrada',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tarea eliminada correctamente',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error al eliminar tarea',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
