import * as React from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `toast_${Date.now()}`
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto remove after 2.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2500)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const Icon = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
  }[toast.type]

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border bg-card shadow-lg animate-slide-in',
        toast.type === 'success' && 'border-accent-cyan/30',
        toast.type === 'error' && 'border-destructive/30',
        toast.type === 'info' && 'border-border'
      )}
    >
      <Icon
        className={cn(
          'w-4 h-4',
          toast.type === 'success' && 'text-accent-cyan',
          toast.type === 'error' && 'text-destructive',
          toast.type === 'info' && 'text-muted-foreground'
        )}
      />
      <span className="text-sm text-foreground">{toast.message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
