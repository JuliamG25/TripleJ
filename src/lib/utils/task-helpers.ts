import type { Task } from '../types'

/**
 * Verifica si una tarea está vencida
 * Una tarea está vencida si tiene fecha de entrega y esa fecha ya pasó y no está completada
 */
export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate) return false
  if (task.status === 'hecha') return false
  
  const now = new Date()
  const dueDate = new Date(task.dueDate)
  
  return dueDate < now
}

/**
 * Verifica si una tarea está bloqueada por vencimiento
 */
export function isTaskBlocked(task: Task): boolean {
  return isTaskOverdue(task)
}
