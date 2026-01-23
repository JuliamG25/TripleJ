import type { APIRoute } from 'astro';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';
import { sendTaskAssignedEmail } from '@/lib/utils/email';

export const POST: APIRoute = async (context) => {
  try {
    await connectDB();
    
    // Verificar autenticación (solo para seguridad, pero permitir prueba)
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

    const body = await context.request.json();
    const { toEmail, toName, taskTitle, projectName, assignedByName } = body;

    // Valores por defecto para prueba
    const email = toEmail || 'juliamsteven@gmail.com';
    const name = toName || 'Usuario de Prueba';
    const task = taskTitle || 'Tarea de Prueba';
    const project = projectName || 'Proyecto de Prueba';
    const assigned = assignedByName || 'Sistema FESC';

    // Enviar email de prueba
    await sendTaskAssignedEmail(email, name, task, project, assigned);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email de prueba enviado a ${email}`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error al enviar email de prueba:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al enviar email: ${error.message || 'Error desconocido'}`,
        error: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
