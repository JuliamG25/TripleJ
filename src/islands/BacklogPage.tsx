import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'
import { EditTaskForm } from './EditTaskForm'
import { TaskCommentsModal } from './TaskCommentsModal'
import { useAppStore, type AppState } from '@/lib/store'
import { Clock, User, AlertCircle, Pencil } from 'lucide-react'
import type { Task } from '@/lib/types'
import { filterTasksByRole, canCreateOrEdit } from '@/lib/utils/permissions'

const priorityColors = {
  alta: 'bg-red-500/10 text-red-500 border-red-500/20',
  media: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  baja: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
}

const statusLabels = {
  pendiente: 'Pendiente',
  'en-progreso': 'En Progreso',
  hecha: 'Completada',
}

const statusColors = {
  pendiente: 'bg-gray-500/10 text-gray-500',
  'en-progreso': 'bg-primary/10 text-primary',
  hecha: 'bg-green-500/10 text-green-500',
}

export function BacklogPage() {
  const allTasks = useAppStore((state: AppState) => state.tasks)
  const currentUser = useAppStore((state: AppState) => state.currentUser)
  const loading = useAppStore((state: AppState) => state.loading)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [commentsTask, setCommentsTask] = useState<Task | null>(null)
  
  // Filtrar tareas según el rol del usuario
  const tasks = filterTasksByRole(allTasks, currentUser)
  const canEdit = canCreateOrEdit(currentUser)
  
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { alta: 3, media: 2, baja: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Cargando tareas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Backlog</h1>
        <p className="text-muted-foreground">Lista de tareas pendientes y en progreso</p>
      </div>

      <div className="grid gap-4">
        {sortedTasks.map((task) => (
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
            <Card key={task.id} className="border-border hover:border-primary/50 transition-colors group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-card-foreground mb-2">
                      {task.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {task.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Badge 
                      variant="outline"
                      className={priorityColors[task.priority]}
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={statusColors[task.status]}
                    >
                      {statusLabels[task.status]}
                    </Badge>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setEditingTask(task)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {task.assignees.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{task.assignees.map(a => a.name).join(', ')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground/50">
                        <User className="h-4 w-4" />
                        <span>Sin asignar</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Creada: {new Date(task.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs cursor-pointer bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20 ${
                      task.comments.length === 0 ? 'opacity-50' : ''
                    }`}
                    onClick={() => setCommentsTask(task)}
                  >
                    💬 {task.comments.length || '0'} comentario{task.comments.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        ))}
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
