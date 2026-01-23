import nodemailer from 'nodemailer';
import { config } from '@/lib/config/env';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Crear transporter de nodemailer
function createTransporter() {
  const { email } = config;

  if (!email.smtpUser || !email.smtpPassword) {
    return null;
  }

  return nodemailer.createTransport({
    host: email.smtpHost,
    port: email.smtpPort,
    secure: email.smtpPort === 465, // true para 465, false para otros puertos
    auth: {
      user: email.smtpUser,
      pass: email.smtpPassword,
    },
  });
}

/**
 * Envía un email de notificación
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      return false;
    }

    const { email } = config;

    await transporter.sendMail({
      from: `"FESC - Sistema de Gestión" <${email.smtpFrom}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Convertir HTML a texto plano
    });

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Envía un email de notificación de tarea asignada
 */
export async function sendTaskAssignedEmail(
  toEmail: string,
  toName: string,
  taskTitle: string,
  projectName: string,
  assignedByName: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #e30513; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #e30513; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FESC - Sistema de Gestión</h1>
          </div>
          <div class="content">
            <h2>Nueva Tarea Asignada</h2>
            <p>Hola <strong>${toName}</strong>,</p>
            <p><strong>${assignedByName}</strong> te ha asignado una nueva tarea:</p>
            <div style="background-color: white; padding: 15px; border-left: 4px solid #e30513; margin: 20px 0;">
              <h3 style="margin-top: 0;">${taskTitle}</h3>
              <p><strong>Proyecto:</strong> ${projectName}</p>
            </div>
            <p>Por favor, revisa la tarea en el sistema para más detalles.</p>
            <a href="${config.email.appUrl}/dashboard/kanban" class="button">Ver Tarea</a>
          </div>
          <div class="footer">
            <p>Este es un email automático del Sistema de Gestión FESC. Por favor no respondas a este correo.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: toEmail,
    subject: `Nueva tarea asignada: ${taskTitle}`,
    html,
  });
}

/**
 * Envía un email de notificación de tarea actualizada
 */
export async function sendTaskUpdatedEmail(
  toEmail: string,
  toName: string,
  taskTitle: string,
  projectName: string,
  updatedByName: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #e30513; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #e30513; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FESC - Sistema de Gestión</h1>
          </div>
          <div class="content">
            <h2>Tarea Actualizada</h2>
            <p>Hola <strong>${toName}</strong>,</p>
            <p><strong>${updatedByName}</strong> ha actualizado una tarea asignada a ti:</p>
            <div style="background-color: white; padding: 15px; border-left: 4px solid #e30513; margin: 20px 0;">
              <h3 style="margin-top: 0;">${taskTitle}</h3>
              <p><strong>Proyecto:</strong> ${projectName}</p>
            </div>
            <p>Por favor, revisa los cambios en el sistema.</p>
            <a href="${config.email.appUrl}/dashboard/kanban" class="button">Ver Tarea</a>
          </div>
          <div class="footer">
            <p>Este es un email automático del Sistema de Gestión FESC. Por favor no respondas a este correo.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: toEmail,
    subject: `Tarea actualizada: ${taskTitle}`,
    html,
  });
}

/**
 * Envía un email de notificación de comentario
 */
export async function sendCommentEmail(
  toEmail: string,
  toName: string,
  taskTitle: string,
  projectName: string,
  commentAuthorName: string,
  commentContent: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #e30513; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .comment { background-color: white; padding: 15px; border-left: 4px solid #e30513; margin: 20px 0; }
          .button { display: inline-block; padding: 10px 20px; background-color: #e30513; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FESC - Sistema de Gestión</h1>
          </div>
          <div class="content">
            <h2>Nuevo Comentario</h2>
            <p>Hola <strong>${toName}</strong>,</p>
            <p><strong>${commentAuthorName}</strong> ha comentado en una tarea:</p>
            <div style="background-color: white; padding: 15px; border-left: 4px solid #e30513; margin: 20px 0;">
              <h3 style="margin-top: 0;">${taskTitle}</h3>
              <p><strong>Proyecto:</strong> ${projectName}</p>
            </div>
            <div class="comment">
              <p><strong>${commentAuthorName} dijo:</strong></p>
              <p>${commentContent}</p>
            </div>
            <a href="${config.email.appUrl}/dashboard/kanban" class="button">Ver Comentario</a>
          </div>
          <div class="footer">
            <p>Este es un email automático del Sistema de Gestión FESC. Por favor no respondas a este correo.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: toEmail,
    subject: `Nuevo comentario en: ${taskTitle}`,
    html,
  });
}

/**
 * Envía un email de notificación de tarea vencida
 */
export async function sendTaskOverdueEmail(
  toEmail: string,
  toName: string,
  taskTitle: string,
  projectName: string,
  developerNames: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #e30513; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; padding: 10px 20px; background-color: #e30513; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FESC - Sistema de Gestión</h1>
          </div>
          <div class="content">
            <h2>⚠️ Tarea Vencida</h2>
            <p>Hola <strong>${toName}</strong>,</p>
            <div class="alert">
              <p><strong>Una tarea ha vencido:</strong></p>
              <h3 style="margin-top: 10px;">${taskTitle}</h3>
              <p><strong>Proyecto:</strong> ${projectName}</p>
              <p><strong>Desarrollador(es) asignado(s):</strong> ${developerNames}</p>
            </div>
            <p>Por favor, revisa la situación de esta tarea y toma las acciones necesarias.</p>
            <a href="${config.email.appUrl}/dashboard/kanban" class="button">Ver Tarea</a>
          </div>
          <div class="footer">
            <p>Este es un email automático del Sistema de Gestión FESC. Por favor no respondas a este correo.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: toEmail,
    subject: `⚠️ Tarea vencida: ${taskTitle}`,
    html,
  });
}

/**
 * Envía un email de invitación a una reunión
 */
export async function sendMeetingInvitationEmail(
  toEmail: string,
  toName: string,
  meetingTitle: string,
  projectName: string,
  startDate: Date,
  endDate: Date,
  meetLink?: string,
  location?: string,
  createdByName: string = 'Sistema'
): Promise<void> {
  const formatDate = (date: Date) => {
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const meetingType = meetLink ? 'Virtual' : 'Presencial';
  const meetingDetails = meetLink
    ? `<p><strong>Enlace de Google Meet:</strong> <a href="${meetLink}" style="color: #e30513;">${meetLink}</a></p>`
    : location
    ? `<p><strong>Ubicación:</strong> ${location}</p>`
    : '<p><strong>Ubicación:</strong> Por confirmar</p>';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #e30513; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .meeting-info { background-color: white; padding: 15px; border-left: 4px solid #e30513; margin: 20px 0; }
          .button { display: inline-block; padding: 10px 20px; background-color: #e30513; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FESC - Sistema de Gestión</h1>
          </div>
          <div class="content">
            <h2>Invitación a Reunión</h2>
            <p>Hola <strong>${toName}</strong>,</p>
            <p><strong>${createdByName}</strong> te ha invitado a una reunión:</p>
            <div class="meeting-info">
              <h3 style="margin-top: 0;">${meetingTitle}</h3>
              <p><strong>Proyecto:</strong> ${projectName}</p>
              <p><strong>Tipo:</strong> ${meetingType}</p>
              <p><strong>Fecha y hora de inicio:</strong> ${formatDate(startDate)}</p>
              <p><strong>Fecha y hora de fin:</strong> ${formatDate(endDate)}</p>
              ${meetingDetails}
            </div>
            ${meetLink ? `<a href="${meetLink}" class="button">Unirse a la Reunión</a>` : ''}
          </div>
          <div class="footer">
            <p>Este es un email automático del Sistema de Gestión FESC. Por favor no respondas a este correo.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: toEmail,
    subject: `Invitación a reunión: ${meetingTitle}`,
    html,
  });
}

/**
 * Envía un email de actualización de reunión
 */
export async function sendMeetingUpdateEmail(
  toEmail: string,
  toName: string,
  meetingTitle: string,
  projectName: string,
  startDate: Date,
  endDate: Date,
  meetLink?: string,
  location?: string,
  updatedByName: string = 'Sistema'
): Promise<void> {
  const formatDate = (date: Date) => {
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const meetingType = meetLink ? 'Virtual' : 'Presencial';
  const meetingDetails = meetLink
    ? `<p><strong>Enlace de Google Meet:</strong> <a href="${meetLink}" style="color: #e30513;">${meetLink}</a></p>`
    : location
    ? `<p><strong>Ubicación:</strong> ${location}</p>`
    : '<p><strong>Ubicación:</strong> Por confirmar</p>';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #e30513; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .meeting-info { background-color: white; padding: 15px; border-left: 4px solid #e30513; margin: 20px 0; }
          .button { display: inline-block; padding: 10px 20px; background-color: #e30513; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FESC - Sistema de Gestión</h1>
          </div>
          <div class="content">
            <h2>Reunión Actualizada</h2>
            <p>Hola <strong>${toName}</strong>,</p>
            <p><strong>${updatedByName}</strong> ha actualizado una reunión a la que estás invitado:</p>
            <div class="meeting-info">
              <h3 style="margin-top: 0;">${meetingTitle}</h3>
              <p><strong>Proyecto:</strong> ${projectName}</p>
              <p><strong>Tipo:</strong> ${meetingType}</p>
              <p><strong>Fecha y hora de inicio:</strong> ${formatDate(startDate)}</p>
              <p><strong>Fecha y hora de fin:</strong> ${formatDate(endDate)}</p>
              ${meetingDetails}
            </div>
            ${meetLink ? `<a href="${meetLink}" class="button">Unirse a la Reunión</a>` : ''}
          </div>
          <div class="footer">
            <p>Este es un email automático del Sistema de Gestión FESC. Por favor no respondas a este correo.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: toEmail,
    subject: `Reunión actualizada: ${meetingTitle}`,
    html,
  });
}

/**
 * Envía un email de restablecimiento de contraseña
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  toName: string,
  resetUrl: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #e30513; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #e30513; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .token-info { background-color: white; padding: 15px; border-left: 4px solid #e30513; margin: 20px 0; font-family: monospace; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FESC - Sistema de Gestión</h1>
          </div>
          <div class="content">
            <h2>Restablecer Contraseña</h2>
            <p>Hola <strong>${toName}</strong>,</p>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el botón siguiente para crear una nueva contraseña:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </div>
            <div class="warning">
              <p><strong>⚠️ Importante:</strong></p>
              <ul>
                <li>Este enlace expirará en 1 hora</li>
                <li>Si no solicitaste este restablecimiento, ignora este email</li>
                <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
              </ul>
            </div>
            <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
            <div class="token-info">
              ${resetUrl}
            </div>
          </div>
          <div class="footer">
            <p>Este es un email automático del Sistema de Gestión FESC. Por favor no respondas a este correo.</p>
            <p>Si no solicitaste este restablecimiento, puedes ignorar este mensaje de forma segura.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: toEmail,
    subject: 'Restablecer tu contraseña - FESC',
    html,
  });
}
