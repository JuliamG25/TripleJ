import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Badge } from './Badge'
import { User, Clock, Activity } from 'lucide-react'
import type { ActivityInfo } from '@/lib/engines/lifecycle-engine'
import { format, differenceInMinutes, differenceInHours } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ActiveUsersPanelProps {
  activeUsers: ActivityInfo[]
}

const phaseNames: Record<string, string> = {
  planeacion: 'Planeación',
  'analisis-diseno': 'Análisis y Diseño',
  desarrollo: 'Desarrollo',
  pruebas: 'Pruebas',
  despliegue: 'Despliegue',
  mantenimiento: 'Mantenimiento',
  finalizado: 'Finalizado',
}

export function ActiveUsersPanel({ activeUsers }: ActiveUsersPanelProps) {
  const getStatusBadge = (status: ActivityInfo['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            <Activity className="h-3 w-3 mr-1" />
            Activo
          </Badge>
        )
      case 'recent':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            Reciente
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Inactivo
          </Badge>
        )
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const minutes = differenceInMinutes(now, date)
    const hours = differenceInHours(now, date)

    if (minutes < 60) {
      return `hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`
    } else if (hours < 24) {
      return `hace ${hours} hora${hours !== 1 ? 's' : ''}`
    } else {
      const days = Math.floor(hours / 24)
      return `hace ${days} día${days !== 1 ? 's' : ''}`
    }
  }

  if (activeUsers.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Actividad Actual
          </CardTitle>
          <CardDescription>
            Usuarios trabajando en el proyecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No hay actividad reciente</p>
            <p className="text-sm mt-1">No se detectaron usuarios trabajando actualmente</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Actividad Actual
        </CardTitle>
        <CardDescription>
          {activeUsers.length} usuario{activeUsers.length !== 1 ? 's' : ''} trabajando en el proyecto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeUsers.map((activity, index) => (
            <div
              key={`${activity.user.id}-${index}`}
              className={cn(
                "p-4 rounded-lg border transition-all",
                activity.status === 'active'
                  ? "bg-green-500/5 border-green-500/20"
                  : activity.status === 'recent'
                  ? "bg-blue-500/5 border-blue-500/20"
                  : "bg-muted/50 border-border"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {activity.user.avatar ? (
                      <img 
                        src={activity.user.avatar} 
                        alt={activity.user.name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium text-primary">
                        {activity.user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>

                  {/* Información */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{activity.user.name}</p>
                      {getStatusBadge(activity.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Trabajando en: <span className="font-medium text-foreground">{activity.task.title}</span>
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {phaseNames[activity.phase] || activity.phase}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(activity.lastActivity)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
