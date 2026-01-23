import type { Task, Project, User } from '../types'

// Tipos del ciclo de vida
export type LifecyclePhase = 
  | 'planeacion'
  | 'analisis-diseno'
  | 'desarrollo'
  | 'pruebas'
  | 'despliegue'
  | 'mantenimiento'
  | 'finalizado'

export type PhaseStatus = 'pendiente' | 'en-progreso' | 'completada'
export type ProjectHealth = 'en-tiempo' | 'en-riesgo' | 'atrasado'

export interface PhaseInfo {
  id: LifecyclePhase
  name: string
  description: string
  status: PhaseStatus
  progress: number // 0-100
  startDate?: Date
  endDate?: Date
  estimatedEndDate?: Date
}

export interface ProjectMetrics {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  completionRate: number
  highPriorityCompleted: number
  highPriorityTotal: number
  daysSinceStart: number
  averageTaskAge: number
  overdueTasks: number
  recentActivity: number // tareas actualizadas en últimos 7 días
}

export interface ActivityInfo {
  user: User
  task: Task
  phase: LifecyclePhase
  lastActivity: Date
  status: 'active' | 'recent' | 'idle'
}

export interface LifecycleAnalysis {
  currentPhase: LifecyclePhase
  phaseInfo: PhaseInfo
  metrics: ProjectMetrics
  health: ProjectHealth
  overallProgress: number
  phaseProgress: number
  trend: 'up' | 'stable' | 'down' | 'at-risk'
  estimatedDeploymentDate: Date | null
  explanation: string
  reasons: string[]
  confidence: number
  activeUsers: ActivityInfo[]
}

/**
 * Motor de automatización del ciclo de vida del proyecto
 * Analiza tareas reales y determina automáticamente el estado del proyecto
 */
export class LifecycleEngine {
  /**
   * Analiza el proyecto completo y genera un análisis del ciclo de vida
   */
  static analyze(project: Project, tasks: Task[]): LifecycleAnalysis {
    const projectTasks = tasks.filter(t => t.projectId === project.id)
    const metrics = this.calculateMetrics(project, projectTasks)
    const phaseAnalysis = this.determinePhase(project, projectTasks, metrics)
    const health = this.determineHealth(projectTasks, metrics)
    const progress = this.calculateProgress(projectTasks, metrics, phaseAnalysis.phase)
    const activeUsers = this.detectActiveUsers(project, projectTasks)
    const explanation = this.generateExplanation(phaseAnalysis, metrics, health, progress)

    return {
      currentPhase: phaseAnalysis.phase,
      phaseInfo: phaseAnalysis,
      metrics,
      health,
      overallProgress: progress.overall,
      phaseProgress: progress.phase,
      trend: progress.trend,
      estimatedDeploymentDate: this.estimateDeployment(project, projectTasks, phaseAnalysis.phase, progress),
      explanation,
      reasons: phaseAnalysis.reasons,
      confidence: phaseAnalysis.confidence,
      activeUsers,
    }
  }

  /**
   * Calcula métricas clave del proyecto
   */
  private static calculateMetrics(project: Project, tasks: Task[]): ProjectMetrics {
    const now = new Date()
    const projectStart = new Date(project.createdAt)
    const daysSinceStart = Math.floor((now.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))

    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'hecha').length
    const inProgressTasks = tasks.filter(t => t.status === 'en-progreso').length
    const pendingTasks = tasks.filter(t => t.status === 'pendiente').length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const highPriorityTasks = tasks.filter(t => t.priority === 'alta')
    const highPriorityCompleted = highPriorityTasks.filter(t => t.status === 'hecha').length
    const highPriorityTotal = highPriorityTasks.length

    // Tareas vencidas
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === 'hecha') return false
      return new Date(t.dueDate) < now
    }).length

    // Edad promedio de tareas
    const taskAges = tasks.map(t => {
      const created = new Date(t.createdAt).getTime()
      return Math.floor((now.getTime() - created) / (1000 * 60 * 60 * 24))
    })
    const averageTaskAge = taskAges.length > 0 
      ? taskAges.reduce((sum, age) => sum + age, 0) / taskAges.length 
      : 0

    // Actividad reciente (últimos 7 días)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentActivity = tasks.filter(t => {
      const updated = new Date(t.updatedAt).getTime()
      return updated > sevenDaysAgo.getTime()
    }).length

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate,
      highPriorityCompleted,
      highPriorityTotal,
      daysSinceStart,
      averageTaskAge,
      overdueTasks,
      recentActivity,
    }
  }

  /**
   * Determina la fase actual basándose en reglas automáticas
   */
  private static determinePhase(
    project: Project,
    tasks: Task[],
    metrics: ProjectMetrics
  ): { phase: LifecyclePhase; reasons: string[]; confidence: number; status: PhaseStatus; progress: number } {
    const reasons: string[] = []
    let phase: LifecyclePhase = 'planeacion'
    let confidence = 0
    let status: PhaseStatus = 'pendiente'
    let progress = 0

    // Detectar tipos de tareas
    const hasTestingTasks = tasks.some(t => 
      t.title.toLowerCase().includes('test') || 
      t.title.toLowerCase().includes('prueba') ||
      t.description.toLowerCase().includes('test') ||
      t.description.toLowerCase().includes('prueba')
    )

    const hasDeployTasks = tasks.some(t =>
      t.title.toLowerCase().includes('deploy') ||
      t.title.toLowerCase().includes('despliegue') ||
      t.description.toLowerCase().includes('deploy') ||
      t.description.toLowerCase().includes('despliegue')
    )

    // REGLA 1: Planeación
    // Proyecto muy nuevo (< 3 días) y sin actividad significativa
    if (metrics.daysSinceStart < 3 && metrics.inProgressTasks === 0 && metrics.completedTasks === 0) {
      phase = 'planeacion'
      confidence = 90
      status = 'en-progreso'
      progress = Math.min(50, (metrics.totalTasks / 5) * 10)
      reasons.push(`Proyecto iniciado hace ${metrics.daysSinceStart} día(s)`)
      reasons.push('Sin tareas en progreso ni completadas')
      return { phase, reasons, confidence, status, progress }
    }

    // REGLA 2: Análisis y Diseño
    // Pocas tareas completadas, mayoría pendientes, sin desarrollo activo
    if (metrics.completionRate < 20 && metrics.pendingTasks > metrics.inProgressTasks * 2) {
      phase = 'analisis-diseno'
      confidence = 75
      status = 'en-progreso'
      progress = metrics.completionRate * 2
      reasons.push(`${metrics.completionRate.toFixed(0)}% de tareas completadas`)
      reasons.push(`${metrics.pendingTasks} tareas pendientes vs ${metrics.inProgressTasks} en progreso`)
      return { phase, reasons, confidence, status, progress }
    }

    // REGLA 3: Desarrollo
    // Actividad significativa pero < 80% completitud
    const activeRate = ((metrics.inProgressTasks + metrics.completedTasks) / Math.max(metrics.totalTasks, 1)) * 100
    if (activeRate >= 30 && metrics.completionRate < 80 && !hasTestingTasks) {
      phase = 'desarrollo'
      confidence = 85
      status = 'en-progreso'
      progress = Math.min(100, (metrics.completionRate / 0.8) * 100)
      reasons.push(`${activeRate.toFixed(0)}% de tareas activas (en progreso o completadas)`)
      reasons.push(`${metrics.completionRate.toFixed(0)}% de completitud total`)
      if (metrics.inProgressTasks > 0) {
        reasons.push(`${metrics.inProgressTasks} tarea(s) actualmente en progreso`)
      }
      return { phase, reasons, confidence, status, progress }
    }

    // REGLA 4: Pruebas
    // Alta completitud O tareas de testing detectadas
    if (metrics.completionRate >= 80 || (hasTestingTasks && metrics.completionRate >= 60)) {
      phase = 'pruebas'
      confidence = 80
      status = 'en-progreso'
      progress = Math.min(100, ((metrics.completionRate - 80) / 20) * 100)
      reasons.push(`${metrics.completionRate.toFixed(0)}% de tareas completadas`)
      if (hasTestingTasks) {
        reasons.push('Tareas de testing detectadas')
      }
      if (metrics.highPriorityTotal > 0) {
        const criticalRate = (metrics.highPriorityCompleted / metrics.highPriorityTotal) * 100
        reasons.push(`${criticalRate.toFixed(0)}% de tareas críticas completadas`)
      }
      return { phase, reasons, confidence, status, progress }
    }

    // REGLA 5: Despliegue
    // Todas las críticas completadas Y alta completitud
    const allCriticalDone = metrics.highPriorityTotal > 0 && 
      metrics.highPriorityCompleted === metrics.highPriorityTotal
    
    if ((allCriticalDone && metrics.completionRate >= 90) || hasDeployTasks) {
      phase = 'despliegue'
      confidence = 85
      status = 'en-progreso'
      progress = metrics.completionRate >= 95 ? 100 : 75
      reasons.push('Todas las tareas críticas completadas')
      reasons.push(`${metrics.completionRate.toFixed(0)}% de completitud total`)
      if (hasDeployTasks) {
        reasons.push('Tareas de despliegue detectadas')
      }
      return { phase, reasons, confidence, status, progress }
    }

    // REGLA 6: Mantenimiento
    // Alta completitud Y nuevas tareas post-completitud
    const recentTasks = tasks.filter(t => {
      const created = new Date(t.createdAt).getTime()
      const completedTasks = tasks.filter(tt => tt.status === 'hecha')
      if (completedTasks.length === 0) return false
      const lastCompletion = Math.max(...completedTasks.map(tt => new Date(tt.updatedAt).getTime()))
      return created > lastCompletion
    })

    if (metrics.completionRate >= 95 && recentTasks.length > 0) {
      phase = 'mantenimiento'
      confidence = 75
      status = 'en-progreso'
      progress = 100
      reasons.push(`${metrics.completionRate.toFixed(0)}% de completitud`)
      reasons.push(`${recentTasks.length} nueva(s) tarea(s) creada(s) después de completitud`)
      return { phase, reasons, confidence, status, progress }
    }

    // REGLA 7: Finalizado
    if (metrics.completionRate === 100 && metrics.pendingTasks === 0) {
      phase = 'finalizado'
      confidence = 95
      status = 'completada'
      progress = 100
      reasons.push('Todas las tareas completadas')
      reasons.push('No hay tareas pendientes')
      return { phase, reasons, confidence, status, progress }
    }

    // Default: Desarrollo si hay actividad
    if (metrics.inProgressTasks > 0 || metrics.completedTasks > 0) {
      phase = 'desarrollo'
      confidence = 60
      status = 'en-progreso'
      progress = metrics.completionRate
      reasons.push('Actividad detectada en el proyecto')
      if (metrics.inProgressTasks > 0) {
        reasons.push(`${metrics.inProgressTasks} tarea(s) en progreso`)
      }
      return { phase, reasons, confidence, status, progress }
    }

    // Default: Planeación
    return { 
      phase: 'planeacion', 
      reasons: ['Proyecto en etapa inicial'], 
      confidence: 70, 
      status: 'en-progreso',
      progress: 10
    }
  }

  /**
   * Determina la salud del proyecto
   */
  private static determineHealth(tasks: Task[], metrics: ProjectMetrics): ProjectHealth {
    // Tareas críticas vencidas = retrasado
    const criticalOverdue = tasks.filter(t => {
      if (t.priority !== 'alta' || !t.dueDate || t.status === 'hecha') return false
      return new Date(t.dueDate) < new Date()
    })

    if (criticalOverdue.length > 0) {
      return 'atrasado'
    }

    // Tareas vencidas o bajo progreso = en riesgo
    if (metrics.overdueTasks > 0 || (metrics.completionRate < 30 && metrics.daysSinceStart > 14)) {
      return 'en-riesgo'
    }

    return 'en-tiempo'
  }

  /**
   * Calcula el progreso del proyecto
   */
  private static calculateProgress(
    tasks: Task[],
    metrics: ProjectMetrics,
    currentPhase: LifecyclePhase
  ): { overall: number; phase: number; trend: 'up' | 'stable' | 'down' | 'at-risk' } {
    const overall = metrics.completionRate

    // Progreso dentro de la fase
    let phase = 0
    switch (currentPhase) {
      case 'planeacion':
        phase = Math.min(100, (metrics.totalTasks / 10) * 100)
        break
      case 'analisis-diseno':
        phase = Math.min(100, (metrics.completionRate / 0.2) * 100)
        break
      case 'desarrollo':
        phase = Math.min(100, (metrics.completionRate / 0.8) * 100)
        break
      case 'pruebas':
        phase = Math.min(100, ((metrics.completionRate - 80) / 20) * 100)
        break
      case 'despliegue':
        phase = metrics.completionRate >= 90 ? 100 : 75
        break
      case 'mantenimiento':
      case 'finalizado':
        phase = 100
        break
    }

    // Determinar tendencia
    let trend: 'up' | 'stable' | 'down' | 'at-risk' = 'stable'
    
    if (metrics.overdueTasks > 0) {
      trend = 'down'
    } else if (metrics.recentActivity >= metrics.totalTasks * 0.2) {
      trend = 'up'
    } else if (metrics.inProgressTasks === 0 && metrics.pendingTasks > 0) {
      trend = 'at-risk'
    }

    return {
      overall: Math.round(overall),
      phase: Math.round(phase),
      trend,
    }
  }

  /**
   * Detecta usuarios activos actualmente
   */
  private static detectActiveUsers(project: Project, tasks: Task[]): ActivityInfo[] {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const activeUsersMap = new Map<string, ActivityInfo>()

    // Analizar tareas en progreso
    const inProgressTasks = tasks.filter(t => t.status === 'en-progreso')
    
    inProgressTasks.forEach(task => {
      task.assignees.forEach(assignee => {
        const lastUpdate = new Date(task.updatedAt)
        const status: 'active' | 'recent' | 'idle' = 
          lastUpdate > oneHourAgo ? 'active' :
          lastUpdate > oneDayAgo ? 'recent' :
          'idle'

        // Determinar fase de la tarea
        const taskPhase = this.inferTaskPhase(task, tasks)

        const activity: ActivityInfo = {
          user: assignee,
          task,
          phase: taskPhase,
          lastActivity: lastUpdate,
          status,
        }

        // Mantener solo la actividad más reciente por usuario
        const existing = activeUsersMap.get(assignee.id)
        if (!existing || lastUpdate > existing.lastActivity) {
          activeUsersMap.set(assignee.id, activity)
        }
      })
    })

    return Array.from(activeUsersMap.values())
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
  }

  /**
   * Infiere la fase de una tarea basándose en su contenido
   */
  private static inferTaskPhase(task: Task, allTasks: Task[]): LifecyclePhase {
    const title = task.title.toLowerCase()
    const desc = task.description.toLowerCase()

    if (title.includes('test') || title.includes('prueba') || desc.includes('test') || desc.includes('prueba')) {
      return 'pruebas'
    }
    if (title.includes('deploy') || title.includes('despliegue') || desc.includes('deploy') || desc.includes('despliegue')) {
      return 'despliegue'
    }
    if (title.includes('diseño') || title.includes('análisis') || desc.includes('diseño') || desc.includes('análisis')) {
      return 'analisis-diseno'
    }

    // Por defecto, usar la fase del proyecto
    return 'desarrollo'
  }

  /**
   * Estima la fecha de despliegue
   */
  private static estimateDeployment(
    project: Project,
    tasks: Task[],
    currentPhase: LifecyclePhase,
    progress: { overall: number; phase: number; trend: string }
  ): Date | null {
    // Si estamos en despliegue o más avanzado
    if (['despliegue', 'mantenimiento', 'finalizado'].includes(currentPhase)) {
      const pendingTasks = tasks.filter(t => t.status !== 'hecha' && t.dueDate)
      if (pendingTasks.length > 0) {
        const dates = pendingTasks.map(t => new Date(t.dueDate!).getTime())
        return new Date(Math.max(...dates))
      }
    }

    // Calcular basándose en velocidad
    const completedTasks = tasks.filter(t => t.status === 'hecha')
    if (completedTasks.length === 0) return null

    const avgCompletionTime = completedTasks.reduce((sum, t) => {
      const created = new Date(t.createdAt).getTime()
      const updated = new Date(t.updatedAt).getTime()
      return sum + (updated - created)
    }, 0) / completedTasks.length

    const pendingTasks = tasks.filter(t => t.status !== 'hecha')
    const estimatedTimeRemaining = pendingTasks.length * avgCompletionTime

    return new Date(Date.now() + estimatedTimeRemaining)
  }

  /**
   * Genera explicación clara del estado
   */
  private static generateExplanation(
    phaseAnalysis: { phase: LifecyclePhase; reasons: string[]; confidence: number },
    metrics: ProjectMetrics,
    health: ProjectHealth,
    progress: { overall: number; phase: number; trend: string }
  ): string {
    const phaseNames: Record<LifecyclePhase, string> = {
      planeacion: 'Planeación',
      'analisis-diseno': 'Análisis y Diseño',
      desarrollo: 'Desarrollo',
      pruebas: 'Pruebas',
      despliegue: 'Despliegue',
      mantenimiento: 'Mantenimiento',
      finalizado: 'Finalizado',
    }

    let explanation = `El proyecto está en la fase de **${phaseNames[phaseAnalysis.phase]}** `
    explanation += `(${phaseAnalysis.confidence}% de confianza). `

    if (phaseAnalysis.reasons.length > 0) {
      explanation += `Esta decisión se basa en: ${phaseAnalysis.reasons.join(', ')}. `
    }

    explanation += `El progreso global es del **${progress.overall}%** `
    explanation += `y el progreso dentro de la fase actual es del **${progress.phase}%**. `

    const healthText = health === 'en-tiempo' ? 'en tiempo' : health === 'en-riesgo' ? 'en riesgo' : 'atrasado'
    explanation += `El proyecto está **${healthText}**.`

    if (metrics.inProgressTasks > 0) {
      explanation += ` Actualmente hay ${metrics.inProgressTasks} tarea(s) en progreso.`
    }

    return explanation
  }
}
