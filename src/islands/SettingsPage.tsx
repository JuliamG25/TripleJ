import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { Label } from './Label'
import { Switch } from './Switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'
import { useAppStore, type AppState } from '@/lib/store'
import { Settings, Bell, Moon, Sun, Globe, Palette, Mail } from 'lucide-react'
import { apiClient } from '@/lib/api/client'

export function SettingsPage() {
  const currentUser = useAppStore((state: AppState) => state.currentUser)
  
  // Preferencias de notificaciones
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [taskAssignedNotifications, setTaskAssignedNotifications] = useState(true)
  const [taskUpdatedNotifications, setTaskUpdatedNotifications] = useState(true)
  const [commentNotifications, setCommentNotifications] = useState(true)
  const [overdueNotifications, setOverdueNotifications] = useState(true)
  
  // Preferencias de visualización
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [language, setLanguage] = useState<'es' | 'en'>('es')
  const [compactView, setCompactView] = useState(false)
  
  // Cargar preferencias guardadas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Cargar preferencias desde localStorage
      const savedTheme = localStorage.getItem('fesc-theme') as 'light' | 'dark' | 'system' | null
      const savedLanguage = localStorage.getItem('fesc-language') as 'es' | 'en' | null
      const savedCompactView = localStorage.getItem('fesc-compact-view') === 'true'
      
      const savedEmailNotifications = localStorage.getItem('fesc-email-notifications') !== 'false'
      const savedTaskAssigned = localStorage.getItem('fesc-task-assigned-notifications') !== 'false'
      const savedTaskUpdated = localStorage.getItem('fesc-task-updated-notifications') !== 'false'
      const savedComments = localStorage.getItem('fesc-comment-notifications') !== 'false'
      const savedOverdue = localStorage.getItem('fesc-overdue-notifications') !== 'false'
      
      if (savedTheme) setTheme(savedTheme)
      if (savedLanguage) setLanguage(savedLanguage)
      setCompactView(savedCompactView)
      setEmailNotifications(savedEmailNotifications)
      setTaskAssignedNotifications(savedTaskAssigned)
      setTaskUpdatedNotifications(savedTaskUpdated)
      setCommentNotifications(savedComments)
      setOverdueNotifications(savedOverdue)
    }
  }, [])
  
  // Aplicar tema
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
    
    localStorage.setItem('fesc-theme', theme)
  }, [theme])
  
  const handleSave = () => {
    if (typeof window !== 'undefined') {
      // Guardar preferencias en localStorage
      localStorage.setItem('fesc-theme', theme)
      localStorage.setItem('fesc-language', language)
      localStorage.setItem('fesc-compact-view', compactView.toString())
      localStorage.setItem('fesc-email-notifications', emailNotifications.toString())
      localStorage.setItem('fesc-task-assigned-notifications', taskAssignedNotifications.toString())
      localStorage.setItem('fesc-task-updated-notifications', taskUpdatedNotifications.toString())
      localStorage.setItem('fesc-comment-notifications', commentNotifications.toString())
      localStorage.setItem('fesc-overdue-notifications', overdueNotifications.toString())
      
      // Redirigir al dashboard principal
      window.location.href = '/dashboard'
    }
  }
  
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Cargando configuración...</div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configuración
        </h1>
        <p className="text-muted-foreground">Personaliza tu experiencia en la plataforma</p>
      </div>
      
      {/* Preferencias de Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Configura qué tipos de notificaciones deseas recibir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Notificaciones por email</Label>
              <p className="text-xs text-muted-foreground">
                Recibir notificaciones por correo electrónico
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="task-assigned">Tareas asignadas</Label>
              <p className="text-xs text-muted-foreground">
                Notificaciones cuando te asignen una tarea
              </p>
            </div>
            <Switch
              id="task-assigned"
              checked={taskAssignedNotifications}
              onCheckedChange={setTaskAssignedNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="task-updated">Tareas actualizadas</Label>
              <p className="text-xs text-muted-foreground">
                Notificaciones cuando se actualice una tarea asignada
              </p>
            </div>
            <Switch
              id="task-updated"
              checked={taskUpdatedNotifications}
              onCheckedChange={setTaskUpdatedNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="comments">Comentarios</Label>
              <p className="text-xs text-muted-foreground">
                Notificaciones cuando alguien comente en tus tareas
              </p>
            </div>
            <Switch
              id="comments"
              checked={commentNotifications}
              onCheckedChange={setCommentNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="overdue">Tareas vencidas</Label>
              <p className="text-xs text-muted-foreground">
                Notificaciones sobre tareas vencidas
              </p>
            </div>
            <Switch
              id="overdue"
              checked={overdueNotifications}
              onCheckedChange={setOverdueNotifications}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Preferencias de Apariencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Apariencia
          </CardTitle>
          <CardDescription>
            Personaliza el aspecto de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Claro
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Oscuro
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Seguir sistema
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Elige entre tema claro, oscuro o seguir la configuración del sistema
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="language">Idioma</Label>
            <Select value={language} onValueChange={(value) => setLanguage(value as 'es' | 'en')}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Español
                  </div>
                </SelectItem>
                <SelectItem value="en">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    English
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Idioma de la interfaz (próximamente)
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-view">Vista compacta</Label>
              <p className="text-xs text-muted-foreground">
                Mostrar más información en menos espacio
              </p>
            </div>
            <Switch
              id="compact-view"
              checked={compactView}
              onCheckedChange={setCompactView}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Prueba de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Prueba de Email
          </CardTitle>
          <CardDescription>
            Envía un email de prueba para verificar la configuración SMTP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email de destino</Label>
              <input
                id="test-email"
                type="email"
                defaultValue="juliamsteven@gmail.com"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="email@ejemplo.com"
              />
            </div>
            <Button
              onClick={async () => {
                const emailInput = document.getElementById('test-email') as HTMLInputElement
                const email = emailInput?.value || 'juliamsteven@gmail.com'
                
                try {
                  const response = await apiClient.post('/api/test-email', {
                    toEmail: email,
                    toName: 'Usuario de Prueba',
                    taskTitle: 'Tarea de Prueba - Sistema FESC',
                    projectName: 'Proyecto de Prueba',
                    assignedByName: 'Sistema de Gestión FESC',
                  })
                  
                  if (response.success) {
                    alert(`✅ Email de prueba enviado exitosamente a ${email}`)
                  } else {
                    alert(`❌ Error: ${response.message}`)
                  }
                } catch (error: any) {
                  alert(`❌ Error al enviar email: ${error.message}`)
                  console.error('Error:', error)
                }
              }}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              Enviar Email de Prueba
            </Button>
            <p className="text-xs text-muted-foreground">
              Asegúrate de tener configuradas las variables SMTP en tu archivo .env
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botón de Guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Settings className="h-4 w-4" />
          Guardar Configuración
        </Button>
      </div>
    </div>
  )
}
