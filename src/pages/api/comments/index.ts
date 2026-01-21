import type { APIRoute } from 'astro';
import { Comment, Task } from '@/lib/models/Task';
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

    const url = new URL(context.request.url);
    const taskId = url.searchParams.get('taskId');

    if (!taskId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ID de tarea requerido',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const comments = await Comment.find({ taskId })
      .populate('author', 'name email role')
      .sort({ createdAt: -1 });

    return new Response(
      JSON.stringify({
        success: true,
        count: comments.length,
        data: { comments },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error en GET /api/comments:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al obtener comentarios: ${error.message || 'Error desconocido'}`,
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
    const { taskId, content } = await context.request.json();

    if (!taskId || !content) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ID de tarea y contenido son requeridos',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que la tarea existe
    const task = await Task.findById(taskId);
    if (!task) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Tarea no encontrada',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear comentario
    const comment = await Comment.create({
      taskId,
      author: user._id,
      content,
    });

    // Agregar comentario a la tarea
    task.comments.push(comment._id);
    await task.save();

    await comment.populate('author', 'name email role');

    // Crear notificaciones para el comentario
    const { notifyCommentAdded } = await import('@/lib/utils/notifications');
    await notifyCommentAdded(taskId, user, content);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Comentario creado correctamente',
        data: { comment },
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

    console.error('❌ Error en POST /api/comments:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al crear comentario: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
