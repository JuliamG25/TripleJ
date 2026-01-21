import { useState } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { Label } from './Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { useAppStore, type AppState } from '@/lib/store'
import { Plus, X } from 'lucide-react'

interface CreateProjectFormProps {
  onSuccess?: () => void
}

export function CreateProjectForm({ onSuccess }: CreateProjectFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [members, setMembers] = useState<string[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const createProject = useAppStore((state: AppState) => state.createProject)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await createProject({
        name,
        description,
        members: members.length > 0 ? members : undefined,
      })
      
      // Reset form
      setName('')
      setDescription('')
      setMembers([])
      setNewMemberEmail('')
      setIsOpen(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear proyecto')
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

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full md:w-auto">
        <Plus className="h-4 w-4" />
        Nuevo Proyecto
      </Button>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Crear Nuevo Proyecto</CardTitle>
            <CardDescription>Completa la información del proyecto</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Proyecto</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sistema de Gestión Académica"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el proyecto..."
              className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Miembros (opcional)</Label>
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

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
