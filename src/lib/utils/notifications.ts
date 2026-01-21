import { Notification } from '@/lib/models/Notification';
import { Task } from '@/lib/models/Task';
import { Project } from '@/lib/models/Project';
import { User } from '@/lib/models/User';
import type { IUser } from '@/lib/models/User';

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
      }
    }
  } catch (error) {
    console.error('Error al crear notificación de tarea asignada:', error);
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
        }
      }
    }
  } catch (error) {
    console.error('Error al crear notificación de comentario:', error);
  }
}
