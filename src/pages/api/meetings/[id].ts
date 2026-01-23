import type { APIRoute } from 'astro';
import { Meeting } from '@/lib/models/Meeting';
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

    const meeting = await Meeting.findById(context.params.id)
      .populate('projectId', 'name description')
      .populate('participants', 'name email role avatar')
      .populate('createdBy', 'name email role avatar');

    if (!meeting) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Reunión no encontrada',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { meeting },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error en GET /api/meetings/[id]:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al obtener reunión: ${error.message || 'Error desconocido'}`,
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

    const existingMeeting = await Meeting.findById(context.params.id);
    
    if (!existingMeeting) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Reunión no encontrada',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permisos: solo el creador o administrador pueden editar
    const isCreator = existingMeeting.createdBy.toString() === user._id.toString();
    const isAdmin = user.role === 'administrador';

    if (!isCreator && !isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No tienes permisos para editar esta reunión',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.location !== undefined) updateData.location = body.location;
    
    // Validar fechas si se actualizan
    if (updateData.startDate && updateData.endDate) {
      if (updateData.endDate <= updateData.startDate) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'La fecha de fin debe ser posterior a la fecha de inicio',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (updateData.startDate && existingMeeting.endDate) {
      if (existingMeeting.endDate <= updateData.startDate) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'La fecha de fin debe ser posterior a la fecha de inicio',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (updateData.endDate && existingMeeting.startDate) {
      if (updateData.endDate <= existingMeeting.startDate) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'La fecha de fin debe ser posterior a la fecha de inicio',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Manejar meetLink
    if (body.type === 'virtual' && body.meetLink !== undefined) {
      updateData.meetLink = body.meetLink;
    } else if (body.type === 'presencial') {
      updateData.meetLink = undefined;
    }

    // Convertir participantes de emails a IDs si es necesario
    if (body.participants !== undefined) {
      let participantIds: mongoose.Types.ObjectId[] = [];
      if (Array.isArray(body.participants) && body.participants.length > 0) {
        const { User } = await import('@/lib/models/User');
        for (const participant of body.participants) {
          if (typeof participant === 'string' && participant.includes('@')) {
            const foundUser = await User.findOne({ email: participant.toLowerCase() });
            if (foundUser) {
              participantIds.push(foundUser._id);
            }
          } else {
            try {
              participantIds.push(new mongoose.Types.ObjectId(participant));
            } catch (e) {
              console.warn(`⚠️ ID de participante inválido: ${participant}`);
            }
          }
        }
      }
      // Agregar al creador si no está ya incluido
      const creatorId = new mongoose.Types.ObjectId(existingMeeting.createdBy);
      if (!participantIds.some(id => id.toString() === creatorId.toString())) {
        participantIds.push(creatorId);
      }
      updateData.participants = participantIds;
    }

    const meeting = await Meeting.findByIdAndUpdate(
      context.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('projectId', 'name description')
      .populate('participants', 'name email role avatar')
      .populate('createdBy', 'name email role avatar');

    if (!meeting) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Reunión no encontrada',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enviar emails de actualización a los participantes (no crítico si falla)
    try {
      const { sendMeetingUpdateEmail } = await import('@/lib/utils/email');
      const participantEmails = (meeting.participants as any[]).map((p: any) => p.email);
      const project = meeting.projectId as any;
      
      for (const email of participantEmails) {
        await sendMeetingUpdateEmail(
          email,
          (meeting.participants as any[]).find((p: any) => p.email === email)?.name || 'Participante',
          meeting.title,
          project.name,
          new Date(meeting.startDate),
          new Date(meeting.endDate),
          meeting.type === 'virtual' ? meeting.meetLink : undefined,
          meeting.location,
          user.name
        );
      }
    } catch (emailError) {
      console.error('⚠️ Error al enviar emails de actualización (no crítico):', emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reunión actualizada correctamente',
        data: { meeting },
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

    console.error('❌ Error en PUT /api/meetings/[id]:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al actualizar reunión: ${error.message || 'Error desconocido'}`,
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

    const { user } = authResult;

    const meeting = await Meeting.findById(context.params.id);
    
    if (!meeting) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Reunión no encontrada',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permisos: solo el creador o administrador pueden eliminar
    const isCreator = meeting.createdBy.toString() === user._id.toString();
    const isAdmin = user.role === 'administrador';

    if (!isCreator && !isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No tienes permisos para eliminar esta reunión',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await Meeting.findByIdAndDelete(context.params.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reunión eliminada correctamente',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error en DELETE /api/meetings/[id]:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al eliminar reunión: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
