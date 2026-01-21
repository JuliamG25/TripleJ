import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Badge } from './Badge'
import { Progress } from './Progress'
import { FolderKanban, ListTodo, CheckCircle2, Clock, TrendingUp, Users, AlertCircle } from 'lucide-react'
import { useAppStore, type AppState } from '@/lib/store'
import { shallow } from 'zustand/shallow'
import { Button } from './Button'
import type { Task, Project } from '@/lib/types'
import { filterTasksByRole } from '@/lib/utils/permissions'

export function DashboardPage() {
  // Usar selectores individuales - cada uno crea su propia suscripción
  // Esto es más confiable que un selector combinado
  const loading = useAppStore((state: AppState) => state.loading)
  const projects = useAppStore((state: AppState) => state.projects)
  const allTasks = useAppStore((state: AppState) => state.tasks)
  const currentUser = useAppStore((state: AppState) => state.currentUser)
  const error = useAppStore((state: AppState) => state.error)
  
  // Filtrar tareas según el rol del usuario
  const tasks = filterTasksByRole(allTasks, currentUser)

  // Debug: verificar cuando cambian los valores
  useEffect(() => {
    console.log('🔄 [DashboardPage] useEffect - Valores cambiaron:', {
      loading,
      projectsCount: projects.length,
      tasksCount: tasks.length,
      timestamp: Date.now()
    })
  }, [loading, projects, tasks])

  // Calcular proyectos con tareas localmente
  const projectsWithTasks = projects.map(project => ({
    ...project,
    tasks: tasks.filter((t: Task) => t.projectId === project.id),
  }))

  // Debug - esto debería ejecutarse cada vez que el componente se renderiza
  console.log('📊 [DashboardPage] Render:', { 
    loading, 
    projectsCount: projects.length, 
    tasksCount: tasks.length,
    hasData: projects.length > 0 || tasks.length > 0,
    timestamp: Date.now()
  })

  // Si loading es true Y no tenemos datos, mostrar carga
  const hasData = projects.length > 0 || tasks.length > 0
  const shouldShowLoading = loading === true && !hasData
  
  console.log('🔍 [DashboardPage] Decisión:', { shouldShowLoading, loading, hasData })
  
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="animate-pulse text-muted-foreground text-lg">Cargando...</div>
        <div className="text-sm text-muted-foreground">
          Si esto tarda mucho, verifica la consola del navegador y del servidor
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-destructive mb-2">Error al cargar datos</h3>
              <p className="text-sm text-destructive/80 mb-4">{error}</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Reintentar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('fesc-token')
                      localStorage.removeItem('fesc-user')
                      window.location.href = '/login'
                    }
                  }}
                >
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const stats = {
    totalProjects: projectsWithTasks.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t: Task) => t.status === 'hecha').length,
    inProgressTasks: tasks.filter((t: Task) => t.status === 'en-progreso').length,
    pendingTasks: tasks.filter((t: Task) => t.status === 'pendiente').length,
    teamMembers: new Set(
      projectsWithTasks.flatMap((p: Project) => [p.leader, ...p.members].map(m => m.id))
    ).size,
  }

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenido, {currentUser?.name?.split(' ')[0] || 'Usuario'}
        </h1>
        <p className="text-muted-foreground">
          Resumen de tus proyectos y tareas
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Proyectos Activos
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">+1 este mes</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tareas Totales
            </CardTitle>
            <ListTodo className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingTasks} pendientes</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completadas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">{completionRate}% del total</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Miembros
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">En todos los proyectos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Projects */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Proyectos Recientes</CardTitle>
            <CardDescription>Tus proyectos más activos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectsWithTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay proyectos disponibles</p>
            ) : (
              projectsWithTasks.slice(0, 5).map((project: Project) => {
                const projectTasks = tasks.filter((t: Task) => t.projectId === project.id)
                const completed = projectTasks.filter((t: Task) => t.status === 'hecha').length
                const progress = projectTasks.length > 0 
                  ? Math.round((completed / projectTasks.length) * 100) 
                  : 0

                return (
                  <a 
                    key={project.id} 
                    href={`/dashboard/proyectos/${project.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-card-foreground">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {projectTasks.length} tareas • {project.members.length} miembros
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-card-foreground">{progress}%</p>
                        <Progress value={progress} className="w-20 h-2" />
                      </div>
                    </div>
                  </a>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Tareas Recientes</CardTitle>
            <CardDescription>Últimas actualizaciones en tareas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay tareas disponibles</p>
            ) : (
              tasks.slice(0, 5).map((task: Task) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-card-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.assignees.length > 0 
                        ? task.assignees.map(a => a.name).join(', ')
                        : 'Sin asignar'}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      task.status === 'hecha' ? 'default' :
                      task.status === 'en-progreso' ? 'secondary' : 'outline'
                    }
                    className={
                      task.status === 'hecha' ? 'bg-green-500 text-white hover:bg-green-600' :
                      task.status === 'en-progreso' ? 'bg-primary/10 text-primary' : ''
                    }
                  >
                    {task.status === 'hecha' ? 'Completada' :
                     task.status === 'en-progreso' ? 'En Progreso' : 'Pendiente'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Actividad Reciente</CardTitle>
          <CardDescription>Últimos movimientos en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'Tarea completada', detail: 'Diseñar interfaz del dashboard', time: 'Hace 2 horas', user: 'Ana Martínez' },
              { action: 'Comentario agregado', detail: 'Implementar autenticación', time: 'Hace 4 horas', user: 'María García' },
              { action: 'Tarea creada', detail: 'Crear módulo de reportes', time: 'Hace 1 día', user: 'Carlos Rodríguez' },
              { action: 'Proyecto actualizado', detail: 'Sistema de Gestión Académica', time: 'Hace 2 días', user: 'María García' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-card-foreground">
                    <span className="font-medium">{activity.user}</span> - {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.detail}</p>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
