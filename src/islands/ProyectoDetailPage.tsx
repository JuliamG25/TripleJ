import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Badge } from './Badge'
import { Progress } from './Progress'
import { Button } from './Button'
import { MiniKanban } from './MiniKanban'
import { CreateTaskForm } from './CreateTaskForm'
import { CreateMeetingForm } from './CreateMeetingForm'
import { EditProjectForm } from './EditProjectForm'
import { ProjectMembersManager } from './ProjectMembersManager'
import { useAppStore, type AppState } from '@/lib/store'
import { projectsApi } from '@/lib/api/projects'
import { Users, Calendar, ArrowLeft, FolderKanban } from 'lucide-react'
import type { Project } from '@/lib/types'
import { filterTasksByRole, canCreateOrEdit } from '@/lib/utils/permissions'

interface ProyectoDetailPageProps {
  projectId: string
}

export function ProyectoDetailPage({ projectId }: ProyectoDetailPageProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const allTasks = useAppStore((state: AppState) => state.tasks)
  const currentUser = useAppStore((state: AppState) => state.currentUser)
  const loadData = useAppStore((state: AppState) => state.loadData)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const projectData = await projectsApi.getById(projectId)
        setProject(projectData)
      } catch (err: any) {
        setError(err.message || 'Error al cargar proyecto')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  // Obtener tareas del proyecto filtradas por rol
  const projectTasks = filterTasksByRole(
    allTasks.filter(task => task.projectId === projectId),
    currentUser
  )
  const canCreate = canCreateOrEdit(currentUser)
  const completed = projectTasks.filter(t => t.status === 'hecha').length
  const progress = projectTasks.length > 0 
    ? Math.round((completed / projectTasks.length) * 100) 
    : 0

  const handleTaskCreated = async () => {
    // Recargar datos después de crear tarea
    await loadData()
    // Recargar proyecto también
    try {
      const projectData = await projectsApi.getById(projectId)
      setProject(projectData)
    } catch (err: any) {
      console.error('Error al recargar proyecto:', err)
    }
  }

  const handleMembersUpdated = async () => {
    // Recargar datos después de actualizar miembros
    await loadData()
    // Recargar proyecto también
    try {
      const projectData = await projectsApi.getById(projectId)
      setProject(projectData)
    } catch (err: any) {
      console.error('Error al recargar proyecto:', err)
    }
  }

  const handleProjectUpdated = async () => {
    // Recargar datos después de editar proyecto
    await loadData()
    // Recargar proyecto también
    try {
      const projectData = await projectsApi.getById(projectId)
      setProject(projectData)
    } catch (err: any) {
      console.error('Error al recargar proyecto:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Cargando proyecto...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error || 'Proyecto no encontrado'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Proyectos
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = `/dashboard/proyectos/${projectId}/vida`
            }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Vida del Proyecto
          </Button>
          {canCreate && (
            <>
              {(currentUser?.role === 'administrador' || 
                (currentUser?.role === 'lider' && project.leader.id === currentUser.id)) && (
                <EditProjectForm 
                  project={project} 
                  onSuccess={handleProjectUpdated}
                />
              )}
              <CreateMeetingForm projectId={projectId} onSuccess={handleProjectUpdated} />
              <CreateTaskForm projectId={projectId} onSuccess={handleTaskCreated} />
            </>
          )}
        </div>
=======
        {canCreate && (
          <CreateTaskForm projectId={projectId} onSuccess={handleTaskCreated} />
        )}
>>>>>>> parent of ddc73cf (vida del proyecto)
=======
=======
>>>>>>> parent of 199c4fb (Merge branch 'main' of https://github.com/JuliamG25/TripleJ)
        {canCreate && (
          <div className="flex gap-2">
            {(currentUser?.role === 'administrador' || 
              (currentUser?.role === 'lider' && project.leader.id === currentUser.id)) && (
              <EditProjectForm 
                project={project} 
                onSuccess={handleProjectUpdated}
              />
            )}
            <CreateMeetingForm projectId={projectId} onSuccess={handleProjectUpdated} />
            <CreateTaskForm projectId={projectId} onSuccess={handleTaskCreated} />
          </div>
        )}
<<<<<<< HEAD
>>>>>>> parent of 199c4fb (Merge branch 'main' of https://github.com/JuliamG25/TripleJ)
=======
>>>>>>> parent of 199c4fb (Merge branch 'main' of https://github.com/JuliamG25/TripleJ)
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-card-foreground">{progress}%</span>
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {completed} de {projectTasks.length} tareas completadas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Tareas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-card-foreground">{projectTasks.length}</span>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {projectTasks.filter(t => t.status === 'pendiente').length} pendientes
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Miembros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-card-foreground">
                {project.members.length + 1}
              </span>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Líder: {project.leader.name}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mini Kanban */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Tablero Kanban</CardTitle>
          <CardDescription>Arrastra las tareas entre columnas para cambiar su estado</CardDescription>
        </CardHeader>
        <CardContent>
          <MiniKanban projectId={projectId} />
        </CardContent>
      </Card>

      {/* Team Members Management */}
      {project && (
        <ProjectMembersManager project={project} onUpdate={handleMembersUpdated} />
      )}
    </div>
  )
}
