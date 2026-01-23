import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { LifecycleTimeline } from './LifecycleTimeline'
import { ProjectHealthPanel } from './ProjectHealthPanel'
import { ActiveUsersPanel } from './ActiveUsersPanel'
import { LifecycleEngine, type LifecycleAnalysis, type LifecyclePhase } from '@/lib/engines/lifecycle-engine'
import { useAppStore } from '@/lib/store'
import { projectsApi } from '@/lib/api/projects'
import { ArrowLeft, RefreshCw, Info, Settings, AlertTriangle } from 'lucide-react'
import { Badge } from './Badge'
import { canCreateOrEdit } from '@/lib/utils/permissions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Alert, AlertDescription, AlertTitle } from './Alert'

interface ProjectLifecyclePageProps {
  projectId: string
}

const phaseConfig: Record<LifecyclePhase, {
  name: string
  icon: string
  color: string
  bgColor: string
}> = {
  planeacion: {
    name: 'Planeación',
    icon: '📋',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
  },
  'analisis-diseno': {
    name: 'Análisis y Diseño',
    icon: '🎨',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
  },
  desarrollo: {
    name: 'Desarrollo',
    icon: '💻',
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/20',
  },
  pruebas: {
    name: 'Pruebas',
    icon: '🧪',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
  },
  despliegue: {
    name: 'Despliegue',
    icon: '🚀',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20',
  },
  mantenimiento: {
    name: 'Mantenimiento',
    icon: '🔧',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
  },
  finalizado: {
    name: 'Finalizado',
    icon: '✅',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-500/10 border-gray-500/20',
  },
}

export function ProjectLifecyclePage({ projectId }: ProjectLifecyclePageProps) {
  const [project, setProject] = useState<any>(null)
  const [analysis, setAnalysis] = useState<LifecycleAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const tasks = useAppStore((state) => state.tasks)
  const currentUser = useAppStore((state) => state.currentUser)
  const canEdit = canCreateOrEdit(currentUser)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const projectData = await projectsApi.getById(projectId)
        setProject(projectData)
      } catch (err: any) {
        console.error('Error al cargar proyecto:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  useEffect(() => {
    if (project && tasks.length >= 0) {
      const lifecycleAnalysis = LifecycleEngine.analyze(project, tasks)
      setAnalysis(lifecycleAnalysis)
      setLastUpdated(new Date())
    }
  }, [project, tasks])

  const handleRefresh = () => {
    if (project) {
      const lifecycleAnalysis = LifecycleEngine.analyze(project, tasks)
      setAnalysis(lifecycleAnalysis)
      setLastUpdated(new Date())
    }
  }

  if (loading || !analysis || !project) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Analizando ciclo de vida del proyecto...</div>
      </div>
    )
  }

  const currentPhaseInfo = phaseConfig[analysis.currentPhase]

  // Construir array de fases para el timeline
  const allPhases: LifecyclePhase[] = [
    'planeacion',
    'analisis-diseno',
    'desarrollo',
    'pruebas',
    'despliegue',
    'mantenimiento',
    'finalizado',
  ]

  const phasesForTimeline = allPhases.map(phaseId => {
    const isCurrent = phaseId === analysis.currentPhase
    const phaseIndex = allPhases.indexOf(phaseId)
    const currentIndex = allPhases.indexOf(analysis.currentPhase)
    
    return {
      id: phaseId,
      name: phaseConfig[phaseId].name,
      status: isCurrent 
        ? analysis.phaseInfo.status 
        : phaseIndex < currentIndex 
        ? 'completada' as const
        : 'pendiente' as const,
      progress: isCurrent ? analysis.phaseProgress : phaseIndex < currentIndex ? 100 : 0,
    }
  })

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
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Vida del Proyecto
          </h1>
          <p className="text-muted-foreground">
            {project.name} - Seguimiento automático del ciclo de vida
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Última actualización: {format(lastUpdated, "d MMM yyyy HH:mm", { locale: es })}
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Panel de Estado de Salud */}
      <ProjectHealthPanel
        health={analysis.health}
        overallProgress={analysis.overallProgress}
        phaseProgress={analysis.phaseProgress}
        trend={analysis.trend}
        currentPhase={analysis.currentPhase}
        estimatedDeploymentDate={analysis.estimatedDeploymentDate}
        daysSinceStart={analysis.metrics.daysSinceStart}
      />

      {/* Explicación del Estado */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            ¿Por qué el sistema determinó este estado?
          </CardTitle>
          <CardDescription>
            Explicación automática basada en análisis de tareas y métricas del proyecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-foreground whitespace-pre-line mb-4">
              {analysis.explanation}
            </p>
            
            {/* Razones detalladas */}
            {analysis.reasons.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Razones específicas:</p>
                <ul className="space-y-1">
                  {analysis.reasons.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t">
                  <Badge variant="outline" className="text-xs">
                    Confianza: {analysis.confidence}%
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline de Fases */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground mb-1">Ciclo de Vida del Proyecto</h2>
          <p className="text-sm text-muted-foreground">
            Visualización de todas las fases del proyecto y su estado actual
          </p>
        </div>
        <LifecycleTimeline
          currentPhase={analysis.currentPhase}
          phases={phasesForTimeline}
        />
      </div>

      {/* Panel de Usuarios Activos */}
      <ActiveUsersPanel activeUsers={analysis.activeUsers} />

      {/* Métricas Detalladas */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Métricas del Proyecto</CardTitle>
          <CardDescription>
            Datos utilizados para el análisis automático del ciclo de vida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total de Tareas</p>
              <p className="text-2xl font-bold">{analysis.metrics.totalTasks}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Completadas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {analysis.metrics.completedTasks}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">En Progreso</p>
              <p className="text-2xl font-bold text-primary">
                {analysis.metrics.inProgressTasks}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pendientes</p>
              <p className="text-2xl font-bold text-muted-foreground">
                {analysis.metrics.pendingTasks}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tasa de Completitud</p>
              <p className="text-2xl font-bold">
                {analysis.metrics.completionRate.toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tareas Críticas</p>
              <p className="text-2xl font-bold">
                {analysis.metrics.highPriorityCompleted}/
                {analysis.metrics.highPriorityTotal}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Días desde Inicio</p>
              <p className="text-2xl font-bold">
                {analysis.metrics.daysSinceStart}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Actividad Reciente</p>
              <p className="text-2xl font-bold">
                {analysis.metrics.recentActivity} tareas
              </p>
            </div>
          </div>

          {/* Alertas basadas en métricas */}
          {analysis.metrics.overdueTasks > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Tareas Vencidas</AlertTitle>
              <AlertDescription>
                {analysis.metrics.overdueTasks} tarea(s) han vencido y requieren atención
              </AlertDescription>
            </Alert>
          )}

          {analysis.metrics.inProgressTasks === 0 && analysis.metrics.pendingTasks > 0 && analysis.metrics.daysSinceStart > 7 && (
            <Alert className="mt-4 border-yellow-500 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle>Proyecto Estancado</AlertTitle>
              <AlertDescription>
                No hay tareas en progreso. El proyecto puede estar detenido.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
