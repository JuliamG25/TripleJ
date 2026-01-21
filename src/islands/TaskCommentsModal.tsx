import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './Dialog'
import { Button } from './Button'
import { Badge } from './Badge'
import { useAppStore, type AppState } from '@/lib/store'
import { commentsApi } from '@/lib/api/comments'
import type { Task, Comment } from '@/lib/types'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TaskCommentsModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskCommentsModal({ task, open, onOpenChange }: TaskCommentsModalProps) {
  const currentUser = useAppStore((state: AppState) => state.currentUser)
  const addComment = useAppStore((state: AppState) => state.addComment)
  const tasks = useAppStore((state: AppState) => state.tasks)
  
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Obtener la tarea actualizada del store
  const currentTask = task ? tasks.find(t => t.id === task.id) || task : null
  const [comments, setComments] = useState<Comment[]>(currentTask?.comments || [])

  // Recargar comentarios cuando se abre el modal para asegurar que están actualizados
  useEffect(() => {
    if (open && task) {
      setIsLoadingComments(true)
      commentsApi.getByTaskId(task.id)
        .then((loadedComments) => {
          setComments(loadedComments)
        })
        .catch((err) => {
          console.error('Error al cargar comentarios:', err)
          // Usar comentarios del store si falla la carga
          setComments(currentTask?.comments || [])
        })
        .finally(() => {
          setIsLoadingComments(false)
        })
    } else if (!open) {
      // Resetear cuando se cierra
      setComments([])
      setCommentText('')
      setError(null)
    }
  }, [open, task?.id])

  // Actualizar comentarios cuando cambia la tarea en el store (después de agregar uno nuevo)
  useEffect(() => {
    if (currentTask) {
      setComments(currentTask.comments)
    }
  }, [currentTask?.comments])

  // Scroll al final cuando se abra el modal o se agreguen comentarios
  useEffect(() => {
    if (open && commentsEndRef.current) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [open, comments.length])

  // Focus en el textarea cuando se abre el modal
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 150)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!task || !commentText.trim()) return
    
    setIsSubmitting(true)
    setError(null)

    try {
      const newComment = await addComment(task.id, commentText.trim())
      setCommentText('')
      // Los comentarios se actualizarán automáticamente desde el store
      // Scroll al final después de agregar comentario
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err: any) {
      setError(err.message || 'Error al agregar comentario')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true
      })
    } catch {
      return 'hace un momento'
    }
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentarios
          </DialogTitle>
          <DialogDescription>
            {task.title}
          </DialogDescription>
        </DialogHeader>

        {/* Lista de comentarios con scroll */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2">
          {isLoadingComments ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Cargando comentarios...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                No hay comentarios aún. Sé el primero en comentar.
              </p>
            </div>
          ) : (
            comments.map((comment: Comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-4 rounded-lg border border-border bg-card"
              >
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-primary">
                    {comment.author.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {comment.author.name}
                    </span>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {comment.author.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Formulario de nuevo comentario */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t border-border">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
          
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 min-h-[80px] max-h-[200px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmit(e)
                }
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Presiona Ctrl+Enter o Cmd+Enter para enviar
            </p>
            <Button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              size="sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
