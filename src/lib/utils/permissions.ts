import type { User, UserRole, Task } from '../types'

/**
 * Verifica si el usuario puede crear/editar tareas y proyectos
 */
export function canCreateOrEdit(user: User | null): boolean {
  if (!user) return false
  return user.role === 'administrador' || user.role === 'lider'
}

/**
 * Verifica si el usuario puede ver todas las tareas o solo las suyas
 */
export function canViewAllTasks(user: User | null): boolean {
  if (!user) return false
  return user.role === 'administrador' || user.role === 'lider'
}

/**
 * Filtra tareas según el rol del usuario
 * - Desarrolladores: solo ven tareas asignadas a ellos
 * - Líderes y Administradores: ven todas las tareas
 */
export function filterTasksByRole(tasks: Task[], user: User | null): Task[] {
  if (!user) return []
  
  if (canViewAllTasks(user)) {
    return tasks
  }
  
  // Desarrolladores solo ven sus tareas
  // Comparar IDs como strings para evitar problemas de tipo
  const userId = String(user.id)
  
  console.log('🔍 [filterTasksByRole] Iniciando filtrado:', {
    userId,
    userEmail: user.email,
    userRole: user.role,
    totalTasks: tasks.length,
    tasksPreview: tasks.slice(0, 3).map(t => ({
      id: t.id,
      title: t.title,
      assigneesCount: t.assignees?.length || 0,
      assignees: t.assignees?.map(a => ({
        id: String(a.id),
        name: a.name,
        email: a.email
      })) || []
    }))
  })
  
  const filtered = tasks.filter(task => {
    if (!task.assignees || task.assignees.length === 0) {
      console.log('❌ [filterTasksByRole] Tarea sin asignados:', {
        taskId: task.id,
        taskTitle: task.title
      })
      return false // Si no tiene asignados, desarrolladores no la ven
    }
    
    const assigneeIds = task.assignees.map(a => String(a.id))
    const isAssigned = assigneeIds.includes(userId)
    
    console.log(`🔍 [filterTasksByRole] Tarea "${task.title}":`, {
      taskId: task.id,
      userId,
      assigneeIds,
      isAssigned,
      match: assigneeIds.includes(userId)
    })
    
    return isAssigned
  })
  
  console.log('📊 [filterTasksByRole] Resultado del filtrado:', {
    totalTasks: tasks.length,
    filteredTasks: filtered.length,
    userId,
    userRole: user.role,
    filteredTaskIds: filtered.map(t => t.id)
  })
  
  return filtered
}

/**
 * Verifica si el usuario puede mover una tarea específica en el kanban
 * - Desarrolladores: solo pueden mover sus propias tareas
 * - Líderes y Administradores: pueden mover cualquier tarea
 */
export function canMoveTask(task: Task, user: User | null): boolean {
  if (!user) return false
  
  if (canViewAllTasks(user)) {
    return true
  }
  
  // Desarrolladores solo pueden mover sus tareas
  return task.assignees.some(assignee => assignee.id === user.id)
}
