import type { APIRoute } from 'astro';
import { Notification } from '@/lib/models/Notification';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';

// Asegurar conexión a DB
connectDB().catch(() => {});

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
    const url = new URL(context.request.url);
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

    let query: any = { userId: user._id };
    
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('taskId', 'title')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: user._id,
      read: false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: { notifications, unreadCount },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al obtener notificaciones: ${error.message || 'Error desconocido'}`,
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
    const { notificationId, markAllAsRead } = await context.request.json();

    if (markAllAsRead) {
      // Marcar todas las notificaciones del usuario como leídas
      await Notification.updateMany(
        { userId: user._id, read: false },
        { read: true }
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Todas las notificaciones marcadas como leídas',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (notificationId) {
      // Marcar una notificación específica como leída
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId: user._id },
        { read: true },
        { new: true }
      );

      if (!notification) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Notificación no encontrada',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Notificación marcada como leída',
          data: { notification },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: 'notificationId o markAllAsRead requerido',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al actualizar notificación: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
