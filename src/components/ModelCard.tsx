import { cn } from '@/lib/utils'
import { useModelStore, getModelDisplayName, getModelBadge } from '@/stores/modelStore'
import { useToast } from '@/components/ui/toast'

export function ModelCard({ modelId }: { modelId: string }) {
  const { selectedModelId, selectModel } = useModelStore()
  const { addToast } = useToast()
  const isActive = selectedModelId === modelId
  const badge = getModelBadge(modelId)
  const displayName = getModelDisplayName(modelId)

  const handleSelect = () => {
    selectModel(modelId)
    addToast(`Model: ${displayName}`, 'success')
  }

  return (
    <button
      onClick={handleSelect}
      className={cn(
        'w-full text-left p-2.5 rounded-lg border transition-all duration-300 relative overflow-hidden group',
        'bg-card border-border hover:border-primary',
        'hover:shadow-[0_0_15px_hsl(var(--primary)/0.25)]',
        isActive && [
          'border-primary',
          'bg-gradient-to-br from-primary/15 to-accent/10',
          'shadow-[0_0_20px_hsl(var(--primary)/0.2)]',
        ]
      )}
    >
      {/* Glow effect */}
      <div
        className={cn(
          'absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 transition-opacity duration-400 pointer-events-none',
          'bg-[radial-gradient(ellipse_at_center,hsl(var(--primary))_0%,transparent_70%)]',
          'group-hover:opacity-[0.08]',
          isActive && 'opacity-10 animate-glow-pulse'
        )}
      />

      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent shadow-[0_0_15px_hsl(var(--primary)),0_0_30px_hsl(var(--primary))]" />
      )}

      <div className="relative z-10">
        <div className="flex items-center flex-wrap gap-1.5 mb-1">
          <span className="font-semibold text-xs text-foreground">{displayName}</span>
          <span
            className={cn(
              'text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide',
              badge.type === 'vision' && 'bg-accent-cyan/20 text-accent-cyan',
              badge.type === 'chat' && 'bg-primary/20 text-primary',
              badge.type === 'embed' && 'bg-amber-500/20 text-amber-400'
            )}
          >
            {badge.text}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground font-mono truncate flex-1">{modelId}</p>
          <div className="flex items-center gap-1 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
          </div>
        </div>
      </div>
    </button>
  )
}

export function ModelCardSkeleton() {
  return (
    <div className="p-3 rounded-xl border border-border bg-card animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-4 rounded-full border-2 border-border border-t-primary animate-spin" />
        <span className="text-sm text-muted-foreground">Loading models...</span>
      </div>
    </div>
  )
}
