import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { Input } from './Input'
import { Label } from './Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'
import { Badge } from './Badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './Dialog'
import { useAppStore, type AppState } from '@/lib/store'
import { usersApi } from '@/lib/api/users'
import { canCreateUsers, getVisibleRoles, canCreateRole } from '@/lib/utils/permissions'
import { Users, UserPlus, Mail, Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import type { User as UserType, UserRole } from '@/lib/types'

const roleLabels = {
  administrador: 'Administrador',
  lider: 'Líder',
  desarrollador: 'Desarrollador',
}

const roleColors = {
  administrador: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  lider: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  desarrollador: 'bg-green-500/10 text-green-500 border-green-500/20',
}

export function UsersPage() {
  const currentUser = useAppStore((state: AppState) => state.currentUser)
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'desarrollador' as UserRole,
  })
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Obtener roles visibles según el usuario actual
  const visibleRoles = currentUser ? getVisibleRoles(currentUser) : []
  const canCreate = currentUser ? canCreateUsers(currentUser) : false

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const allUsers = await usersApi.getAll()
      setUsers(allUsers)
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios')
      console.error('Error al cargar usuarios:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Todos los campos son requeridos')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      setCreating(true)
      setError(null)
      
      await usersApi.create({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })

      // Limpiar formulario y cerrar diálogo
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'desarrollador',
      })
      setCreateDialogOpen(false)
      
      // Recargar usuarios
      await loadUsers()
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario')
      console.error('Error al crear usuario:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleEditClick = (user: UserType) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // No mostrar contraseña
      role: user.role,
    })
    setError(null)
    setEditDialogOpen(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUser) return

    if (!formData.name || !formData.email) {
      setError('Nombre y email son requeridos')
      return
    }

    if (formData.password && formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      setUpdating(true)
      setError(null)
      
      const updateData: any = {
        name: formData.name,
        email: formData.email,
      }

      // Solo incluir contraseña si se proporcionó una nueva
      if (formData.password) {
        updateData.password = formData.password
      }

      // Solo incluir rol si el usuario tiene permisos y cambió
      if (currentUser?.role === 'administrador' && formData.role !== selectedUser.role) {
        updateData.role = formData.role
      }

      await usersApi.update(selectedUser.id, updateData)

      // Limpiar y cerrar diálogo
      setSelectedUser(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'desarrollador',
      })
      setEditDialogOpen(false)
      
      // Recargar usuarios
      await loadUsers()
    } catch (err: any) {
      setError(err.message || 'Error al actualizar usuario')
      console.error('Error al actualizar usuario:', err)
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteClick = (user: UserType) => {
    setSelectedUser(user)
    setError(null)
    setDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setDeleting(true)
      setError(null)
      
      await usersApi.delete(selectedUser.id)

      // Cerrar diálogo y limpiar
      setSelectedUser(null)
      setDeleteDialogOpen(false)
      
      // Recargar usuarios
      await loadUsers()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario')
      console.error('Error al eliminar usuario:', err)
    } finally {
      setDeleting(false)
    }
  }

  const canEditUser = (user: UserType): boolean => {
    if (!currentUser) return false
    // No puedes editar tu propio usuario desde aquí
    if (user.id === currentUser.id) return false
    // Administrador puede editar cualquier usuario
    if (currentUser.role === 'administrador') return true
    // Líder solo puede editar desarrolladores
    if (currentUser.role === 'lider' && user.role === 'desarrollador') return true
    return false
  }

  const canDeleteUser = (user: UserType): boolean => {
    if (!currentUser) return false
    // No puedes eliminar tu propio usuario
    if (user.id === currentUser.id) return false
    // Administrador puede eliminar cualquier usuario
    if (currentUser.role === 'administrador') return true
    // Líder solo puede eliminar desarrolladores
    if (currentUser.role === 'lider' && user.role === 'desarrollador') return true
    return false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Verificar permisos
  if (!canCreate && visibleRoles.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Acceso Restringido</CardTitle>
            <CardDescription className="text-center">
              No tienes permisos para gestionar usuarios.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Filtrar usuarios según roles visibles
  const filteredUsers = users.filter(user => visibleRoles.includes(user.role))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            {currentUser?.role === 'administrador' 
              ? 'Administra todos los usuarios del sistema'
              : 'Gestiona los desarrolladores de tus proyectos'}
          </p>
        </div>
        {canCreate && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Crear Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  {currentUser?.role === 'administrador'
                    ? 'Crea un nuevo usuario (administrador, líder o desarrollador)'
                    : 'Crea un nuevo desarrollador'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@ejemplo.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>

                {currentUser?.role === 'administrador' && (
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                    >
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="administrador">Administrador</SelectItem>
                        <SelectItem value="lider">Líder</SelectItem>
                        <SelectItem value="desarrollador">Desarrollador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCreateDialogOpen(false)
                      setFormData({
                        name: '',
                        email: '',
                        password: '',
                        role: 'desarrollador',
                      })
                      setError(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Crear Usuario
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && !createDialogOpen && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            {currentUser?.role === 'administrador'
              ? 'Todos los usuarios del sistema'
              : 'Desarrolladores disponibles'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay usuarios disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.name}</p>
                        <Badge
                          variant="outline"
                          className={roleColors[user.role]}
                        >
                          {roleLabels[user.role]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEditUser(user) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(user)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteUser(user) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(user)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Actualiza la información del usuario
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Dejar vacío para no cambiar"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Deja vacío si no deseas cambiar la contraseña
              </p>
            </div>

            {currentUser?.role === 'administrador' && selectedUser && (
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="lider">Líder</SelectItem>
                    <SelectItem value="desarrollador">Desarrollador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false)
                  setSelectedUser(null)
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    role: 'desarrollador',
                  })
                  setError(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Actualizar Usuario
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{selectedUser?.name}</strong>?
              <br />
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedUser(null)
                setError(null)
              }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Usuario
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
