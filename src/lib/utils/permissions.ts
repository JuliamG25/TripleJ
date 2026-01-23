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
  
  const filtered = tasks.filter(task => {
    if (!task.assignees || task.assignees.length === 0) {
      return false
    }
    
    const assigneeIds = task.assignees.map(a => String(a.id))
    return assigneeIds.includes(userId)
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

/**
 * Verifica si el usuario puede crear usuarios
 * - Administrador: puede crear líderes y desarrolladores
 * - Líder: puede crear desarrolladores
 * - Desarrollador: no puede crear usuarios
 */
export function canCreateUsers(user: User | null): boolean {
  if (!user) return false
  return user.role === 'administrador' || user.role === 'lider'
}

/**
 * Verifica si el usuario puede crear un rol específico
 * - Administrador: puede crear cualquier rol
 * - Líder: solo puede crear desarrolladores
 * - Desarrollador: no puede crear usuarios
 */
export function canCreateRole(user: User | null, role: UserRole): boolean {
  if (!user) return false
  
  if (user.role === 'administrador') {
    return true // Administrador puede crear cualquier rol
  }
  
  if (user.role === 'lider') {
    return role === 'desarrollador' // Líder solo puede crear desarrolladores
  }
  
  return false // Desarrollador no puede crear usuarios
}

/**
 * Verifica qué roles puede ver el usuario
 * - Administrador: ve todos los usuarios (todos los roles)
 * - Líder: solo ve desarrolladores
 * - Desarrollador: no ve gestión de usuarios
 */
export function getVisibleRoles(user: User | null): UserRole[] {
  if (!user) return []
  
  if (user.role === 'administrador') {
    return ['administrador', 'lider', 'desarrollador']
  }
  
  if (user.role === 'lider') {
    return ['desarrollador']
  }
  
  return []
}