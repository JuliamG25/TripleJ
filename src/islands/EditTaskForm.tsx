import { useState, useEffect } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { Label } from './Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'
import { Calendar } from './Calendar'
import { useAppStore, type AppState } from '@/lib/store'
import type { TaskPriority, TaskStatus, Task, User } from '@/lib/types'
import { isTaskOverdue } from '@/lib/utils/task-helpers'
import { X, Pencil, CalendarIcon, Clock } from 'lucide-react'
import { format, isBefore, startOfDay, setHours, setMinutes, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

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
  const [dueDate, setDueDate] = useState<Date | undefined>(task.dueDate ? new Date(task.dueDate) : undefined)
  const [dueTime, setDueTime] = useState<string>(
    task.dueDate ? format(new Date(task.dueDate), "HH:mm") : ''
  )
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
    const taskDueDate = task.dueDate ? new Date(task.dueDate) : undefined
    setDueDate(taskDueDate)
    setDueTime(taskDueDate ? format(taskDueDate, "HH:mm") : '')
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validar fecha y hora
    let finalDueDate: Date | undefined = undefined
    if (dueDate) {
      finalDueDate = new Date(dueDate)
      
      // Si hay hora seleccionada, combinarla con la fecha
      if (dueTime) {
        const [hours, minutes] = dueTime.split(':').map(Number)
        finalDueDate = setHours(setMinutes(finalDueDate, minutes), hours)
      } else {
        // Si no hay hora pero hay fecha, mantener la hora original o establecer a las 23:59
        if (task.dueDate) {
          const originalDate = new Date(task.dueDate)
          finalDueDate = setHours(setMinutes(finalDueDate, originalDate.getMinutes()), originalDate.getHours())
        } else {
          finalDueDate = setHours(setMinutes(finalDueDate, 59), 23)
        }
      }
      
      // Validar que no sea en el pasado (solo si se está cambiando)
      // Los líderes pueden extender el tiempo de tareas vencidas
      const currentUser = useAppStore.getState().currentUser
      const isLeaderOrAdmin = currentUser?.role === 'lider' || currentUser?.role === 'administrador'
      const isExtendingOverdueTask = isTaskOverdue(task)
      
      if (isBefore(finalDueDate, new Date()) && !(isLeaderOrAdmin && isExtendingOverdueTask)) {
        setError('La fecha y hora de entrega no puede ser en el pasado')
        setLoading(false)
        return
      }
    }

    try {
      await updateTask(task.id, {
        title,
        description,
        status,
        priority,
        assignees: assignees.length > 0 ? assignees.map(id => ({ id } as User)) : [],
        dueDate: finalDueDate,
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

          <div className="space-y-2">
            <Label htmlFor="edit-dueDate">Fecha y hora de entrega (opcional)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="edit-dueDate"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP", { locale: es }) : "Fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    selected={dueDate}
                    onSelect={(date) => {
                      if (date) {
                        const currentUser = useAppStore.getState().currentUser
                        const isLeaderOrAdmin = currentUser?.role === 'lider' || currentUser?.role === 'administrador'
                        const isExtendingOverdueTask = isTaskOverdue(task)
                        
                        const today = startOfDay(new Date())
                        const selectedDay = startOfDay(date)
                        
                        // Permitir fechas pasadas solo si es líder/admin extendiendo una tarea vencida
                        if (isBefore(selectedDay, today) && !(isLeaderOrAdmin && isExtendingOverdueTask)) {
                          setError('No puedes seleccionar una fecha en el pasado')
                          return
                        }
                        setDueDate(date)
                        setError(null)
                      }
                    }}
                    month={dueDate || new Date()}
                    onMonthChange={(date) => {}}
                    modifiers={{
                      disabled: (date) => {
                        const currentUser = useAppStore.getState().currentUser
                        const isLeaderOrAdmin = currentUser?.role === 'lider' || currentUser?.role === 'administrador'
                        const isExtendingOverdueTask = isTaskOverdue(task)
                        
                        // Si es líder/admin extendiendo tarea vencida, permitir todas las fechas
                        if (isLeaderOrAdmin && isExtendingOverdueTask) {
                          return false
                        }
                        return isBefore(startOfDay(date), startOfDay(new Date()))
                      }
                    }}
                    locale={es}
                    className="rounded-lg"
                  />
                  {dueDate && (
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setDueDate(undefined)
                          setDueTime('')
                        }}
                      >
                        Limpiar fecha
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              
              <div className="relative">
                <Input
                  type="time"
                  id="edit-dueTime"
                  value={dueTime}
                  onChange={(e) => {
                    const time = e.target.value
                    setDueTime(time)
                    
                    if (dueDate && time) {
                      const currentUser = useAppStore.getState().currentUser
                      const isLeaderOrAdmin = currentUser?.role === 'lider' || currentUser?.role === 'administrador'
                      const isExtendingOverdueTask = isTaskOverdue(task)
                      
                      const today = startOfDay(new Date())
                      const selectedDay = startOfDay(dueDate)
                      if (isSameDay(selectedDay, today) && !(isLeaderOrAdmin && isExtendingOverdueTask)) {
                        const [hours, minutes] = time.split(':').map(Number)
                        const selectedDateTime = setHours(setMinutes(new Date(), minutes), hours)
                        if (isBefore(selectedDateTime, new Date())) {
                          setError('La hora seleccionada no puede ser en el pasado')
                          return
                        }
                      }
                      setError(null)
                    }
                  }}
                  className="w-full"
                  disabled={!dueDate}
                  min={(() => {
                    const currentUser = useAppStore.getState().currentUser
                    const isLeaderOrAdmin = currentUser?.role === 'lider' || currentUser?.role === 'administrador'
                    const isExtendingOverdueTask = isTaskOverdue(task)
                    
                    // Si es líder/admin extendiendo tarea vencida, no restringir hora
                    if (isLeaderOrAdmin && isExtendingOverdueTask) {
                      return undefined
                    }
                    return dueDate && isSameDay(dueDate, new Date()) ? format(new Date(), "HH:mm") : undefined
                  })()}
                />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            {dueDate && dueTime && (
              <p className="text-xs text-muted-foreground">
                Entrega: {format(dueDate, "PPP", { locale: es })} a las {dueTime}
              </p>
            )}
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
