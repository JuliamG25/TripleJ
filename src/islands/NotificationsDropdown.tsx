import { useEffect } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { Button } from './Button'
import { Badge } from './Badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu'
import { useAppStore, type AppState } from '@/lib/store'
import { formatDistanceToNow } from 'date-fns'

export function NotificationsDropdown() {
  const notifications = useAppStore((state: AppState) => state.notifications)
  const unreadCount = useAppStore((state: AppState) => state.unreadNotificationsCount)
  const loadNotifications = useAppStore((state: AppState) => state.loadNotifications)
  const markNotificationAsRead = useAppStore((state: AppState) => state.markNotificationAsRead)
  const markAllNotificationsAsRead = useAppStore((state: AppState) => state.markAllNotificationsAsRead)

  useEffect(() => {
    loadNotifications()
    // Recargar notificaciones cada 30 segundos
    const interval = setInterval(() => {
      loadNotifications()
    }, 30000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  const handleNotificationClick = async (notification: any) => {
    // Marcar como leída
    if (!notification.read) {
      await markNotificationAsRead(notification.id)
    }

    // Navegar según el tipo de notificación
    if (notification.taskId) {
      // Ir al kanban (que muestra todas las tareas)
      window.location.href = '/dashboard/kanban'
    } else if (notification.projectId) {
      // Ir al proyecto
      window.location.href = `/dashboard/proyectos/${notification.projectId}`
    }
  }

  const formatDate = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return 'hace un momento'
    }
  }

  const unreadNotifications = notifications.filter(n => !n.read)
  const recentNotifications = notifications.slice(0, 10)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
          {unreadNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                markAllNotificationsAsRead()
              }}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {recentNotifications.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No hay notificaciones</p>
          </div>
        ) : (
          <>
            {recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 cursor-pointer p-3 ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
