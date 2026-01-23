import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'
import { EditTaskForm } from './EditTaskForm'
import { TaskCommentsModal } from './TaskCommentsModal'
import { useAppStore, type AppState } from '@/lib/store'
import type { TaskStatus, Task } from '@/lib/types'
import { User, Pencil, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { filterTasksByRole, canMoveTask, canCreateOrEdit } from '@/lib/utils/permissions'
import { isTaskBlocked } from '@/lib/utils/task-helpers'

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'pendiente', title: 'Pendiente', color: 'bg-gray-500/10 text-gray-500' },
  { id: 'en-progreso', title: 'En Progreso', color: 'bg-primary/10 text-primary' },
  { id: 'hecha', title: 'Completada', color: 'bg-green-500/10 text-green-500' },
]

const priorityColors = {
  alta: 'bg-red-500/10 text-red-500',
  media: 'bg-yellow-500/10 text-yellow-500',
  baja: 'bg-blue-500/10 text-blue-500',
}

export function KanbanPage() {
  const allTasks = useAppStore((state: AppState) => state.tasks)
  const currentUser = useAppStore((state: AppState) => state.currentUser)
  const updateTaskStatus = useAppStore((state: AppState) => state.updateTaskStatus)
  const loading = useAppStore((state: AppState) => state.loading)
  
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [draggedOverColumn, setDraggedOverColumn] = useState<TaskStatus | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [commentsTask, setCommentsTask] = useState<Task | null>(null)

  // Filtrar tareas según el rol del usuario
  const tasks = filterTasksByRole(allTasks, currentUser)
  const canEdit = canCreateOrEdit(currentUser)

  // Debug
  useEffect(() => {
    console.log('📋 [KanbanPage] Estado de tareas:', {
      allTasksCount: allTasks.length,
      filteredTasksCount: tasks.length,
      currentUserId: currentUser?.id ? String(currentUser.id) : 'null',
      currentUserEmail: currentUser?.email,
      currentUserRole: currentUser?.role,
      allTasksPreview: allTasks.slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        assignees: t.assignees.map(a => ({
          id: String(a.id),
          name: a.name
        }))
      })),
      filteredTasksPreview: tasks.slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        assignees: t.assignees.map(a => ({
          id: String(a.id),
          name: a.name
        }))
      })),
      tasksByStatus: {
        pendiente: tasks.filter(t => t.status === 'pendiente').length,
        'en-progreso': tasks.filter(t => t.status === 'en-progreso').length,
        hecha: tasks.filter(t => t.status === 'hecha').length,
      }
    })
  }, [allTasks.length, tasks.length, currentUser?.id])

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status)
  }

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', task.id)
    // Agregar clase para feedback visual
    e.currentTarget.classList.add('opacity-50')
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50')
    setDraggedTask(null)
    setDraggedOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggedOverColumn(columnId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Solo quitar el highlight si realmente salimos de la columna
    // (no cuando entramos a un elemento hijo)
    const currentTarget = e.currentTarget as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement
    
    if (!currentTarget.contains(relatedTarget)) {
      setDraggedOverColumn(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault()
    setDraggedOverColumn(null)
    
    if (!draggedTask || !currentUser) return
    
    // Verificar si la tarea está bloqueada por vencimiento
    if (isTaskBlocked(draggedTask)) {
      // Solo líderes y administradores pueden mover tareas vencidas
      if (currentUser.role !== 'lider' && currentUser.role !== 'administrador') {
        alert('Esta tarea está vencida y bloqueada. Contacta al líder del proyecto para extender el tiempo.')
        setDraggedTask(null)
        return
      }
    }
    
    // Verificar permisos: desarrolladores solo pueden mover sus tareas
    if (!canMoveTask(draggedTask, currentUser)) {
      console.warn('⚠️ No tienes permiso para mover esta tarea')
      setDraggedTask(null)
      return
    }
    
    // Solo actualizar si cambió de columna
    if (draggedTask.status !== columnId) {
      try {
        await updateTaskStatus(draggedTask.id, columnId)
      } catch (error) {
        console.error('Error al actualizar tarea:', error)
      }
    }
    
    setDraggedTask(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Cargando kanban...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kanban</h1>
        <p className="text-muted-foreground">Tablero visual de tareas</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id)
          const isDraggedOver = draggedOverColumn === column.id
          
          return (
            <div key={column.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{column.title}</h2>
                <Badge variant="secondary" className={column.color}>
                  {columnTasks.length}
                </Badge>
              </div>
              
              <div
                className={`space-y-3 min-h-[400px] rounded-lg transition-colors ${
                  isDraggedOver ? 'bg-primary/5 border-2 border-primary border-dashed' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {columnTasks.map((task) => (
                  editingTask?.id === task.id ? (
                    <EditTaskForm
                      key={task.id}
                      task={task}
                      onSuccess={() => {
                        setEditingTask(null)
                      }}
                      onCancel={() => setEditingTask(null)}
                    />
                  ) : (
                  <Card 
                    key={task.id}
                    draggable={!!(canMoveTask(task, currentUser) && (!isTaskBlocked(task) || (currentUser && (currentUser.role === 'lider' || currentUser.role === 'administrador'))))}
                    onDragStart={(e) => {
                      if (canMoveTask(task, currentUser) && (!isTaskBlocked(task) || (currentUser && (currentUser.role === 'lider' || currentUser.role === 'administrador')))) {
                        handleDragStart(e, task)
                      } else {
                        e.preventDefault()
                      }
                    }}
                    onDragEnd={handleDragEnd}
                    className={`border-border hover:shadow-md transition-all group ${
                      draggedTask?.id === task.id ? 'opacity-50' : ''
                    } ${isTaskBlocked(task) ? 'border-red-500/50 bg-red-50/50 dark:bg-red-900/10' : ''} ${
                      canMoveTask(task, currentUser) && (!isTaskBlocked(task) || (currentUser && (currentUser.role === 'lider' || currentUser.role === 'administrador'))) 
                        ? 'cursor-move' 
                        : 'cursor-not-allowed'
                    }`}
                  >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium text-card-foreground leading-tight">
                            {task.title}
                            {isTaskBlocked(task) && (
                              <span className="ml-2 text-xs font-semibold text-red-600 dark:text-red-400">
                                (Vencida)
                              </span>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-1">
                            {isTaskBlocked(task) && (
                              <Badge 
                                variant="outline"
                                className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-xs"
                              >
                                Vencida
                              </Badge>
                            )}
                            <Badge 
                              variant="outline"
                              className={`${priorityColors[task.priority]} text-xs`}
                            >
                              {task.priority}
                            </Badge>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation()
                                  setEditingTask(task)
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                        
                        {task.dueDate && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            <span>
                              {format(new Date(task.dueDate), "d MMM yyyy", { locale: es })} 
                              {' '}
                              <span className="font-medium">{format(new Date(task.dueDate), "HH:mm")}</span>
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          {task.assignees.length > 0 ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              {task.assignees.slice(0, 2).map((assignee) => (
                                <div key={assignee.id} className="flex items-center gap-1">
                                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-medium text-primary">
                                      {assignee.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  {task.assignees.length === 1 && (
                                    <span className="text-xs text-muted-foreground">
                                      {assignee.name.split(' ')[0]}
                                    </span>
                                  )}
                                </div>
                              ))}
                              {task.assignees.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{task.assignees.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground/50">
                              <User className="h-4 w-4" />
                              <span className="text-xs">Sin asignar</span>
                            </div>
                          )}
                          
                          <Badge 
                            variant="secondary" 
                            className={`text-xs cursor-pointer bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20 ${
                              task.comments.length === 0 ? 'opacity-50' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setCommentsTask(task)
                            }}
                          >
                            💬 {task.comments.length || '0'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                ))}
                
                {columnTasks.length === 0 && !isDraggedOver && (
                  <div className="flex items-center justify-center h-40 border-2 border-dashed border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">No hay tareas</p>
                  </div>
                )}
                
                {isDraggedOver && draggedTask && draggedTask.status !== column.id && (
                  <div className="flex items-center justify-center h-20 border-2 border-dashed border-primary rounded-lg bg-primary/10">
                    <p className="text-sm text-primary font-medium">Suelta aquí para mover</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de comentarios */}
      <TaskCommentsModal
        task={commentsTask}
        open={commentsTask !== null}
        onOpenChange={(open) => {
          if (!open) setCommentsTask(null)
        }}
      />
    </div>
  )
}
