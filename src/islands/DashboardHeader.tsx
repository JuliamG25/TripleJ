import { Menu, Search } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu'
import { NotificationsDropdown } from './NotificationsDropdown'
import { authApi } from '@/lib/api/auth'
import type { User } from '@/lib/types'

interface DashboardHeaderProps {
  user: User
  onMenuToggle: () => void
}

export function DashboardHeader({ user, onMenuToggle }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuToggle}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Abrir menú</span>
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar proyectos, tareas..."
            className="pl-9 bg-secondary/50 border-transparent focus:border-input"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <NotificationsDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configuración</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => authApi.logout()}
            >
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
