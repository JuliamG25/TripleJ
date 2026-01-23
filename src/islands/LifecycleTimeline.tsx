import { Card, CardContent } from './Card'
import { Badge } from './Badge'
import { CheckCircle2, Circle, Play, Clock } from 'lucide-react'
import type { LifecyclePhase, PhaseStatus } from '@/lib/engines/lifecycle-engine'
import { cn } from '@/lib/utils'

interface LifecycleTimelineProps {
  currentPhase: LifecyclePhase
  phases: Array<{
    id: LifecyclePhase
    name: string
    status: PhaseStatus
    progress: number
  }>
}

const phaseConfig: Record<LifecyclePhase, {
  name: string
  icon: string
  color: string
  bgColor: string
  order: number
}> = {
  planeacion: {
    name: 'Planeación',
    icon: '📋',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    order: 1,
  },
  'analisis-diseno': {
    name: 'Análisis y Diseño',
    icon: '🎨',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    order: 2,
  },
  desarrollo: {
    name: 'Desarrollo',
    icon: '💻',
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/20',
    order: 3,
  },
  pruebas: {
    name: 'Pruebas',
    icon: '🧪',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
    order: 4,
  },
  despliegue: {
    name: 'Despliegue',
    icon: '🚀',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20',
    order: 5,
  },
  mantenimiento: {
    name: 'Mantenimiento',
    icon: '🔧',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    order: 6,
  },
  finalizado: {
    name: 'Finalizado',
    icon: '✅',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-500/10 border-gray-500/20',
    order: 7,
  },
}

export function LifecycleTimeline({ currentPhase, phases }: LifecycleTimelineProps) {
  const allPhases: LifecyclePhase[] = [
    'planeacion',
    'analisis-diseno',
    'desarrollo',
    'pruebas',
    'despliegue',
    'mantenimiento',
    'finalizado',
  ]

  const getPhaseStatusIcon = (status: PhaseStatus) => {
    switch (status) {
      case 'completada':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'en-progreso':
        return <Play className="h-5 w-5 text-primary" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getPhaseStatusColor = (status: PhaseStatus, isCurrent: boolean) => {
    if (status === 'completada') {
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
    }
    if (status === 'en-progreso' || isCurrent) {
      return 'bg-primary/10 text-primary border-primary/20'
    }
    return 'bg-muted text-muted-foreground border-border'
  }

  const currentPhaseIndex = allPhases.indexOf(currentPhase)

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="relative">
          {/* Línea de conexión horizontal */}
          <div className="absolute top-12 left-0 right-0 h-0.5 bg-border hidden md:block" />
          
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 relative">
            {allPhases.map((phaseId, index) => {
              const config = phaseConfig[phaseId]
              const phaseData = phases.find(p => p.id === phaseId)
              const isCurrent = phaseId === currentPhase
              const isPast = index < currentPhaseIndex
              const isFuture = index > currentPhaseIndex
              
              const status = phaseData?.status || (isPast ? 'completada' : isCurrent ? 'en-progreso' : 'pendiente')
              const progress = phaseData?.progress || 0

              return (
                <div
                  key={phaseId}
                  className="flex flex-col items-center gap-2 relative z-10"
                >
                  {/* Indicador de fase */}
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all relative",
                      "shadow-sm",
                      isCurrent && "ring-4 ring-primary/20 scale-110",
                      getPhaseStatusColor(status, isCurrent)
                    )}
                  >
                    <span className="text-2xl">{config.icon}</span>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                      {getPhaseStatusIcon(status)}
                    </div>
                  </div>

                  {/* Nombre y estado */}
                  <div className="text-center space-y-1 w-full">
                    <p className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-primary font-semibold",
                      !isCurrent && "text-muted-foreground"
                    )}>
                      {config.name}
                    </p>
                    
                    {/* Progreso */}
                    {status !== 'pendiente' && (
                      <div className="flex items-center gap-1 justify-center">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              status === 'completada' 
                                ? "bg-green-500" 
                                : "bg-primary"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {progress}%
                        </span>
                      </div>
                    )}

                    {/* Badge de estado */}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        getPhaseStatusColor(status, isCurrent)
                      )}
                    >
                      {status === 'completada' 
                        ? 'Completada' 
                        : status === 'en-progreso' 
                        ? 'En Progreso' 
                        : 'Pendiente'}
                    </Badge>

                    {/* Indicador de fase actual */}
                    {isCurrent && (
                      <Badge className="text-xs bg-primary text-primary-foreground">
                        Fase Actual
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
