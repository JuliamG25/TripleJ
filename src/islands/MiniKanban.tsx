import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'
import { EditTaskForm } from './EditTaskForm'
import { TaskCommentsModal } from './TaskCommentsModal'
import { useAppStore, type AppState } from '@/lib/store'
import type { TaskStatus, Task } from '@/lib/types'
import { User, Pencil } from 'lucide-react'
import { filterTasksByRole, canMoveTask, canCreateOrEdit } from '@/lib/utils/permissions'

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

interface MiniKanbanProps {
  projectId: string
}

export function MiniKanban({ projectId }: MiniKanbanProps) {
  const allTasks = useAppStore((state: AppState) => state.tasks)
  const currentUser = useAppStore((state: AppState) => state.currentUser)
  const updateTaskStatus = useAppStore((state: AppState) => state.updateTaskStatus)
  
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [draggedOverColumn, setDraggedOverColumn] = useState<TaskStatus | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [commentsTask, setCommentsTask] = useState<Task | null>(null)

  // Filtrar tareas del proyecto y según el rol del usuario
  const projectTasks = filterTasksByRole(
    allTasks.filter(task => task.projectId === projectId),
    currentUser
  )
  const canEdit = canCreateOrEdit(currentUser)

  const getTasksByStatus = (status: TaskStatus) => {
    return projectTasks.filter(task => task.status === status)
  }

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', task.id)
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
    
    // Verificar permisos: desarrolladores solo pueden mover sus tareas
    if (!canMoveTask(draggedTask, currentUser)) {
      console.warn('⚠️ No tienes permiso para mover esta tarea')
      setDraggedTask(null)
      return
    }
    
    if (draggedTask.status !== columnId) {
      try {
        await updateTaskStatus(draggedTask.id, columnId)
      } catch (error) {
        console.error('Error al actualizar tarea:', error)
      }
    }
    
    setDraggedTask(null)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.id)
        const isDraggedOver = draggedOverColumn === column.id
        
        return (
          <div key={column.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
              <Badge variant="secondary" className={`${column.color} text-xs`}>
                {columnTasks.length}
              </Badge>
            </div>
            
            <div
              className={`space-y-2 min-h-[200px] rounded-lg transition-colors p-2 ${
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
                    draggable={canMoveTask(task, currentUser)}
                    onDragStart={(e) => {
                      if (canMoveTask(task, currentUser)) {
                        handleDragStart(e, task)
                      } else {
                        e.preventDefault()
                      }
                    }}
                    onDragEnd={handleDragEnd}
                    className={`border-border hover:shadow-sm transition-all text-xs group ${
                      draggedTask?.id === task.id ? 'opacity-50' : ''
                    } ${canMoveTask(task, currentUser) ? 'cursor-move' : 'cursor-default'}`}
                  >
                    <CardHeader className="pb-2 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-xs font-medium text-card-foreground leading-tight line-clamp-2">
                          {task.title}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant="outline"
                            className={`${priorityColors[task.priority]} text-[10px] px-1 py-0`}
                          >
                            {task.priority}
                          </Badge>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingTask(task)
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 p-3 space-y-2">
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-1 border-t border-border">
                        {task.assignees.length > 0 ? (
                          <div className="flex items-center gap-1">
                            {task.assignees.slice(0, 2).map((assignee) => (
                              <div key={assignee.id} className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-[10px] font-medium text-primary">
                                  {assignee.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                            ))}
                            {task.assignees.length > 2 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{task.assignees.length - 2}
                              </span>
                            )}
                          </div>
                        ) : null}
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] px-1 py-0 cursor-pointer bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20 ${
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
                <div className="flex items-center justify-center h-20 border-2 border-dashed border-border rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Vacío</p>
                </div>
              )}
              
              {isDraggedOver && draggedTask && draggedTask.status !== column.id && (
                <div className="flex items-center justify-center h-16 border-2 border-dashed border-primary rounded-lg bg-primary/10">
                  <p className="text-[10px] text-primary font-medium">Suelta aquí</p>
                </div>
              )}
            </div>
          </div>
        )
      })}

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
