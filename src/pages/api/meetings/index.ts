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

    const { user } = authResult;
    const url = new URL(context.request.url);
    const projectId = url.searchParams.get('projectId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    let query: any = {};

    // Si no es administrador, solo mostrar reuniones donde es participante o creador
    if (user.role !== 'administrador') {
      query.$or = [
        { participants: user._id },
        { createdBy: user._id },
      ];
    }

    // Filtrar por proyecto si se especifica
    if (projectId) {
      query.projectId = new mongoose.Types.ObjectId(projectId);
    }

    // Filtrar por rango de fechas si se especifica
    if (startDate && endDate) {
      query.$or = [
        {
          startDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
        {
          endDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
        {
          $and: [
            { startDate: { $lte: new Date(startDate) } },
            { endDate: { $gte: new Date(endDate) } },
          ],
        },
      ];
    }

    const meetings = await Meeting.find(query)
      .populate('projectId', 'name description')
      .populate('participants', 'name email role avatar')
      .populate('createdBy', 'name email role avatar')
      .sort({ startDate: 1 });

    return new Response(
      JSON.stringify({
        success: true,
        count: meetings.length,
        data: { meetings },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error en GET /api/meetings:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al obtener reuniones: ${error.message || 'Error desconocido'}`,
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
    const body = await context.request.json();
    const { title, description, startDate, endDate, type, meetLink, projectId, participants, location } = body;

    // Validar campos requeridos
    if (!title || !description || !startDate || !type || !projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Faltan campos requeridos',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Si no se proporciona endDate, calcularlo automáticamente (1 hora después del inicio)
    let finalEndDate = endDate ? new Date(endDate) : new Date(new Date(startDate).getTime() + 60 * 60 * 1000);

    // Validar que endDate sea posterior a startDate
    if (finalEndDate <= new Date(startDate)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'La fecha de fin debe ser posterior a la fecha de inicio',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar que si es virtual, tenga meetLink
    if (type === 'virtual' && !meetLink) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Las reuniones virtuales requieren un enlace de Google Meet',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convertir participantes de IDs a ObjectIds
    let participantIds: mongoose.Types.ObjectId[] = [];
    if (participants && Array.isArray(participants) && participants.length > 0) {
      for (const participantId of participants) {
        try {
          participantIds.push(new mongoose.Types.ObjectId(participantId));
        } catch (e) {
          console.warn(`⚠️ ID de participante inválido: ${participantId}`);
        }
      }
    }

    // Agregar al creador como participante si no está ya incluido
    const creatorId = new mongoose.Types.ObjectId(user._id);
    if (!participantIds.some(id => id.toString() === creatorId.toString())) {
      participantIds.push(creatorId);
    }

    const meeting = await Meeting.create({
      title,
      description,
      startDate: new Date(startDate),
      endDate: finalEndDate,
      type,
      meetLink: type === 'virtual' ? meetLink : undefined,
      projectId: new mongoose.Types.ObjectId(projectId),
      participants: participantIds,
      createdBy: creatorId,
      location: type === 'presencial' ? location : undefined,
      status: 'programada',
    });

    await meeting.populate('projectId', 'name description');
    await meeting.populate('participants', 'name email role avatar');
    await meeting.populate('createdBy', 'name email role avatar');

    // Enviar emails a los participantes (no crítico si falla)
    try {
      const { sendMeetingInvitationEmail } = await import('@/lib/utils/email');
      const participantEmails = (meeting.participants as any[]).map((p: any) => p.email);
      const project = meeting.projectId as any;
      
      for (const email of participantEmails) {
        await sendMeetingInvitationEmail(
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
      console.error('⚠️ Error al enviar emails de invitación (no crítico):', emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reunión creada correctamente',
        data: { meeting },
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

    console.error('❌ Error en POST /api/meetings:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al crear reunión: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
