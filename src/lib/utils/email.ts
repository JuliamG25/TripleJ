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

  // Si no hay configuración SMTP, retornar null (no enviar emails)
  if (!email.smtpUser || !email.smtpPassword) {
    console.warn('⚠️ Configuración SMTP no encontrada. Los emails no se enviarán.');
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
      console.warn('⚠️ No se puede enviar email: configuración SMTP no disponible');
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

    console.log(`✅ Email enviado a: ${options.to}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
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
