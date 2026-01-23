import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { Input } from './Input'
import { Label } from './Label'
import { useAppStore, type AppState } from '@/lib/store'
import { authApi } from '@/lib/api/auth'
import { User, Mail, Lock, Save, Eye, EyeOff, Upload, X } from 'lucide-react'

export function ProfilePage() {
  const currentUser = useAppStore((state: AppState) => state.currentUser)
  const setCurrentUser = useAppStore((state: AppState) => state.setCurrentUser)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name)
      setEmail(currentUser.email)
      setAvatar(currentUser.avatar || '')
      setAvatarPreview(currentUser.avatar || null)
    }
  }, [currentUser])
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen')
      return
    }
    
    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen debe ser menor a 2MB')
      return
    }
    
    setUploadingAvatar(true)
    setError(null)
    
    try {
      // Convertir a base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string
          
          // Subir avatar
          const updatedUser = await authApi.uploadAvatar(base64String)
          
          // Actualizar store
          setCurrentUser(updatedUser)
          
          // Actualizar estados locales
          setAvatar(base64String)
          setAvatarPreview(base64String)
          
          setSuccess('Avatar actualizado correctamente')
          setTimeout(() => setSuccess(null), 3000)
        } catch (err: any) {
          setError(err.message || 'Error al subir avatar')
        } finally {
          setUploadingAvatar(false)
        }
      }
      reader.onerror = () => {
        setError('Error al leer el archivo')
        setUploadingAvatar(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setError(err.message || 'Error al procesar la imagen')
      setUploadingAvatar(false)
    }
  }
  
  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true)
      setError(null)
      
      // Subir string vacío para eliminar avatar
      const updatedUser = await authApi.uploadAvatar('')
      
      // Actualizar store
      setCurrentUser(updatedUser)
      
      // Actualizar estados locales
      setAvatar('')
      setAvatarPreview(null)
      
      setSuccess('Avatar eliminado correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al eliminar avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    
    try {
      // Validar contraseñas si se están cambiando
      if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          setError('Todos los campos de contraseña son requeridos para cambiar la contraseña')
          setLoading(false)
          return
        }
        
        if (newPassword.length < 6) {
          setError('La nueva contraseña debe tener al menos 6 caracteres')
          setLoading(false)
          return
        }
        
        if (newPassword !== confirmPassword) {
          setError('Las contraseñas no coinciden')
          setLoading(false)
          return
        }
      }
      
      // Preparar datos de actualización
      const updateData: {
        name?: string
        email?: string
        currentPassword?: string
        newPassword?: string
      } = {
        name,
        email,
      }
      
      if (currentPassword && newPassword) {
        updateData.currentPassword = currentPassword
        updateData.newPassword = newPassword
      }
      
      // Actualizar perfil
      const updatedUser = await authApi.updateProfile(updateData)
      
      // Actualizar store
      setCurrentUser(updatedUser)
      
      // Limpiar campos de contraseña
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      setSuccess('Perfil actualizado correctamente')
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil')
    } finally {
      setLoading(false)
    }
  }
  
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Cargando perfil...</div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground">Administra tu información personal y configuración</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Tu nombre completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar</Label>
              <div className="flex items-center gap-4">
                {/* Preview del avatar */}
                <div className="relative">
                  {avatarPreview ? (
                    <div className="relative">
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="h-20 w-20 rounded-full object-cover border-2 border-border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                      <User className="h-10 w-10 text-primary/50" />
                    </div>
                  )}
                </div>
                
                {/* Botón para subir */}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadingAvatar ? 'Subiendo...' : avatarPreview ? 'Cambiar imagen' : 'Subir imagen'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 2MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Cambio de Contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>
              Deja estos campos vacíos si no deseas cambiar tu contraseña
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu nueva contraseña"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Mensajes de Error y Éxito */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400">
            {success}
          </div>
        )}
        
        {/* Botón de Guardar */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}
