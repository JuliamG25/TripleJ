import { useState, useEffect } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { Label } from './Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './Dialog'
import { useAppStore, type AppState } from '@/lib/store'
import { projectsApi } from '@/lib/api/projects'
import { usersApi } from '@/lib/api/users'
import { Pencil, X, Loader2 } from 'lucide-react'
import type { Project, User } from '@/lib/types'

interface EditProjectFormProps {
  project: Project
  onSuccess?: () => void
}

export function EditProjectForm({ project, onSuccess }: EditProjectFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [leaderId, setLeaderId] = useState<string>('')
  const [members, setMembers] = useState<string[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [availableLeaders, setAvailableLeaders] = useState<User[]>([])
  
  const currentUser = useAppStore((state: AppState) => state.currentUser)
  const loadData = useAppStore((state: AppState) => state.loadData)

  const isAdmin = currentUser?.role === 'administrador'
  const canEditLeader = isAdmin

  useEffect(() => {
    if (isOpen) {
      // Cargar datos del proyecto
      setName(project.name)
      setDescription(project.description)
      setLeaderId(project.leader.id)
      setMembers(project.members.map(m => m.email))
      setError(null)

      // Cargar usuarios disponibles
      loadUsers()
    }
  }, [isOpen, project])

  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      const users = await usersApi.getAll()
      setAvailableUsers(users)
      
      // Para líderes, solo mostrar líderes y administradores
      if (isAdmin) {
        const leaders = users.filter(u => u.role === 'lider' || u.role === 'administrador')
        setAvailableLeaders(leaders)
      } else {
        setAvailableLeaders([])
      }
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Convertir emails de miembros a IDs
      const memberIds = members
        .map(email => availableUsers.find(u => u.email === email)?.id)
        .filter((id): id is string => !!id)

      const updateData: any = {
        name,
        description,
        members: memberIds,
      }

      // Solo incluir líder si es administrador y cambió
      if (canEditLeader && leaderId && leaderId !== project.leader.id) {
        updateData.leader = leaderId
      }

      await projectsApi.update(project.id, updateData)
      
      // Recargar datos en el store
      await loadData()
      
      // Reset form
      setIsOpen(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar proyecto')
    } finally {
      setLoading(false)
    }
  }

  const addMember = () => {
    if (newMemberEmail.trim() && !members.includes(newMemberEmail.trim())) {
      setMembers([...members, newMemberEmail.trim()])
      setNewMemberEmail('')
    }
  }

  const removeMember = (email: string) => {
    setMembers(members.filter(m => m !== email))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Proyecto</DialogTitle>
          <DialogDescription>
            Actualiza la información del proyecto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre del Proyecto</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sistema de Gestión Académica"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descripción</Label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el proyecto..."
              className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
              required
            />
          </div>

          {canEditLeader && (
            <div className="space-y-2">
              <Label htmlFor="edit-leader">Líder del Proyecto</Label>
              {loadingUsers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando líderes...
                </div>
              ) : (
                <Select value={leaderId} onValueChange={setLeaderId}>
                  <SelectTrigger id="edit-leader">
                    <SelectValue placeholder="Seleccionar líder" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLeaders.map((leader) => (
                      <SelectItem key={leader.id} value={leader.id}>
                        {leader.name} ({leader.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Miembros</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addMember()
                  }
                }}
              />
              <Button type="button" onClick={addMember} variant="outline">
                Agregar
              </Button>
            </div>
            {members.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {members.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => removeMember(email)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  Actualizar Proyecto
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
