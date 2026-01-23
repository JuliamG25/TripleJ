import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './Dialog'
import { CreateMeetingForm } from './CreateMeetingForm'
import { useAppStore, type AppState } from '@/lib/store'
import { meetingsApi } from '@/lib/api/meetings'
import { CalendarIcon, Clock, Video, MapPin, Users, Loader2, Pencil, Trash2, ExternalLink } from 'lucide-react'
import type { Meeting } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function ReunionesPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  const currentUser = useAppStore((state: AppState) => state.currentUser)
  const projects = useAppStore((state: AppState) => state.projects)

  useEffect(() => {
    loadMeetings()
  }, [])

  const loadMeetings = async () => {
    try {
      setLoading(true)
      setError(null)
      const allMeetings = await meetingsApi.getAll()
      setMeetings(allMeetings)
    } catch (err: any) {
      setError(err.message || 'Error al cargar reuniones')
      console.error('Error al cargar reuniones:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedMeeting) return

    try {
      setLoading(true)
      await meetingsApi.delete(selectedMeeting.id)
      setDeleteDialogOpen(false)
      setSelectedMeeting(null)
      await loadMeetings()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar reunión')
      console.error('Error al eliminar reunión:', err)
    } finally {
      setLoading(false)
    }
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'Proyecto desconocido'
  }

  const canEditMeeting = (meeting: Meeting) => {
    if (!currentUser) return false
    return currentUser.role === 'administrador' || meeting.createdBy.id === currentUser.id
  }

  const canDeleteMeeting = (meeting: Meeting) => {
    return canEditMeeting(meeting)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Reuniones
          </h1>
          <p className="text-muted-foreground">
            Gestiona todas tus reuniones y dailys
          </p>
        </div>
        <CreateMeetingForm onSuccess={loadMeetings} />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {meetings.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay reuniones programadas
            </h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primera reunión para comenzar
            </p>
            <CreateMeetingForm onSuccess={loadMeetings} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((meeting) => {
            const isUpcoming = new Date(meeting.startDate) > new Date()
            const isPast = new Date(meeting.endDate) < new Date()
            const isOngoing = new Date(meeting.startDate) <= new Date() && new Date(meeting.endDate) >= new Date()

            return (
              <Card
                key={meeting.id}
                className={`border-border hover:shadow-lg transition-shadow ${
                  isPast ? 'opacity-75' : ''
                } ${isOngoing ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 flex items-center gap-2">
                        {meeting.type === 'virtual' ? (
                          <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                        {meeting.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {meeting.description}
                      </CardDescription>
                    </div>
                    {isOngoing && (
                      <Badge variant="default" className="bg-blue-500">
                        En curso
                      </Badge>
                    )}
                    {isPast && (
                      <Badge variant="outline" className="opacity-60">
                        Finalizada
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(meeting.startDate), "PPP 'a las' HH:mm", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{getProjectName(meeting.projectId)}</span>
                    </div>
                    {meeting.type === 'presencial' && meeting.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{meeting.location}</span>
                      </div>
                    )}
                    {meeting.type === 'virtual' && meeting.meetLink && (
                      <a
                        href={meeting.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Unirse a la reunión</span>
                      </a>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>
                        {meeting.participants.length} participante{meeting.participants.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex flex-wrap gap-1">
                      {meeting.participants.slice(0, 3).map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-1"
                        >
                          {participant.avatar ? (
                            <img
                              src={participant.avatar}
                              alt={participant.name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {participant.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {meeting.participants.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{meeting.participants.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {canDeleteMeeting(meeting) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedMeeting(meeting)
                            setDeleteDialogOpen(true)
                          }}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la reunión "{selectedMeeting?.title}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedMeeting(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
