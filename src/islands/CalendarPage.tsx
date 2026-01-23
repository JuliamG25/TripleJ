import { useState, useEffect, useMemo } from 'react'
import { Calendar } from './Calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Badge } from './Badge'
import { useAppStore } from '@/lib/store'
import { meetingsApi } from '@/lib/api/meetings'
import type { Task, Meeting, User } from '@/lib/types'
import { format, isSameDay, startOfDay, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, Clock, User as UserIcon, Video, MapPin } from 'lucide-react'
import { isTaskOverdue } from '@/lib/utils/task-helpers'

export function CalendarPage() {
  const tasks = useAppStore((state) => state.tasks)
  const projects = useAppStore((state) => state.projects)
  const currentUser = useAppStore((state) => state.currentUser)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [month, setMonth] = useState<Date>(new Date())
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loadingMeetings, setLoadingMeetings] = useState(false)

  // Cargar reuniones del mes actual (solo las que involucran al usuario actual)
  useEffect(() => {
    const loadMeetings = async () => {
      if (!currentUser) return
      
      try {
        setLoadingMeetings(true)
        const startOfMonthDate = new Date(month.getFullYear(), month.getMonth(), 1)
        const endOfMonthDate = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)
        const meetingsData = await meetingsApi.getAll(
          undefined,
          startOfMonthDate.toISOString(),
          endOfMonthDate.toISOString()
        )
        
        // Filtrar solo las reuniones donde el usuario es participante o creador
        const userMeetings = meetingsData.filter(meeting => {
          const isParticipant = meeting.participants.some(p => p.id === currentUser.id)
          const isCreator = meeting.createdBy.id === currentUser.id
          return isParticipant || isCreator
        })
        
        setMeetings(userMeetings)
      } catch (err: any) {
        console.error('Error al cargar reuniones:', err)
      } finally {
        setLoadingMeetings(false)
      }
    }
    loadMeetings()
  }, [month, currentUser])

  // Obtener tareas con fecha de entrega
  const tasksWithDueDate = useMemo(() => {
    return tasks.filter(task => task.dueDate)
  }, [tasks])

  // Obtener tareas para la fecha seleccionada
  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    return tasksWithDueDate.filter(task => {
      if (!task.dueDate) return false
      return isSameDay(new Date(task.dueDate), selectedDate)
    })
  }, [selectedDate, tasksWithDueDate])

  // Obtener tareas para el mes actual
  const tasksForMonth = useMemo(() => {
    return tasksWithDueDate.map(task => {
      if (!task.dueDate) return null
      return {
        date: startOfDay(new Date(task.dueDate)),
        task
      }
    }).filter(Boolean) as Array<{ date: Date; task: Task }>
  }, [tasksWithDueDate])

  // Función para obtener el color según la prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-500'
      case 'media':
        return 'bg-yellow-500'
      case 'baja':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Función para obtener el color según el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hecha':
        return 'bg-green-500'
      case 'en-progreso':
        return 'bg-blue-500'
      case 'pendiente':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Obtener el nombre del proyecto
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'Proyecto desconocido'
  }

  // Verificar si una fecha tiene tareas y su estado
  const getTasksForDate = (date: Date) => {
    return tasksForMonth.filter(({ date: taskDate }) => 
      isSameDay(taskDate, date)
    ).map(({ task }) => task)
  }

  // Verificar si una fecha tiene tareas pendientes (para desarrolladores)
  const hasPendingTasksOnDate = (date: Date) => {
    const dateTasks = getTasksForDate(date)
    if (currentUser?.role === 'desarrollador') {
      // Para desarrolladores, solo contar sus tareas asignadas
      const userTasks = dateTasks.filter(task => 
        task.assignees.some(a => a.id === currentUser.id)
      )
      return userTasks.some(task => task.status === 'pendiente')
    }
    // Para otros roles, contar todas las tareas pendientes
    return dateTasks.some(task => task.status === 'pendiente')
  }

  // Verificar si todas las tareas de una fecha están completadas (para desarrolladores)
  const allTasksCompletedOnDate = (date: Date) => {
    const dateTasks = getTasksForDate(date)
    if (dateTasks.length === 0) return false
    
    if (currentUser?.role === 'desarrollador') {
      // Para desarrolladores, solo contar sus tareas asignadas
      const userTasks = dateTasks.filter(task => 
        task.assignees.some(a => a.id === currentUser.id)
      )
      if (userTasks.length === 0) return false
      return userTasks.every(task => task.status === 'hecha')
    }
    // Para otros roles, verificar todas las tareas
    return dateTasks.every(task => task.status === 'hecha')
  }

  // Verificar si una fecha tiene tareas
  const hasTasksOnDate = (date: Date) => {
    return tasksForMonth.some(({ date: taskDate }) => 
      isSameDay(taskDate, date)
    )
  }

  // Verificar si una fecha tiene tareas vencidas
  const hasOverdueTasksOnDate = (date: Date) => {
    const dateTasks = getTasksForDate(date)
    return dateTasks.some(task => isTaskOverdue(task))
  }

  // Verificar si una fecha tiene reuniones
  const hasMeetingsOnDate = (date: Date) => {
    return meetings.some(meeting => {
      const start = startOfDay(new Date(meeting.startDate))
      const end = startOfDay(new Date(meeting.endDate))
      const checkDate = startOfDay(date)
      return isSameDay(start, checkDate) || isSameDay(end, checkDate) || 
             (checkDate >= start && checkDate <= end)
    })
  }

  // Obtener reuniones para la fecha seleccionada
  const meetingsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    return meetings.filter(meeting => {
      const start = startOfDay(new Date(meeting.startDate))
      const end = startOfDay(new Date(meeting.endDate))
      const selected = startOfDay(selectedDate)
      return isSameDay(start, selected) || isSameDay(end, selected) || 
             (selected >= start && selected <= end)
    })
  }, [selectedDate, meetings])

  // Modificar el componente Calendar para mostrar indicadores y colores
  const modifiers = {
    hasTasks: (date: Date) => hasTasksOnDate(date),
    hasPending: (date: Date) => hasPendingTasksOnDate(date),
    allCompleted: (date: Date) => allTasksCompletedOnDate(date),
    hasOverdue: (date: Date) => hasOverdueTasksOnDate(date),
    hasMeetings: (date: Date) => hasMeetingsOnDate(date),
  }

  // Colores más sutiles para líderes y administradores
  const isDeveloper = currentUser?.role === 'desarrollador'
  
  // Prioridad: hasOverdue > hasPending > allCompleted > hasMeetings
  const modifiersClassNames = {
    hasTasks: 'relative',
    hasOverdue: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/30 hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/50 dark:hover:to-red-800/40 text-red-900 dark:text-red-100 border-2 border-red-300 dark:border-red-700 font-semibold shadow-md flex items-center justify-center',
    hasPending: isDeveloper
      ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/40 dark:to-yellow-800/30 hover:from-yellow-100 hover:to-yellow-200 dark:hover:from-yellow-900/50 dark:hover:to-yellow-800/40 text-yellow-900 dark:text-yellow-100 border border-yellow-200 dark:border-yellow-800/50 font-medium shadow-sm flex items-center justify-center'
      : 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-yellow-400 dark:after:bg-yellow-500',
    allCompleted: isDeveloper
      ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/30 hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/50 dark:hover:to-green-800/40 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800/50 font-medium shadow-sm flex items-center justify-center'
      : 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-green-400 dark:after:bg-green-500',
    hasMeetings: 'relative before:absolute before:top-1 before:right-1 before:w-2 before:h-2 before:rounded-full before:bg-blue-500 dark:before:bg-blue-400',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
        <p className="text-muted-foreground">
          Visualiza las fechas de entrega de tus tareas
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Calendario */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Calendario</CardTitle>
              <CardDescription className="text-base">
                Selecciona una fecha para ver las tareas programadas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gradient-to-br from-background to-muted/20 rounded-xl p-4 border border-border/50 shadow-inner">
                <Calendar
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={month}
                  onMonthChange={setMonth}
                  modifiers={modifiers}
                  modifiersClassNames={modifiersClassNames}
                  locale={es}
                  className="rounded-lg"
                  disabled={() => false}
                />
              </div>
              {/* Leyenda */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-800/50"></div>
                  <span className="text-xs text-muted-foreground">Tareas pendientes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800/50"></div>
                  <span className="text-xs text-muted-foreground">Todas completadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-muted-foreground">Reuniones</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de tareas para la fecha seleccionada */}
        <div>
          <Card className="shadow-lg border-2 h-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  {selectedDate ? format(selectedDate, "EEEE", { locale: es }) : 'Selecciona'}
                  <div className="text-sm font-normal text-muted-foreground">
                    {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : 'una fecha'}
                  </div>
                </div>
              </CardTitle>
              <CardDescription className="text-base">
                {tasksForSelectedDate.length === 0 && meetingsForSelectedDate.length === 0
                  ? 'No hay actividades programadas'
                  : `${tasksForSelectedDate.length} tarea${tasksForSelectedDate.length !== 1 ? 's' : ''}${tasksForSelectedDate.length > 0 && meetingsForSelectedDate.length > 0 ? ' y ' : ''}${meetingsForSelectedDate.length} reunión${meetingsForSelectedDate.length !== 1 ? 'es' : ''}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasksForSelectedDate.length === 0 && meetingsForSelectedDate.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="p-4 bg-muted/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Clock className="h-10 w-10 opacity-50" />
                  </div>
                  <p className="font-medium">No hay actividades</p>
                  <p className="text-sm mt-1">para esta fecha</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {/* Reuniones */}
                  {meetingsForSelectedDate.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="group p-4 border-2 rounded-xl hover:border-blue-500/50 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-blue-50/50 to-background dark:from-blue-900/10"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {meeting.type === 'virtual' ? (
                              <Video className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            )}
                            <h4 className="font-semibold text-sm truncate">{meeting.title}</h4>
                          </div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <p className="text-xs text-muted-foreground truncate">
                              {getProjectName(meeting.projectId)}
                            </p>
                            <span className="text-xs font-medium text-muted-foreground">
                              • {format(new Date(meeting.startDate), "HH:mm")} - {format(new Date(meeting.endDate), "HH:mm")}
                            </span>
                          </div>
                          {meeting.participants.length > 0 && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground font-medium">
                                {meeting.participants.map((p) => p.name.split(' ')[0]).join(', ')}
                              </span>
                            </div>
                          )}
                          {meeting.type === 'virtual' && meeting.meetLink && (
                            <a
                              href={meeting.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <Video className="h-3 w-3" />
                              Unirse a la reunión
                            </a>
                          )}
                          {meeting.type === 'presencial' && meeting.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {meeting.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {tasksForSelectedDate.map((task) => (
                    <div
                      key={task.id}
                      className="group p-4 border-2 rounded-xl hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-background to-muted/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate mb-1">{task.title}</h4>
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                            <p className="text-xs text-muted-foreground truncate">
                              {getProjectName(task.projectId)}
                            </p>
                            {task.dueDate && (
                              <span className="text-xs font-medium text-muted-foreground">
                                • {format(new Date(task.dueDate), "HH:mm")}
                              </span>
                            )}
                          </div>
                          {task.assignees.length > 0 && (
                            <div className="flex items-center gap-1.5 mb-3">
                              <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground font-medium">
                                {task.assignees.map(a => a.name.split(' ')[0]).join(', ')}
                              </span>
                            </div>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium ${
                                task.priority === 'alta' 
                                  ? 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20' 
                                  : task.priority === 'media'
                                  ? 'border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20'
                                  : 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20'
                              }`}
                            >
                              {task.priority === 'alta' ? 'Alta' : task.priority === 'media' ? 'Media' : 'Baja'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium ${
                                task.status === 'pendiente'
                                  ? 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20'
                                  : task.status === 'en-progreso'
                                  ? 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20'
                              }`}
                            >
                              {task.status === 'pendiente' ? 'Pendiente' : task.status === 'en-progreso' ? 'En Progreso' : 'Completada'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resumen de tareas próximas */}
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            Próximas tareas
          </CardTitle>
          <CardDescription className="text-base">
            Tareas con fecha de entrega en los próximos 7 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasksWithDueDate.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="p-4 bg-muted/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-10 w-10 opacity-50" />
              </div>
              <p className="font-medium">No hay tareas</p>
              <p className="text-sm mt-1">con fecha asignada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasksWithDueDate
                .filter(task => {
                  if (!task.dueDate) return false
                  const dueDate = new Date(task.dueDate)
                  const today = startOfDay(new Date())
                  const nextWeek = new Date(today)
                  nextWeek.setDate(nextWeek.getDate() + 7)
                  return dueDate >= today && dueDate <= nextWeek
                })
                .sort((a, b) => {
                  if (!a.dueDate || !b.dueDate) return 0
                  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                })
                .slice(0, 10)
                .map((task) => {
                  const isToday = task.dueDate && isSameDay(new Date(task.dueDate), new Date())
                  return (
                    <div
                      key={task.id}
                      className={`group flex items-center justify-between p-4 border-2 rounded-xl hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-background to-muted/20 ${
                        isToday ? 'border-primary/30 bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">{task.title}</h4>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} shadow-sm`} />
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {getProjectName(task.projectId)}
                        </p>
                        {task.assignees.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-medium">
                              {task.assignees.map(a => a.name.split(' ')[0]).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-4">
                        <div className={`text-sm font-bold px-3 py-1 rounded-lg ${
                          isToday 
                            ? 'bg-primary text-primary-foreground shadow-md' 
                            : 'bg-muted text-foreground'
                        }`}>
                          {task.dueDate ? format(new Date(task.dueDate), "d MMM", { locale: es }) : '-'}
                        </div>
                        {task.dueDate && (
                          <div className="text-xs font-medium text-muted-foreground">
                            {format(new Date(task.dueDate), "HH:mm")}
                          </div>
                        )}
                        {isToday && (
                          <div className="text-xs font-medium text-primary">Hoy</div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
