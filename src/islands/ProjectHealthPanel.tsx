import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Badge } from './Badge'
import { Progress } from './Progress'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, Calendar } from 'lucide-react'
import type { ProjectHealth, LifecyclePhase } from '@/lib/engines/lifecycle-engine'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ProjectHealthPanelProps {
  health: ProjectHealth
  overallProgress: number
  phaseProgress: number
  trend: 'up' | 'stable' | 'down' | 'at-risk'
  currentPhase: LifecyclePhase
  estimatedDeploymentDate: Date | null
  daysSinceStart: number
}

const healthConfig: Record<ProjectHealth, {
  label: string
  color: string
  bgColor: string
  icon: React.ReactNode
}> = {
  'en-tiempo': {
    label: 'En Tiempo',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  'en-riesgo': {
    label: 'En Riesgo',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  'atrasado': {
    label: 'Atrasado',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
}

const phaseNames: Record<LifecyclePhase, string> = {
  planeacion: 'Planeación',
  'analisis-diseno': 'Análisis y Diseño',
  desarrollo: 'Desarrollo',
  pruebas: 'Pruebas',
  despliegue: 'Despliegue',
  mantenimiento: 'Mantenimiento',
  finalizado: 'Finalizado',
}

export function ProjectHealthPanel({
  health,
  overallProgress,
  phaseProgress,
  trend,
  currentPhase,
  estimatedDeploymentDate,
  daysSinceStart,
}: ProjectHealthPanelProps) {
  const healthInfo = healthConfig[health]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Estado de Salud */}
      <Card className={cn("border-2", healthInfo.bgColor)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {healthInfo.icon}
            Estado del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge 
            variant="outline" 
            className={cn("text-base font-semibold px-3 py-1", healthInfo.color, healthInfo.bgColor)}
          >
            {healthInfo.label}
          </Badge>
        </CardContent>
      </Card>

      {/* Progreso Global */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Progreso Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{overallProgress}%</span>
              {trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
              {trend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
              {trend === 'at-risk' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              {trend === 'stable' && <Clock className="h-5 w-5 text-muted-foreground" />}
            </div>
            <Progress value={overallProgress} className="h-3" />
            <p className="text-xs text-muted-foreground">
              Basado en tareas completadas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Progreso de Fase */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Progreso de Fase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-lg font-semibold">{phaseNames[currentPhase]}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{phaseProgress}%</span>
            </div>
            <Progress value={phaseProgress} className="h-3" />
            <p className="text-xs text-muted-foreground">
              Avance dentro de la fase actual
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fecha de Despliegue */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Despliegue Estimado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {estimatedDeploymentDate ? (
              <>
                <p className="text-lg font-semibold">
                  {format(estimatedDeploymentDate, "d MMM yyyy", { locale: es })}
                </p>
                {(() => {
                  const daysRemaining = differenceInDays(estimatedDeploymentDate, new Date())
                  return (
                    <Badge
                      variant="outline"
                      className={cn(
                        daysRemaining < 0
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                          : daysRemaining < 7
                          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                          : 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                      )}
                    >
                      {daysRemaining < 0
                        ? `${Math.abs(daysRemaining)} día(s) de retraso`
                        : `${daysRemaining} día(s) restante(s)`}
                    </Badge>
                  )
                })()}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No disponible aún
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Tiempo */}
      <Card className="border-border md:col-span-2 lg:col-span-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Resumen de Tiempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tiempo Transcurrido</p>
              <p className="text-lg font-semibold">{daysSinceStart} día{daysSinceStart !== 1 ? 's' : ''}</p>
            </div>
            {estimatedDeploymentDate && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tiempo Restante</p>
                <p className={cn(
                  "text-lg font-semibold",
                  differenceInDays(estimatedDeploymentDate, new Date()) < 0 
                    ? "text-red-600 dark:text-red-400"
                    : differenceInDays(estimatedDeploymentDate, new Date()) < 7
                    ? "text-yellow-600 dark:text-yellow-400"
                    : ""
                )}>
                  {(() => {
                    const days = differenceInDays(estimatedDeploymentDate, new Date())
                    return days < 0 ? `${Math.abs(days)} día(s)` : `${days} día(s)`
                  })()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
