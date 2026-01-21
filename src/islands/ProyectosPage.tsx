import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Badge } from './Badge'
import { Progress } from './Progress'
import { Button } from './Button'
import { Users, Calendar, FolderKanban } from 'lucide-react'
import { useAppStore, useProjectsWithTasks, type AppState } from '@/lib/store'
import { CreateProjectForm } from './CreateProjectForm'
import { canCreateOrEdit } from '@/lib/utils/permissions'

export function ProyectosPage() {
  const projects = useProjectsWithTasks()
  const loading = useAppStore((state: AppState) => state.loading)
  const error = useAppStore((state: AppState) => state.error)
  const currentUser = useAppStore((state: AppState) => state.currentUser)
  const loadData = useAppStore((state: AppState) => state.loadData)
  
  const canCreate = canCreateOrEdit(currentUser)

  // Debug
  useEffect(() => {
    console.log('📋 [ProyectosPage] Estado:', {
      loading,
      projectsCount: projects.length,
      error,
      timestamp: Date.now()
    })
  }, [loading, projects.length, error])

  // Intentar cargar datos si no hay proyectos y no está cargando
  useEffect(() => {
    if (!loading && projects.length === 0 && !error) {
      console.log('🔄 [ProyectosPage] No hay proyectos, intentando cargar datos...')
      loadData()
    }
  }, [loading, projects.length, error, loadData])

  const handleProjectCreated = () => {
    // Recargar datos después de crear proyecto
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Cargando proyectos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Proyectos</h1>
            <p className="text-muted-foreground">Gestiona todos tus proyectos académicos</p>
          </div>
          <CreateProjectForm onSuccess={handleProjectCreated} />
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => loadData()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proyectos</h1>
          <p className="text-muted-foreground">Gestiona todos tus proyectos académicos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadData()}>
            Recargar
          </Button>
          {canCreate && (
            <CreateProjectForm onSuccess={handleProjectCreated} />
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="border-border">
          <CardContent className="pt-6 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay proyectos disponibles
            </h3>
            <p className="text-muted-foreground mb-4">
              {canCreate 
                ? 'Crea tu primer proyecto para comenzar a gestionar tus tareas académicas'
                : 'No tienes proyectos asignados. Contacta a un administrador para que te asigne a un proyecto.'}
            </p>
            {canCreate && (
              <CreateProjectForm onSuccess={handleProjectCreated} />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
          const completed = project.tasks.filter(t => t.status === 'hecha').length
          const progress = project.tasks.length > 0 
            ? Math.round((completed / project.tasks.length) * 100) 
            : 0

          return (
            <Card key={project.id} className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-card-foreground mb-2">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {project.description}
                    </CardDescription>
                  </div>
                  <FolderKanban className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Progreso</span>
                    <span className="text-sm font-medium text-card-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{project.members.length} miembros</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{project.tasks.length} tareas</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Líder del proyecto</p>
                    <p className="text-sm font-medium text-card-foreground">{project.leader.name}</p>
                  </div>
                  <a 
                    href={`/dashboard/proyectos/${project.id}`}
                    className="text-sm text-primary hover:text-fesc-hover transition-colors"
                  >
                    Ver detalles →
                  </a>
                </div>
              </CardContent>
            </Card>
          )
        })}
        </div>
      )}
    </div>
  )
}
