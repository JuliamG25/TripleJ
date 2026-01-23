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
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  userId: string
  type: 'task_assigned' | 'comment_added' | 'task_overdue' | 'task_updated'
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

export type MeetingType = 'presencial' | 'virtual'
export type MeetingStatus = 'programada' | 'en-curso' | 'completada' | 'cancelada'

export interface Meeting {
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  type: MeetingType
  meetLink?: string
  projectId: string
  participants: User[]
  createdBy: User
  status: MeetingStatus
  location?: string
  createdAt: Date
  updatedAt: Date
}
