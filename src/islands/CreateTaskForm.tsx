import { useState, useEffect } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { Label } from './Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'
import { Calendar } from './Calendar'
import { useAppStore, type AppState } from '@/lib/store'
import { usersApi } from '@/lib/api/users'
import type { TaskPriority, TaskStatus, User } from '@/lib/types'
import { Plus, X, CalendarIcon, Clock } from 'lucide-react'
import { format, isBefore, startOfDay, setHours, setMinutes, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface CreateTaskFormProps {
  projectId: string
  onSuccess?: () => void
}

export function CreateTaskForm({ projectId, onSuccess }: CreateTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('pendiente')
  const [priority, setPriority] = useState<TaskPriority>('media')
  const [assignees, setAssignees] = useState<string[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [dueTime, setDueTime] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const addTask = useAppStore((state: AppState) => state.addTask)
  const projects = useAppStore((state: AppState) => state.projects)
  const currentProject = projects.find(p => p.id === projectId)

  // Cargar usuarios disponibles cuando se abre el formulario
  // Solo mostrar líder y miembros del proyecto
  useEffect(() => {
    if (isOpen && currentProject) {
      setLoadingUsers(true)
      try {
        // Filtrar usuarios: solo líder y miembros del proyecto
        const projectUsers = [
          currentProject.leader,
          ...(currentProject.members || []).filter(
            m => m && m.id && m.id !== currentProject.leader.id
          ),
        ]
        setAvailableUsers(projectUsers.filter(Boolean))
        console.log('👥 [CreateTaskForm] Usuarios del proyecto cargados:', projectUsers.length)
      } catch (err) {
        console.error('Error al cargar usuarios del proyecto:', err)
        setAvailableUsers([])
      } finally {
        setLoadingUsers(false)
      }
    } else if (isOpen && !currentProject) {
      // Si no hay proyecto cargado, intentar cargarlo
      setAvailableUsers([])
    }
  }, [isOpen, currentProject])

  // Debug
  useEffect(() => {
    if (isOpen) {
      console.log('📝 [CreateTaskForm] Abierto:', {
        projectId,
        hasProject: !!currentProject,
        availableUsersCount: availableUsers.length
      })
    }
  }, [isOpen, projectId, currentProject, availableUsers.length])

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
        // Si no hay hora, establecer a las 23:59 del día seleccionado
        finalDueDate = setHours(setMinutes(finalDueDate, 59), 23)
      }
      
      // Validar que no sea en el pasado
      if (isBefore(finalDueDate, new Date())) {
        setError('La fecha y hora de entrega no puede ser en el pasado')
        setLoading(false)
        return
      }
    }

    try {
      await addTask({
        title,
        description,
        status,
        priority,
        assignees: assignees.length > 0 ? assignees.map(id => ({ id } as User)) : [],
        projectId,
        dueDate: finalDueDate,
      })
      
      // Reset form
      setTitle('')
      setDescription('')
      setStatus('pendiente')
      setPriority('media')
      setAssignees([])
      setDueDate(undefined)
      setDueTime('')
      setIsOpen(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error('❌ [CreateTaskForm] Error al crear tarea:', err)
      setError(err.message || 'Error al crear tarea')
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="h-4 w-4" />
        Nueva Tarea
      </Button>
    )
  }

  // Si el proyecto no está cargado, mostrar mensaje
  if (!currentProject) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Cargando información del proyecto...</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="mt-2"
          >
            Cancelar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Crear Nueva Tarea</CardTitle>
            <CardDescription>Agrega una nueva tarea al proyecto</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Diseñar interfaz de usuario"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe la tarea..."
              className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                <SelectTrigger id="status">
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
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
                <SelectTrigger id="priority">
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
            <Label htmlFor="dueDate">Fecha y hora de entrega (opcional)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dueDate"
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
                        // Si la fecha seleccionada es hoy, asegurar que no sea antes de ahora
                        const today = startOfDay(new Date())
                        const selectedDay = startOfDay(date)
                        if (isBefore(selectedDay, today)) {
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
                      disabled: (date) => isBefore(startOfDay(date), startOfDay(new Date()))
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
                  id="dueTime"
                  value={dueTime}
                  onChange={(e) => {
                    const time = e.target.value
                    setDueTime(time)
                    
                    // Validar que si la fecha es hoy, la hora no sea en el pasado
                    if (dueDate && time) {
                      const today = startOfDay(new Date())
                      const selectedDay = startOfDay(dueDate)
                      if (isSameDay(selectedDay, today)) {
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
                  min={dueDate && isSameDay(dueDate, new Date()) ? format(new Date(), "HH:mm") : undefined}
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

          <div className="space-y-2">
            <Label htmlFor="assignees">Asignar a (opcional, múltiple)</Label>
            {loadingUsers ? (
              <div className="text-sm text-muted-foreground">Cargando usuarios...</div>
            ) : (
              <>
                <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
                  {availableUsers.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      No hay usuarios disponibles
                    </div>
                  ) : (
                    availableUsers.map((user) => (
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
                    ))
                  )}
                </div>
                {assignees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {assignees.map((assigneeId) => {
                      const user = availableUsers.find(u => u.id === assigneeId)
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
              </>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Tarea'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
