import React, { useState } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { Label } from './Label'
import { Card, CardContent } from './Card'
import { Loader2, Eye, EyeOff, Shield, Users, Code, AlertCircle } from 'lucide-react'
import type { UserRole } from '@/lib/types'
import { authApi } from '@/lib/api/auth'

const roleInfo = {
  administrador: {
    icon: Shield,
    label: 'Administrador',
    description: 'Acceso completo al sistema',
  },
  lider: {
    icon: Users,
    label: 'Líder de Proyecto',
    description: 'Gestión de proyectos y equipos',
  },
  desarrollador: {
    icon: Code,
    label: 'Desarrollador',
    description: 'Ejecución de tareas asignadas',
  },
}

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos')
      return
    }

    setIsLoading(true)

    try {
      await authApi.login({
        email: formData.email,
        password: formData.password,
      })
      
      // Redirigir al dashboard
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.')
      setIsLoading(false)
    }
  }

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    // Prellenar con credenciales de demo según el rol
    const demoCredentials: Record<UserRole, { email: string; password: string }> = {
      administrador: {
        email: 'carlos.rodriguez@fesc.edu.co',
        password: 'demo123',
      },
      lider: {
        email: 'maria.garcia@fesc.edu.co',
        password: 'demo123',
      },
      desarrollador: {
        email: 'juan.perez@fesc.edu.co',
        password: 'demo123',
      },
    }
    
    const credentials = demoCredentials[role]
    if (credentials) {
      setFormData(credentials)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role Selection */}
      <div className="space-y-3">
        <Label className="text-foreground">Selecciona tu rol</Label>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(roleInfo) as [UserRole, typeof roleInfo.administrador][]).map(([role, info]) => {
            const Icon = info.icon
            const isSelected = selectedRole === role
            return (
              <Card
                key={role}
                className={`cursor-pointer transition-all hover:border-primary ${
                  isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'
                }`}
                onClick={() => handleRoleSelect(role)}
              >
                <CardContent className="p-4 text-center">
                  <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {info.label}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
        {selectedRole && (
          <p className="text-sm text-muted-foreground text-center">
            {roleInfo[selectedRole].description}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          placeholder="usuario@fesc.edu.co"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
          className="bg-background border-input"
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Ingresa tu contraseña"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
            className="bg-background border-input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-primary hover:bg-fesc-hover text-primary-foreground"
        disabled={isLoading || !formData.email || !formData.password}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          'Iniciar Sesión'
        )}
      </Button>

      {/* Demo Notice */}
      {selectedRole && (
        <div className="rounded-lg bg-secondary/50 p-4 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            <strong className="text-foreground">Modo Demo:</strong> Las credenciales se han prellenado. Haz clic en Iniciar Sesión.
          </p>
        </div>
      )}
    </form>
  )
}
