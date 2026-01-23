import { Notification } from '@/lib/models/Notification';
import { Task } from '@/lib/models/Task';
import { Project } from '@/lib/models/Project';
import { User } from '@/lib/models/User';
import type { IUser } from '@/lib/models/User';
import {
  sendTaskAssignedEmail,
  sendTaskUpdatedEmail,
  sendCommentEmail,
  sendTaskOverdueEmail,
} from './email';

/**
 * Crea una notificación cuando se asigna una tarea a un desarrollador
 */
export async function notifyTaskAssigned(
  taskId: string,
  assigneeIds: string[],
  assignedBy: IUser
): Promise<void> {
  try {
    const task = await Task.findById(taskId).populate('projectId');
    if (!task) return;

    const project = task.projectId as any;
    const assignees = await User.find({ _id: { $in: assigneeIds } });

    for (const assignee of assignees) {
      // Solo notificar a desarrolladores
      if (assignee.role === 'desarrollador') {
        await Notification.create({
          userId: assignee._id,
          type: 'task_assigned',
          title: 'Nueva tarea asignada',
          message: `${assignedBy.name} te asignó la tarea "${task.title}" en el proyecto "${project.name}"`,
          taskId: task._id,
          projectId: project._id,
          read: false,
        });
        
        // Enviar email si está habilitado (no crítico si falla)
        try {
          await sendTaskAssignedEmail(
            assignee.email,
            assignee.name,
            task.title,
            project.name,
            assignedBy.name
          );
        } catch (emailError) {
          // Error no crítico al enviar email
        }
      }
    }
  } catch (error) {
    // Error al crear notificación
  }
}

/**
 * Crea notificaciones cuando una tarea se vence
 */
export async function notifyTaskOverdue(
  taskId: string
): Promise<void> {
  try {
    const task = await Task.findById(taskId)
      .populate('assignees')
      .populate('projectId');
    
    if (!task) return;

    const project = task.projectId as any;
    const assignees = task.assignees as any[];
    
    // Solo notificar si la tarea no está completada
    if (task.status === 'hecha') return;

    // Obtener el líder del proyecto
    const projectWithLeader = await Project.findById(project._id).populate('leader');
    const leader = (projectWithLeader as any)?.leader;

    if (!leader) return;

    // Obtener nombres de los desarrolladores asignados que no completaron la tarea
    const developerNames = assignees
      .filter((a: any) => a.role === 'desarrollador')
      .map((a: any) => a.name)
      .join(', ');

    if (developerNames) {
      // Notificar al líder del proyecto
      await Notification.create({
        userId: leader._id,
        type: 'task_overdue',
        title: 'Tarea vencida',
        message: `La tarea "${task.title}" del proyecto "${project.name}" venció. Desarrollador(es) asignado(s): ${developerNames}`,
        taskId: task._id,
        projectId: project._id,
        read: false,
      });
      
      // Enviar email si está habilitado (no crítico si falla)
      try {
        await sendTaskOverdueEmail(
          leader.email,
          leader.name,
          task.title,
          project.name,
          developerNames
        );
      } catch (emailError) {
      }
    }
  } catch (error) {
  }
}

/**
 * Verifica y notifica tareas vencidas
 */
export async function checkAndNotifyOverdueTasks(): Promise<void> {
  try {
    const now = new Date();
    
    // Buscar tareas con fecha de entrega pasada y que no estén completadas
    const overdueTasks = await Task.find({
      dueDate: { $exists: true, $lt: now },
      status: { $ne: 'hecha' }
    })
      .populate('assignees')
      .populate('projectId');

    for (const task of overdueTasks) {
      // Verificar si ya existe una notificación reciente para esta tarea (últimas 24 horas)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const existingNotification = await Notification.findOne({
        taskId: task._id,
        type: 'task_overdue',
        createdAt: { $gte: oneDayAgo }
      });

      // Solo crear notificación si no existe una reciente
      if (!existingNotification) {
        await notifyTaskOverdue(task._id.toString());
      }
    }
  } catch (error) {
  }
}

/**
 * Crea notificaciones cuando se actualiza una tarea
 */
export async function notifyTaskUpdated(
  taskId: string,
  updatedBy: IUser
): Promise<void> {
  try {
    const task = await Task.findById(taskId)
      .populate('assignees')
      .populate('projectId');
    
    if (!task) return;

    const project = task.projectId as any;
    const assignees = task.assignees as any[];

    // Notificar solo a desarrolladores asignados (no al que actualizó)
    for (const assignee of assignees) {
      if (
        assignee.role === 'desarrollador' &&
        assignee._id.toString() !== updatedBy._id.toString()
      ) {
        await Notification.create({
          userId: assignee._id,
          type: 'task_updated',
          title: 'Tarea actualizada',
          message: `${updatedBy.name} actualizó la tarea "${task.title}" en el proyecto "${project.name}"`,
          taskId: task._id,
          projectId: project._id,
          read: false,
        });
        
        // Enviar email si está habilitado (no crítico si falla)
        try {
          await sendTaskUpdatedEmail(
            assignee.email,
            assignee.name,
            task.title,
            project.name,
            updatedBy.name
          );
        } catch (emailError) {
        }
      }
    }
  } catch (error) {
  }
}

/**
 * Crea notificaciones cuando se agrega un comentario
 */
export async function notifyCommentAdded(
  taskId: string,
  commentAuthor: IUser,
  commentContent: string
): Promise<void> {
  try {
    const task = await Task.findById(taskId)
      .populate('assignees')
      .populate('projectId');
    
    if (!task) return;

    const project = task.projectId as any;
    const assignees = task.assignees as any[];
    
    // Obtener el líder del proyecto
    const projectWithLeader = await Project.findById(project._id).populate('leader');
    const leader = (projectWithLeader as any)?.leader;

    // Obtener todos los administradores
    const admins = await User.find({ role: 'administrador' });

    const notifiedUserIds = new Set<string>();

    // Si el comentario es de un desarrollador, notificar a líder y administradores
    if (commentAuthor.role === 'desarrollador') {
      // Notificar al líder del proyecto
      if (leader && leader._id.toString() !== commentAuthor._id.toString()) {
        await Notification.create({
          userId: leader._id,
          type: 'comment_added',
          title: 'Nuevo comentario en tarea',
          message: `${commentAuthor.name} comentó en "${task.title}": "${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}"`,
          taskId: task._id,
          projectId: project._id,
          read: false,
        });
        notifiedUserIds.add(leader._id.toString());
        
        // Enviar email si está habilitado (no crítico si falla)
        try {
          await sendCommentEmail(
            leader.email,
            leader.name,
            task.title,
            project.name,
            commentAuthor.name,
            commentContent
          );
        } catch (emailError) {
        }
      }

      // Notificar a administradores
      for (const admin of admins) {
        if (admin._id.toString() !== commentAuthor._id.toString()) {
          await Notification.create({
            userId: admin._id,
            type: 'comment_added',
            title: 'Nuevo comentario en tarea',
            message: `${commentAuthor.name} comentó en "${task.title}": "${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}"`,
            taskId: task._id,
            projectId: project._id,
            read: false,
          });
          notifiedUserIds.add(admin._id.toString());
          
          // Enviar email si está habilitado (no crítico si falla)
          try {
            await sendCommentEmail(
              admin.email,
              admin.name,
              task.title,
              project.name,
              commentAuthor.name,
              commentContent
            );
          } catch (emailError) {
          }
        }
      }
    } else {
      // Si el comentario es de líder o administrador, notificar a los desarrolladores asignados
      for (const assignee of assignees) {
        if (
          assignee.role === 'desarrollador' &&
          assignee._id.toString() !== commentAuthor._id.toString() &&
          !notifiedUserIds.has(assignee._id.toString())
        ) {
          await Notification.create({
            userId: assignee._id,
            type: 'comment_added',
            title: 'Nuevo comentario en tu tarea',
            message: `${commentAuthor.name} comentó en "${task.title}": "${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}"`,
            taskId: task._id,
            projectId: project._id,
            read: false,
          });
          notifiedUserIds.add(assignee._id.toString());
          
          // Enviar email si está habilitado (no crítico si falla)
          try {
            await sendCommentEmail(
              assignee.email,
              assignee.name,
              task.title,
              project.name,
              commentAuthor.name,
              commentContent
            );
          } catch (emailError) {
          }
        }
      }
    }
  } catch (error) {
  }
}
