import { useState, useEffect } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { Label } from './Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'
import { Calendar } from './Calendar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './Dialog'
import { Switch } from './Switch'
import { useAppStore, type AppState } from '@/lib/store'
import { meetingsApi } from '@/lib/api/meetings'
import type { MeetingType, User } from '@/lib/types'
import { Plus, CalendarIcon, Clock, Video, MapPin } from 'lucide-react'
import { format, isBefore, startOfDay, setHours, setMinutes, addHours } from 'date-fns'
import { es } from 'date-fns/locale'

interface CreateMeetingFormProps {
  projectId?: string
  onSuccess?: () => void
}

export function CreateMeetingForm({ projectId, onSuccess }: CreateMeetingFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<MeetingType>('virtual')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState<string>('')
  const [meetLink, setMeetLink] = useState('')
  const [location, setLocation] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]) // IDs de usuarios seleccionados
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false)
  
  const projects = useAppStore((state: AppState) => state.projects)
  const currentUser = useAppStore((state: AppState) => state.currentUser)

  // Cuando cambia el proyecto seleccionado, cargar sus miembros
  useEffect(() => {
    if (selectedProjectId && isOpen) {
      const project = projects.find(p => p.id === selectedProjectId)
      if (project) {
        const projectUsers = [
          project.leader,
          ...(project.members || []).filter(
            m => m && m.id && m.id !== project.leader.id
          ),
        ]
        const validUsers = projectUsers.filter(Boolean)
        setAvailableUsers(validUsers)
        // Seleccionar todos los usuarios por defecto
        setSelectedParticipants(validUsers.map(u => u.id))
      } else {
        setAvailableUsers([])
        setSelectedParticipants([])
      }
    } else if (!selectedProjectId && isOpen) {
      setAvailableUsers([])
      setSelectedParticipants([])
    }
  }, [selectedProjectId, isOpen, projects])

  // Resetear formulario cuando se cierra el diálogo
  useEffect(() => {
    if (!isOpen) {
      setTitle('')
      setDescription('')
      setType('virtual')
      setStartDate(undefined)
      setStartTime('')
      setMeetLink('')
      setLocation('')
      setSelectedParticipants([])
      setError(null)
      if (projectId) {
        setSelectedProjectId(projectId)
      } else {
        setSelectedProjectId('')
      }
    }
  }, [isOpen, projectId])

  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId))
    } else {
      setSelectedParticipants([...selectedParticipants, userId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validar campos requeridos
    if (!title || !description || !selectedProjectId) {
      setError('Todos los campos requeridos deben estar completos')
      setLoading(false)
      return
    }

    // Validar fecha
    if (!startDate) {
      setError('Debes seleccionar fecha y hora de inicio')
      setLoading(false)
      return
    }

    // Combinar fecha y hora
    let finalStartDate = new Date(startDate)
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number)
      finalStartDate = setHours(setMinutes(finalStartDate, minutes), hours)
    } else {
      finalStartDate = setHours(setMinutes(finalStartDate, 0), 9) // Default 9:00 AM
    }

    // Calcular fecha de fin (1 hora después del inicio por defecto)
    const finalEndDate = addHours(finalStartDate, 1)

    // Validar que no sea en el pasado
    if (isBefore(finalStartDate, new Date())) {
      setError('La fecha y hora de inicio no puede ser en el pasado')
      setLoading(false)
      return
    }

    // Validar que si es virtual, tenga meetLink
    if (type === 'virtual' && !meetLink) {
      setError('Las reuniones virtuales requieren un enlace de Google Meet')
      setLoading(false)
      return
    }

    // Validar que si es presencial, tenga ubicación
    if (type === 'presencial' && !location) {
      setError('Las reuniones presenciales requieren una ubicación')
      setLoading(false)
      return
    }

    try {
      await meetingsApi.create({
        title,
        description,
        startDate: finalStartDate,
        endDate: finalEndDate,
        type,
        meetLink: type === 'virtual' ? meetLink : undefined,
        projectId: selectedProjectId,
        participants: selectedParticipants.length > 0 ? selectedParticipants : undefined,
        location: type === 'presencial' ? location : undefined,
      })

      // Reset form
      setTitle('')
      setDescription('')
      setType('virtual')
      setStartDate(undefined)
      setStartTime('')
      setMeetLink('')
      setLocation('')
      setSelectedParticipants([])
      setIsOpen(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear reunión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          Nueva Reunión
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Reunión</DialogTitle>
          <DialogDescription>
            Agenda una reunión o daily para tu proyecto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-title">Título de la Reunión</Label>
              <Input
                id="meeting-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Daily Standup"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-project">Proyecto</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId} required>
                <SelectTrigger id="meeting-project">
                  <SelectValue placeholder="Seleccionar proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting-description">Descripción</Label>
            <textarea
              id="meeting-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el propósito de la reunión..."
              className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting-type">Tipo de Reunión</Label>
            <Select value={type} onValueChange={(value) => setType(value as MeetingType)}>
              <SelectTrigger id="meeting-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virtual">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Virtual
                  </div>
                </SelectItem>
                <SelectItem value="presencial">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Presencial
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-date">Fecha y Hora de Inicio</Label>
            <div className="flex gap-2">
              <Popover open={startDatePopoverOpen} onOpenChange={setStartDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      selected={startDate}
                      onSelect={(date) => {
                        if (date) {
                          setStartDate(date)
                          setStartDatePopoverOpen(false)
                        }
                      }}
                      disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                      locale={es}
                    />
                  </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-32"
              />
            </div>
          </div>

          {type === 'virtual' && (
            <div className="space-y-2">
              <Label htmlFor="meet-link">Enlace de Google Meet</Label>
              <Input
                id="meet-link"
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                required={type === 'virtual'}
              />
            </div>
          )}

          {type === 'presencial' && (
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Sala de juntas, Piso 3"
                required={type === 'presencial'}
              />
            </div>
          )}

          {selectedProjectId && availableUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Participantes del Proyecto</Label>
              <div className="border rounded-md p-4 space-y-3 max-h-[200px] overflow-y-auto">
                {availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Switch
                      checked={selectedParticipants.includes(user.id)}
                      onCheckedChange={() => toggleParticipant(user.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Reunión
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
