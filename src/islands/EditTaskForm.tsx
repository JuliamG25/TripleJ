import { useState, useEffect } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { Label } from './Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'
import { useAppStore, type AppState } from '@/lib/store'
import type { TaskPriority, TaskStatus, Task, User } from '@/lib/types'
import { X, Pencil } from 'lucide-react'

interface EditTaskFormProps {
  task: Task
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditTaskForm({ task, onSuccess, onCancel }: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [assignees, setAssignees] = useState<string[]>(task.assignees?.map(a => a.id) || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const updateTask = useAppStore((state: AppState) => state.updateTask)
  const projects = useAppStore((state: AppState) => state.projects)
  const currentProject = projects.find(p => p.id === task.projectId)
  
  // Obtener todos los usuarios del proyecto (líder + miembros)
  const projectUsers = currentProject && currentProject.leader
    ? [
        currentProject.leader,
        ...(currentProject.members || []).filter(
          m => m && m.id && m.id !== currentProject.leader.id
        ),
      ]
    : []

  useEffect(() => {
    // Actualizar estado cuando cambia la tarea
    setTitle(task.title)
    setDescription(task.description)
    setStatus(task.status)
    setPriority(task.priority)
    setAssignees(task.assignees?.map(a => a.id) || [])
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await updateTask(task.id, {
        title,
        description,
        status,
        priority,
        assignees: assignees.length > 0 ? assignees.map(id => ({ id } as User)) : [],
      })
      
      setLoading(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error('❌ [EditTaskForm] Error al actualizar tarea:', err)
      setError(err.message || 'Error al actualizar tarea')
      setLoading(false)
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Editar Tarea</CardTitle>
            <CardDescription>Modifica la información de la tarea</CardDescription>
          </div>
          {onCancel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Diseñar interfaz de usuario"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descripción</Label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe la tarea..."
              className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Estado</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en-progreso">En Progreso</SelectItem>
                  <SelectItem value="hecha">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-priority">Prioridad</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
                <SelectTrigger id="edit-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {projectUsers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="edit-assignees">Asignar a (opcional, múltiple)</Label>
              <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
                {projectUsers.map((user) => (
                  user && user.id ? (
                    <label
                      key={user.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={assignees.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignees([...assignees, user.id])
                          } else {
                            setAssignees(assignees.filter(id => id !== user.id))
                          }
                        }}
                        className="h-4 w-4 rounded border-input"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{user.name}</div>
                        {user.email && (
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        )}
                      </div>
                    </label>
                  ) : null
                ))}
              </div>
              {assignees.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {assignees.map((assigneeId) => {
                    const user = projectUsers.find(u => u.id === assigneeId)
                    return user ? (
                      <div
                        key={assigneeId}
                        className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md text-sm"
                      >
                        <span>{user.name}</span>
                        <button
                          type="button"
                          onClick={() => setAssignees(assignees.filter(id => id !== assigneeId))}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : null
                  })}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
