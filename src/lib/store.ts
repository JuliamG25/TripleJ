import { create } from 'zustand'
import { shallow } from 'zustand/shallow'
import type { User, Project, Task, TaskStatus, Comment, Notification } from './types'
import { projectsApi } from './api/projects'
import { tasksApi } from './api/tasks'
import { commentsApi } from './api/comments'
import { notificationsApi } from './api/notifications'
import { authApi } from './api/auth'

export interface AppState {
  // Estado
  currentUser: User | null
  projects: Project[]
  tasks: Task[]
  notifications: Notification[]
  unreadNotificationsCount: number
  selectedProject: Project | null
  loading: boolean
  error: string | null

  // Acciones
  setCurrentUser: (user: User | null) => void
  setSelectedProject: (project: Project | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Acciones de datos
  loadData: () => Promise<void>
  loadNotifications: () => Promise<void>
  markNotificationAsRead: (notificationId: string) => Promise<void>
  markAllNotificationsAsRead: () => Promise<void>
  createProject: (data: { name: string; description: string; members?: string[] }) => Promise<Project>
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>
  updateTask: (taskId: string, data: Partial<Task>) => Promise<Task>
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => Promise<Task>
  addComment: (taskId: string, content: string) => Promise<Comment>
  
  // Computed
  getProjectsWithTasks: () => Project[]
}

export const useAppStore = create<AppState>((set, get) => ({
  // Estado inicial
  currentUser: null,
  projects: [],
  tasks: [],
  notifications: [],
  unreadNotificationsCount: 0,
  selectedProject: null,
  loading: true,
  error: null,

  // Setters básicos
  setCurrentUser: (user) => set({ currentUser: user }),
  setSelectedProject: (project) => set({ selectedProject: project }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Cargar datos
  loadData: async () => {
    try {
      console.log('🔄 [Store] Iniciando carga de datos...')
      set({ loading: true, error: null })
      
          // Cargar usuario actual
          const storedUser = authApi.getStoredUser()
          console.log('👤 [Store] Usuario almacenado:', storedUser ? storedUser.email : 'No encontrado')
          if (storedUser) {
            // Asegurar que el ID sea string
            const user = {
              ...storedUser,
              id: String(storedUser.id)
            }
            console.log('👤 [Store] Usuario configurado:', {
              id: user.id,
              email: user.email,
              role: user.role,
              idType: typeof user.id
            })
            set({ currentUser: user })
          }

      // Verificar autenticación
      if (!authApi.isAuthenticated()) {
        console.warn('⚠️ [Store] No hay token de autenticación')
        set({ 
          error: 'No autenticado. Por favor inicia sesión.',
          loading: false 
        })
        if (typeof window !== 'undefined') {
          setTimeout(() => authApi.logout(), 2000)
        }
        return
      }

      console.log('📡 [Store] Cargando proyectos y tareas...')
      
      // Cargar proyectos, tareas y notificaciones con timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: La solicitud tardó demasiado. Verifica que el servidor esté corriendo.')), 8000)
      )

      const [projectsData, tasksData] = await Promise.race([
        Promise.all([
          projectsApi.getAll().catch(err => {
            console.error('❌ [Store] Error al cargar proyectos:', err)
            throw err
          }),
          tasksApi.getAll().catch(err => {
            console.error('❌ [Store] Error al cargar tareas:', err)
            throw err
          }),
        ]),
        timeoutPromise,
      ]) as [Project[], Task[]]

      // Cargar notificaciones en paralelo (no crítico si falla)
      // Se carga después de definir todas las funciones usando setTimeout
      // para evitar problemas de referencia circular
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          const loadNotificationsFn = get().loadNotifications
          if (loadNotificationsFn) {
            loadNotificationsFn().catch(err => {
              console.warn('⚠️ [Store] Error al cargar notificaciones:', err)
            })
          }
        }, 100)
      }

      console.log('✅ [Store] Datos cargados:', { projects: projectsData.length, tasks: tasksData.length })
      
      set({
        projects: projectsData,
        tasks: tasksData,
        error: null,
        loading: false,
      })
      
      console.log('✅ [Store] Estado actualizado, loading=false')
    } catch (error: any) {
      console.error('❌ [Store] Error al cargar datos:', error)
      
      const errorMessage = error.message || 'Error al cargar los datos. Verifica que MongoDB esté corriendo y que el servidor esté activo.'
      
      set({
        error: errorMessage,
        projects: [],
        tasks: [],
        loading: false,
      })
      
      // Si es error de autenticación, redirigir a login
      if (error.message?.includes('No autenticado') || error.message?.includes('401')) {
        console.warn('🔒 [Store] Error de autenticación, redirigiendo...')
        if (typeof window !== 'undefined') {
          setTimeout(() => authApi.logout(), 1000)
        }
      }
    }
  },

  // Crear proyecto
  createProject: async (data: { name: string; description: string; members?: string[] }) => {
    try {
      const newProject = await projectsApi.create(data)
      set((state) => ({
        projects: [...state.projects, newProject]
      }))
      return newProject
    } catch (error) {
      console.error('Error al crear proyecto:', error)
      throw error
    }
  },

  // Actualizar proyecto (para refrescar después de cambios en miembros)
  updateProject: async (projectId: string) => {
    try {
      const updatedProject = await projectsApi.getById(projectId)
      set((state) => ({
        projects: state.projects.map(p => p.id === projectId ? updatedProject : p)
      }))
      return updatedProject
    } catch (error) {
      console.error('Error al actualizar proyecto:', error)
      throw error
    }
  },

  // Actualizar estado de tarea
  updateTaskStatus: async (taskId: string, status: TaskStatus) => {
    try {
      const updatedTask = await tasksApi.update(taskId, { status })
      set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? updatedTask : task
        )
      }))
    } catch (error) {
      console.error('Error al actualizar tarea:', error)
      throw error
    }
  },

  // Actualizar tarea completa
  updateTask: async (taskId: string, data: Partial<Task>) => {
    try {
      const updateData: any = {}
      
      if (data.title) updateData.title = data.title
      if (data.description) updateData.description = data.description
      if (data.status) updateData.status = data.status
      if (data.priority) updateData.priority = data.priority
      if (data.assignees) {
        updateData.assignees = Array.isArray(data.assignees)
          ? data.assignees.map(a => typeof a === 'string' ? a : a.id)
          : []
      }
      if (data.projectId) updateData.projectId = data.projectId
      
      const updatedTask = await tasksApi.update(taskId, updateData)
      set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? updatedTask : task
        )
      }))
      return updatedTask
    } catch (error) {
      console.error('Error al actualizar tarea:', error)
      throw error
    }
  },

  // Agregar tarea
  addTask: async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => {
    try {
      const assignees = Array.isArray(taskData.assignees)
        ? taskData.assignees.map(a => typeof a === 'string' ? a : a.id)
        : []
      
      const newTask = await tasksApi.create({
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        assignees: assignees.length > 0 ? assignees : undefined,
        projectId: taskData.projectId,
      })
      
      console.log('✅ [Store] Tarea creada y agregada al store:', {
        taskId: newTask.id,
        title: newTask.title,
        assigneesCount: newTask.assignees.length,
        assignees: newTask.assignees.map(a => ({ id: a.id, name: a.name }))
      })
      
      set((state) => ({
        tasks: [...state.tasks, newTask]
      }))
      return newTask
    } catch (error) {
      console.error('Error al crear tarea:', error)
      throw error
    }
  },

  // Agregar comentario
  addComment: async (taskId: string, content: string): Promise<Comment> => {
    const { currentUser } = get()
    if (!currentUser) {
      throw new Error('Usuario no autenticado')
    }
    
    try {
      const newComment = await commentsApi.create({ taskId, content })
      set((state) => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, comments: [...task.comments, newComment], updatedAt: new Date() }
            : task
        )
      }))
      return newComment
    } catch (error) {
      console.error('Error al crear comentario:', error)
      throw error
    }
  },

  // Cargar notificaciones
  loadNotifications: async () => {
    try {
      const { notifications, unreadCount } = await notificationsApi.getAll()
      set({
        notifications,
        unreadNotificationsCount: unreadCount,
      })
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
      // No lanzar error, solo loguear
    }
  },

  // Marcar notificación como leída
  markNotificationAsRead: async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId)
      set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadNotificationsCount: Math.max(0, state.unreadNotificationsCount - 1),
      }))
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error)
      throw error
    }
  },

  // Marcar todas las notificaciones como leídas
  markAllNotificationsAsRead: async () => {
    try {
      await notificationsApi.markAllAsRead()
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadNotificationsCount: 0,
      }))
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error)
      throw error
    }
  },

  // Computed: proyectos con tareas (ya no se usa, se calcula en componentes)
  getProjectsWithTasks: () => {
    const { projects, tasks } = get()
    return projects.map(project => ({
      ...project,
      tasks: tasks.filter(t => t.projectId === project.id),
    }))
  },
}))

// Hook helper para obtener proyectos con tareas
export const useProjectsWithTasks = () => {
  const projects = useAppStore((state) => state.projects)
  const tasks = useAppStore((state) => state.tasks)
  
  return projects.map(project => ({
    ...project,
    tasks: tasks.filter(t => t.projectId === project.id),
  }))
}
