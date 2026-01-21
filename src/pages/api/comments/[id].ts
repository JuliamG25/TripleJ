import type { APIRoute } from 'astro';
import { Comment, Task } from '@/lib/models/Task';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';

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

    const { user } = authResult;
    const comment = await Comment.findById(context.params.id);

    if (!comment) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Comentario no encontrado',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solo el autor o un administrador pueden eliminar
    if (
      comment.author.toString() !== user._id.toString() &&
      user.role !== 'administrador'
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No tienes permiso para eliminar este comentario',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Remover comentario de la tarea
    await Task.updateOne(
      { _id: comment.taskId },
      { $pull: { comments: comment._id } }
    );

    await Comment.findByIdAndDelete(params.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Comentario eliminado correctamente',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error al eliminar comentario',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
