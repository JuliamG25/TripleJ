import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { 
  LayoutDashboard, 
  FolderKanban, 
  ListTodo, 
  KanbanSquare,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react'
import type { User, UserRole } from '@/lib/types'

interface DashboardSidebarProps {
  user: User
  isOpen: boolean
  onToggle: () => void
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}

const baseNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Proyectos', href: '/dashboard/proyectos', icon: FolderKanban },
  { name: 'Estadísticas', href: '/dashboard/backlog', icon: ListTodo, roles: ['lider', 'administrador'] },
  { name: 'Kanban', href: '/dashboard/kanban', icon: KanbanSquare },
  { name: 'Calendario', href: '/dashboard/calendario', icon: CalendarIcon },
]

export function DashboardSidebar({ user, isOpen, onToggle }: DashboardSidebarProps) {
  const [pathname, setPathname] = useState('')
  
  // Filtrar navegación según el rol del usuario
  const navigation = baseNavigation.filter(item => {
    if (!item.roles) return true // Si no tiene restricción de roles, mostrar a todos
    return item.roles.includes(user.role)
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updatePathname = () => setPathname(window.location.pathname)
      updatePathname()
      
      // Escuchar cambios de navegación
      const handlePopState = () => updatePathname()
      window.addEventListener('popstate', handlePopState)
      
      // Escuchar clics en enlaces para actualizar el pathname
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        const link = target.closest('a')
        if (link && link.href) {
          const url = new URL(link.href)
          if (url.pathname.startsWith('/dashboard')) {
            setTimeout(() => updatePathname(), 0)
          }
        }
      }
      window.addEventListener('click', handleClick)
      
      return () => {
        window.removeEventListener('popstate', handlePopState)
        window.removeEventListener('click', handleClick)
      }
    }
  }, [])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fesc-user')
      window.location.href = '/login'
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
          isOpen ? 'w-64' : 'w-20',
          'hidden lg:block'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {isOpen ? (
            <a href="/dashboard">
              <img
                src="/images/fesc-logo.png"
                alt="FESC"
                width="100"
                height="42"
                className="h-8 w-auto"
              />
            </a>
          ) : (
            <div className="mx-auto text-xl font-bold text-primary">F</div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {isOpen && <span>{item.name}</span>}
              </a>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-4">
          {isOpen ? (
            <div className="flex items-center gap-3 mb-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover border border-sidebar-border"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover border border-sidebar-border"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <Button
            variant="ghost"
            size={isOpen ? 'default' : 'icon'}
            onClick={handleLogout}
            className={cn(
              'text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive',
              isOpen ? 'w-full justify-start gap-3' : 'mx-auto'
            )}
          >
            <LogOut className="h-4 w-4" />
            {isOpen && <span>Cerrar Sesión</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <a href="/dashboard">
            <img
              src="/images/fesc-logo.png"
              alt="FESC"
              width="100"
              height="42"
              className="h-8 w-auto"
            />
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={onToggle}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </a>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 mb-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-10 w-10 rounded-full object-cover border border-sidebar-border"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </aside>
    </>
  )
}
