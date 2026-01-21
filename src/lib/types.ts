export type UserRole = 'administrador' | 'lider' | 'desarrollador'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

export type TaskStatus = 'pendiente' | 'en-progreso' | 'hecha'
export type TaskPriority = 'baja' | 'media' | 'alta'

export interface Comment {
  id: string
  taskId: string
  author: User
  content: string
  createdAt: Date
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignees: User[]
  projectId: string
  comments: Comment[]
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  userId: string
  type: 'task_assigned' | 'comment_added'
  title: string
  message: string
  taskId?: string
  projectId?: string
  read: boolean
  createdAt: Date
}

export interface Project {
  id: string
  name: string
  description: string
  leader: User
  members: User[]
  tasks: Task[]
  createdAt: Date
}
