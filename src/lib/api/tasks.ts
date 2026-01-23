import { apiClient } from './client';
import type { Task } from '../types';

export interface TasksResponse {
  tasks: any[];
}

export interface SingleTaskResponse {
  task: any;
}

const transformTask = (task: any): Task => {
  // Manejar assignees - puede venir como array poblado o array de IDs
  let assignees = []
  if (task.assignees && Array.isArray(task.assignees)) {
    assignees = task.assignees
      .filter((assignee: any) => assignee !== null && assignee !== undefined)
      .map((assignee: any) => {
        // Si ya está poblado (tiene name)
        if (assignee && assignee.name) {
          return {
            id: String(assignee._id || assignee.id),
            name: assignee.name,
            email: assignee.email || '',
            role: assignee.role || 'desarrollador',
            avatar: assignee.avatar,
          }
        }
        // Si es solo un ID (ObjectId) - esto no debería pasar si está poblado correctamente
        if (assignee) {
          console.warn('⚠️ [transformTask] Assignee sin datos completos:', {
            taskId: task._id || task.id,
            assignee: assignee._id || assignee.id || assignee
          })
          return {
            id: String(assignee._id || assignee.id || assignee),
            name: '',
            email: '',
            role: 'desarrollador' as const,
          }
        }
        return null
      })
      .filter((a: any) => a !== null)
  }
  
  // Debug
  if (assignees.length > 0) {
    console.log('✅ [transformTask] Tarea transformada:', {
      taskId: task._id || task.id,
      title: task.title,
      assigneesCount: assignees.length,
      assignees: assignees.map((a: any) => ({ id: a.id, name: a.name }))
    })
  }

  // Manejar projectId - puede venir como objeto poblado o como ID
  let projectIdStr = ''
  if (task.projectId) {
    if (typeof task.projectId === 'object') {
      projectIdStr = String(task.projectId._id || task.projectId.id)
    } else {
      projectIdStr = String(task.projectId)
    }
  }
  
  const transformedTask = {
    id: String(task._id || task.id),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignees,
    projectId: projectIdStr,
    comments: (task.comments || []).map((comment: any) => ({
      id: comment._id || comment.id,
      taskId: comment.taskId._id || comment.taskId.id || comment.taskId,
      author: {
        id: comment.author._id || comment.author.id,
        name: comment.author.name,
        email: comment.author.email,
        role: comment.author.role,
        avatar: comment.author.avatar,
      },
      content: comment.content,
      createdAt: new Date(comment.createdAt),
    })),
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
  }
  
  // Debug completo
  console.log('🔄 [transformTask] Tarea transformada completa:', {
    id: transformedTask.id,
    title: transformedTask.title,
    projectId: transformedTask.projectId,
    assigneesCount: transformedTask.assignees.length,
    assignees: transformedTask.assignees.map((a: any) => ({
      id: String(a.id),
      name: a.name,
      email: a.email,
      role: a.role
    })),
    rawAssignees: task.assignees,
    rawAssigneesType: typeof task.assignees,
    rawAssigneesIsArray: Array.isArray(task.assignees),
    rawAssigneesLength: task.assignees?.length || 0
  })
  
  // Si no hay assignees pero debería haberlos, mostrar advertencia
  if (transformedTask.assignees.length === 0 && task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0) {
    console.warn('⚠️ [transformTask] Tarea tiene assignees en raw pero no se transformaron:', {
      taskId: transformedTask.id,
      rawAssignees: task.assignees
    })
  }
  
  return transformedTask
}

export const tasksApi = {
  async getAll(filters?: { projectId?: string; status?: string }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.status) params.append('status', filters.status);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get<TasksResponse>(`/api/tasks${query}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al obtener tareas');
    }

    return response.data.tasks.map(transformTask);
  },

  async getById(id: string): Promise<Task> {
    const response = await apiClient.get<SingleTaskResponse>(`/api/tasks/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al obtener tarea');
    }

    return transformTask(response.data.task);
  },

  async create(data: {
    title: string;
    description: string;
    status?: string;
    priority?: string;
    assignees?: string | string[];
    projectId: string;
    dueDate?: Date | string;
  }): Promise<Task> {
    // Serializar dueDate a ISO string si es un Date
    const payload = {
      ...data,
      dueDate: data.dueDate ? (data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate) : undefined,
    };
    const response = await apiClient.post<SingleTaskResponse>('/api/tasks', payload);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al crear tarea');
    }

    return transformTask(response.data.task);
  },

  async update(id: string, data: Partial<Task>): Promise<Task> {
    // Serializar dueDate a ISO string si es un Date
    const payload = {
      ...data,
      dueDate: data.dueDate !== undefined 
        ? (data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate)
        : undefined,
    };
    const response = await apiClient.put<SingleTaskResponse>(`/api/tasks/${id}`, payload);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al actualizar tarea');
    }

    return transformTask(response.data.task);
  },

  async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`/api/tasks/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar tarea');
    }
  },
};
