import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'
import { Label } from './Label'
import { Input } from './Input'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'
import { Calendar } from './Calendar'
import { useAppStore, type AppState } from '@/lib/store'
import { FileDown, Filter, BarChart3, User, FolderKanban, CheckCircle2, Clock, AlertTriangle, CalendarIcon } from 'lucide-react'
import type { Task, Project, User as UserType } from '@/lib/types'
import { filterTasksByRole, canViewAllTasks, canCreateOrEdit } from '@/lib/utils/permissions'
import { isTaskOverdue } from '@/lib/utils/task-helpers'
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, isWithinInterval, isSameMonth, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

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

type FilterStatus = 'en-progreso' | 'hecha' | 'vencida' | 'todos'
type DateFilterType = 'ninguno' | 'mes' | 'semana' | 'rango'

export function BacklogPage() {
  const allTasks = useAppStore((state: AppState) => state.tasks)
  const projects = useAppStore((state: AppState) => state.projects)
  const currentUser = useAppStore((state: AppState) => state.currentUser)
  const loading = useAppStore((state: AppState) => state.loading)
  
  // Filtros
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('todos')
  const [selectedProject, setSelectedProject] = useState<string>('todos')
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('todos')
  
  // Filtros de fecha
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('ninguno')
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(undefined)
  const [selectedWeek, setSelectedWeek] = useState<Date | undefined>(undefined)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  
  // Estados para controlar los popovers
  const [monthPopoverOpen, setMonthPopoverOpen] = useState(false)
  const [weekPopoverOpen, setWeekPopoverOpen] = useState(false)
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false)
  const [endDatePopoverOpen, setEndDatePopoverOpen] = useState(false)
  
  // Filtrar tareas según el rol del usuario
  const visibleTasks = useMemo(() => {
    return filterTasksByRole(allTasks, currentUser)
  }, [allTasks, currentUser])
  
  // Obtener lista única de desarrolladores
  const developers = useMemo(() => {
    const devSet = new Set<string>()
    visibleTasks.forEach(task => {
      task.assignees.forEach(assignee => {
        if (assignee.role === 'desarrollador') {
          devSet.add(assignee.id)
        }
      })
    })
    
    const devs: UserType[] = []
    visibleTasks.forEach(task => {
      task.assignees.forEach(assignee => {
        if (assignee.role === 'desarrollador' && devSet.has(assignee.id)) {
          if (!devs.find(d => d.id === assignee.id)) {
            devs.push(assignee)
          }
          devSet.delete(assignee.id)
        }
      })
    })
    
    return devs.sort((a, b) => a.name.localeCompare(b.name))
  }, [visibleTasks])
  
  // Filtrar tareas según los filtros seleccionados
  const filteredTasks = useMemo(() => {
    let filtered = [...visibleTasks]
    
    // Filtro por desarrollador
    if (selectedDeveloper !== 'todos') {
      filtered = filtered.filter(task =>
        task.assignees.some(a => a.id === selectedDeveloper)
      )
    }
    
    // Filtro por proyecto
    if (selectedProject !== 'todos') {
      filtered = filtered.filter(task => task.projectId === selectedProject)
    }
    
    // Filtro por estado
    if (selectedStatus !== 'todos') {
      if (selectedStatus === 'vencida') {
        filtered = filtered.filter(task => isTaskOverdue(task))
      } else {
        filtered = filtered.filter(task => task.status === selectedStatus)
      }
    }
    
    // Filtro por fecha
    if (dateFilterType === 'mes' && selectedMonth) {
      const monthStart = startOfMonth(selectedMonth)
      const monthEnd = endOfMonth(selectedMonth)
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        return isWithinInterval(taskDate, {
          start: startOfDay(monthStart),
          end: endOfDay(monthEnd)
        })
      })
    } else if (dateFilterType === 'semana' && selectedWeek) {
      const weekStart = startOfWeek(selectedWeek, { locale: es })
      const weekEnd = endOfWeek(selectedWeek, { locale: es })
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        return isWithinInterval(taskDate, {
          start: startOfDay(weekStart),
          end: endOfDay(weekEnd)
        })
      })
    } else if (dateFilterType === 'rango' && startDate && endDate) {
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        return isWithinInterval(taskDate, {
          start: startOfDay(startDate),
          end: endOfDay(endDate)
        })
      })
    }
    
    return filtered.sort((a, b) => {
      const priorityOrder = { alta: 3, media: 2, baja: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [visibleTasks, selectedDeveloper, selectedProject, selectedStatus, dateFilterType, selectedMonth, selectedWeek, startDate, endDate])
  
  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = filteredTasks.length
    const enProgreso = filteredTasks.filter(t => t.status === 'en-progreso').length
    const completadas = filteredTasks.filter(t => t.status === 'hecha').length
    const vencidas = filteredTasks.filter(t => isTaskOverdue(t)).length
    const pendientes = filteredTasks.filter(t => t.status === 'pendiente').length
    
    return {
      total,
      enProgreso,
      completadas,
      vencidas,
      pendientes,
    }
  }, [filteredTasks])
  
  // Función para exportar a PDF
  const exportToPDF = async () => {
    try {
      // Importación dinámica de jsPDF
      const { jsPDF } = await import('jspdf')
      
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let yPos = margin
      
      // Título
      doc.setFontSize(18)
      doc.text('Reporte de Estadísticas de Tareas', margin, yPos)
      yPos += 10
      
      // Filtros aplicados
      doc.setFontSize(12)
      doc.text('Filtros aplicados:', margin, yPos)
      yPos += 7
      
      doc.setFontSize(10)
      const filters: string[] = []
      if (selectedDeveloper !== 'todos') {
        const dev = developers.find(d => d.id === selectedDeveloper)
        filters.push(`Desarrollador: ${dev?.name || 'N/A'}`)
      }
      if (selectedProject !== 'todos') {
        const proj = projects.find(p => p.id === selectedProject)
        filters.push(`Proyecto: ${proj?.name || 'N/A'}`)
      }
      if (selectedStatus !== 'todos') {
        const statusLabel = selectedStatus === 'vencida' ? 'Vencidas' : 
                           selectedStatus === 'en-progreso' ? 'En Progreso' :
                           selectedStatus === 'hecha' ? 'Completadas' : 'Todos'
        filters.push(`Estado: ${statusLabel}`)
      }
      if (dateFilterType === 'mes' && selectedMonth) {
        filters.push(`Mes: ${format(selectedMonth, 'MMMM yyyy', { locale: es })}`)
      } else if (dateFilterType === 'semana' && selectedWeek) {
        const weekStart = startOfWeek(selectedWeek, { locale: es })
        const weekEnd = endOfWeek(selectedWeek, { locale: es })
        filters.push(`Semana: ${format(weekStart, 'dd/MM/yyyy', { locale: es })} - ${format(weekEnd, 'dd/MM/yyyy', { locale: es })}`)
      } else if (dateFilterType === 'rango' && startDate && endDate) {
        filters.push(`Rango: ${format(startDate, 'dd/MM/yyyy', { locale: es })} - ${format(endDate, 'dd/MM/yyyy', { locale: es })}`)
      }
      
      if (filters.length === 0) {
        filters.push('Sin filtros aplicados')
      }
      
      filters.forEach(filter => {
        doc.text(`- ${filter}`, margin + 5, yPos)
        yPos += 6
      })
      
      yPos += 5
      
      // Estadísticas
      doc.setFontSize(14)
      doc.text('Estadísticas', margin, yPos)
      yPos += 8
      
      doc.setFontSize(10)
      doc.text(`Total de tareas: ${stats.total}`, margin, yPos)
      yPos += 6
      doc.text(`Pendientes: ${stats.pendientes}`, margin, yPos)
      yPos += 6
      doc.text(`En Progreso: ${stats.enProgreso}`, margin, yPos)
      yPos += 6
      doc.text(`Completadas: ${stats.completadas}`, margin, yPos)
      yPos += 6
      doc.text(`Vencidas: ${stats.vencidas}`, margin, yPos)
      yPos += 10
      
      // Lista de tareas
      doc.setFontSize(14)
      doc.text('Lista de Tareas', margin, yPos)
      yPos += 8
      
      doc.setFontSize(9)
      filteredTasks.forEach((task, index) => {
        // Verificar si necesitamos una nueva página
        if (yPos > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage()
          yPos = margin
        }
        
        const project = projects.find(p => p.id === task.projectId)
        const assignees = task.assignees.map(a => a.name).join(', ') || 'Sin asignar'
        const dueDate = task.dueDate ? format(new Date(task.dueDate), 'dd/MM/yyyy HH:mm', { locale: es }) : 'Sin fecha'
        const isOverdue = isTaskOverdue(task)
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(`${index + 1}. ${task.title}`, margin, yPos)
        yPos += 6
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`   Proyecto: ${project?.name || 'N/A'}`, margin + 5, yPos)
        yPos += 5
        doc.text(`   Estado: ${statusLabels[task.status]}`, margin + 5, yPos)
        yPos += 5
        doc.text(`   Prioridad: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`, margin + 5, yPos)
        yPos += 5
        doc.text(`   Asignado a: ${assignees}`, margin + 5, yPos)
        yPos += 5
        doc.text(`   Fecha de entrega: ${dueDate}${isOverdue ? ' (VENCIDA)' : ''}`, margin + 5, yPos)
        yPos += 5
        if (task.description) {
          const descriptionLines = doc.splitTextToSize(`   Descripción: ${task.description}`, pageWidth - margin * 2 - 10)
          descriptionLines.forEach((line: string) => {
            doc.text(line, margin + 5, yPos)
            yPos += 5
          })
        }
        yPos += 3
      })
      
      // Guardar PDF
      const fileName = `reporte-tareas-${format(new Date(), 'yyyy-MM-dd', { locale: es })}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      alert('Error al exportar el PDF. Por favor, intenta nuevamente.')
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Cargando tareas...</div>
      </div>
    )
  }
  
  // Verificar permisos: solo líderes y administradores pueden ver estadísticas
  if (!canViewAllTasks(currentUser)) {
    // Redirigir al dashboard después de mostrar el mensaje
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 3000)
    }
    
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Acceso Restringido</CardTitle>
            <CardDescription className="text-center">
              No tienes permisos para ver las estadísticas. Solo los líderes y administradores pueden acceder a esta sección.
            </CardDescription>
            <CardDescription className="text-center mt-2 text-sm">
              Serás redirigido al dashboard en unos segundos...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Estadísticas de Tareas
          </h1>
          <p className="text-muted-foreground">Filtra y analiza las tareas del proyecto</p>
        </div>
        <Button onClick={exportToPDF} className="gap-2">
          <FileDown className="h-4 w-4" />
          Exportar a PDF
        </Button>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="developer-filter">Desarrollador</Label>
              <Select value={selectedDeveloper} onValueChange={setSelectedDeveloper}>
                <SelectTrigger id="developer-filter">
                  <SelectValue placeholder="Todos los desarrolladores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los desarrolladores</SelectItem>
                  {developers.map(dev => (
                    <SelectItem key={dev.id} value={dev.id}>
                      {dev.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-filter">Proyecto</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger id="project-filter">
                  <SelectValue placeholder="Todos los proyectos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los proyectos</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status-filter">Estado</Label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as FilterStatus)}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="en-progreso">En Progreso</SelectItem>
                  <SelectItem value="hecha">Completadas</SelectItem>
                  <SelectItem value="vencida">Vencidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Filtros de fecha */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t pt-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="date-filter-type">Filtro de fecha</Label>
              <Select value={dateFilterType} onValueChange={(value) => {
                setDateFilterType(value as DateFilterType)
                if (value === 'ninguno') {
                  setSelectedMonth(undefined)
                  setSelectedWeek(undefined)
                  setStartDate(undefined)
                  setEndDate(undefined)
                }
              }}>
                <SelectTrigger id="date-filter-type">
                  <SelectValue placeholder="Sin filtro de fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">Sin filtro de fecha</SelectItem>
                  <SelectItem value="mes">Por mes</SelectItem>
                  <SelectItem value="semana">Por semana</SelectItem>
                  <SelectItem value="rango">Rango de fechas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateFilterType === 'mes' && (
              <div className="space-y-2 md:col-span-3">
                <Label>Seleccionar mes</Label>
                <Popover open={monthPopoverOpen} onOpenChange={setMonthPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedMonth ? format(selectedMonth, "MMMM yyyy", { locale: es }) : "Seleccionar mes"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      selected={selectedMonth}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedMonth(startOfMonth(date))
                          setMonthPopoverOpen(false)
                        }
                      }}
                      month={selectedMonth || new Date()}
                      onMonthChange={(date) => setSelectedMonth(startOfMonth(date))}
                      locale={es}
                      className="rounded-lg"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            {dateFilterType === 'semana' && (
              <div className="space-y-2 md:col-span-3">
                <Label>Seleccionar semana</Label>
                <Popover open={weekPopoverOpen} onOpenChange={setWeekPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedWeek ? (
                        `${format(startOfWeek(selectedWeek, { locale: es }), "dd/MM/yyyy", { locale: es })} - ${format(endOfWeek(selectedWeek, { locale: es }), "dd/MM/yyyy", { locale: es })}`
                      ) : "Seleccionar semana"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      selected={selectedWeek ? startOfWeek(selectedWeek, { locale: es }) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          // Siempre seleccionar el inicio de la semana
                          const weekStart = startOfWeek(date, { locale: es })
                          setSelectedWeek(weekStart)
                          setWeekPopoverOpen(false)
                        }
                      }}
                      month={selectedWeek || new Date()}
                      onMonthChange={(date) => {}}
                      modifiers={{
                        isWeekStart: (date) => {
                          const weekStart = startOfWeek(date, { locale: es })
                          return isSameDay(date, weekStart)
                        }
                      }}
                      modifiersClassNames={{
                        isWeekStart: 'bg-primary/20 border-2 border-primary font-semibold'
                      }}
                      locale={es}
                      className="rounded-lg"
                    />
                    {selectedWeek && (
                      <div className="p-3 border-t">
                        <div className="text-sm text-center">
                          <div className="font-medium">Semana seleccionada:</div>
                          <div className="text-muted-foreground">
                            {format(startOfWeek(selectedWeek, { locale: es }), "dd/MM/yyyy", { locale: es })} - {format(endOfWeek(selectedWeek, { locale: es }), "dd/MM/yyyy", { locale: es })}
                          </div>
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            {dateFilterType === 'rango' && (
              <>
                <div className="space-y-2">
                  <Label>Fecha inicio</Label>
                  <Popover open={startDatePopoverOpen} onOpenChange={setStartDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: es }) : "Inicio"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date)
                          if (date) {
                            setStartDatePopoverOpen(false)
                          }
                        }}
                        month={startDate || new Date()}
                        onMonthChange={(date) => {}}
                        locale={es}
                        className="rounded-lg"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>Fecha fin</Label>
                  <Popover open={endDatePopoverOpen} onOpenChange={setEndDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: es }) : "Fin"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date)
                          if (date) {
                            setEndDatePopoverOpen(false)
                          }
                        }}
                        month={endDate || new Date()}
                        onMonthChange={(date) => {}}
                        locale={es}
                        className="rounded-lg"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {(startDate || endDate) && (
                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStartDate(undefined)
                        setEndDate(undefined)
                      }}
                    >
                      Limpiar
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.pendientes}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              En Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.enProgreso}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completadas}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.vencidas}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Lista de tareas filtradas */}
      <Card>
        <CardHeader>
          <CardTitle>Tareas ({filteredTasks.length})</CardTitle>
          <CardDescription>
            {filteredTasks.length === 0 
              ? 'No hay tareas que coincidan con los filtros seleccionados'
              : `Mostrando ${filteredTasks.length} tarea${filteredTasks.length !== 1 ? 's' : ''}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No se encontraron tareas con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const project = projects.find(p => p.id === task.projectId)
                const isOverdue = isTaskOverdue(task)
                
                return (
                  <Card key={task.id} className={`border-border hover:border-primary/50 transition-colors ${
                    isOverdue ? 'border-red-500/50 bg-red-50/30 dark:bg-red-900/10' : ''
                  }`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-card-foreground mb-2 flex items-center gap-2">
                            {task.title}
                            {isOverdue && (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                                Vencida
                              </Badge>
                            )}
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
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={statusColors[task.status]}
                          >
                            {statusLabels[task.status]}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {project && (
                          <div className="flex items-center gap-1">
                            <FolderKanban className="h-4 w-4" />
                            <span>{project.name}</span>
                          </div>
                        )}
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
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(new Date(task.dueDate), "dd/MM/yyyy HH:mm", { locale: es })}
                              {isOverdue && ' (Vencida)'}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span>Creada: {format(new Date(task.createdAt), "dd/MM/yyyy", { locale: es })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
