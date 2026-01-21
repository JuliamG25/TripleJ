import { useEffect, useState, type ReactNode } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { authApi } from '@/lib/api/auth'
import { useAppStore, type AppState } from '@/lib/store'
import type { User } from '@/lib/types'

interface DashboardLayoutWrapperProps {
  children: ReactNode
}

export function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const loadData = useAppStore((state: AppState) => state.loadData)

  useEffect(() => {
    const loadUser = async () => {
      if (typeof window === 'undefined') return

      // Verificar si hay token
      if (!authApi.isAuthenticated()) {
        window.location.href = '/login'
        return
      }

      try {
        // Intentar obtener usuario desde la API
        const currentUser = await authApi.getMe()
        setUser(currentUser)
        // Actualizar localStorage con datos actualizados
        localStorage.setItem('fesc-user', JSON.stringify(currentUser))
      } catch (error) {
        // Si falla, intentar usar usuario almacenado
        const storedUser = authApi.getStoredUser()
        if (storedUser) {
          setUser(storedUser)
        } else {
          authApi.logout()
        }
      } finally {
        setLoading(false)
      }
    }

    loadUser()
    // Cargar datos del store
    loadData()
  }, [loadData])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar 
        user={user} 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <DashboardHeader 
          user={user} 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
