import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { Badge } from './Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'
import { projectsApi } from '@/lib/api/projects'
import { usersApi } from '@/lib/api/users'
import { useAppStore, type AppState } from '@/lib/store'
import type { Project, User } from '@/lib/types'
import { Users, UserPlus, UserMinus, Crown } from 'lucide-react'
import { canCreateOrEdit } from '@/lib/utils/permissions'

interface ProjectMembersManagerProps {
  project: Project
  onUpdate?: () => void
}

export function ProjectMembersManager({ project, onUpdate }: ProjectMembersManagerProps) {
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const currentUser = useAppStore((state: AppState) => state.currentUser)
  const loadData = useAppStore((state: AppState) => state.loadData)
  const canEdit = canCreateOrEdit(currentUser)
  
  // Verificar si el usuario es líder del proyecto
  const isLeader = currentUser?.id === project.leader.id
  const canManage = canEdit && (isLeader || currentUser?.role === 'administrador')

  useEffect(() => {
    if (canManage) {
      loadAllUsers()
    }
  }, [canManage])

  const loadAllUsers = async () => {
    setLoadingUsers(true)
    try {
      const users = await usersApi.getAll()
      // Filtrar usuarios que ya están en el proyecto
      const projectMemberIds = [
        project.leader.id,
        ...project.members.map(m => m.id)
      ]
      const availableUsers = users.filter(u => !projectMemberIds.includes(u.id))
      setAllUsers(availableUsers)
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err)
      setError('Error al cargar usuarios disponibles')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId) return

    setLoading(true)
    setError(null)

    try {
      await projectsApi.updateMembers(project.id, 'add', selectedUserId)
      setSelectedUserId('')
      await loadData() // Recargar datos del store
      if (onUpdate) {
        onUpdate()
      }
      await loadAllUsers() // Recargar lista de usuarios disponibles
    } catch (err: any) {
      console.error('Error al agregar miembro:', err)
      setError(err.message || 'Error al agregar miembro')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('¿Estás seguro de quitar a este miembro del proyecto? Sus tareas asignadas se reasignarán al líder del proyecto.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await projectsApi.updateMembers(project.id, 'remove', userId)
      await loadData() // Recargar datos del store
      if (onUpdate) {
        onUpdate()
      }
      await loadAllUsers() // Recargar lista de usuarios disponibles
    } catch (err: any) {
      console.error('Error al quitar miembro:', err)
      setError(err.message || 'Error al quitar miembro')
    } finally {
      setLoading(false)
    }
  }

  if (!canManage) {
    return null
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>Miembros del Proyecto</CardTitle>
        </div>
        <CardDescription>
          Gestiona los miembros del proyecto. Al quitar un miembro, sus tareas se reasignarán al líder.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Líder del proyecto */}
        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-500" />
            Líder del Proyecto
          </div>
          <div className="flex items-center justify-between p-3 bg-accent rounded-md">
            <div>
              <div className="font-medium">{project.leader.name}</div>
              <div className="text-sm text-muted-foreground">{project.leader.email}</div>
            </div>
            <Badge variant="outline">Líder</Badge>
          </div>
        </div>

        {/* Miembros */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Miembros ({project.members.length})</div>
          {project.members.length === 0 ? (
            <div className="text-sm text-muted-foreground p-3 bg-accent rounded-md text-center">
              No hay miembros en el proyecto
            </div>
          ) : (
            <div className="space-y-2">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-accent rounded-md"
                >
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">{member.email}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={loading}
                    className="text-destructive hover:text-destructive"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agregar nuevo miembro */}
        <div className="space-y-2 pt-4 border-t">
          <div className="text-sm font-medium">Agregar Miembro</div>
          {loadingUsers ? (
            <div className="text-sm text-muted-foreground">Cargando usuarios...</div>
          ) : (
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.length === 0 ? (
                    <SelectItem value="" disabled>
                      No hay usuarios disponibles
                    </SelectItem>
                  ) : (
                    allUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddMember}
                disabled={!selectedUserId || loading}
                size="sm"
              >
                <UserPlus className="h-4 w-4" />
                Agregar
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
