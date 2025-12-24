import { Palette, Sparkles, SlidersHorizontal, Terminal, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettingsStore } from '@/stores/settingsStore'
import { useModelStore } from '@/stores/modelStore'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { Theme, PresetName } from '@/types'

const THEMES: { id: Theme; name: string; colors: string }[] = [
  { id: 'dark', name: 'Dark', colors: 'from-violet-600 to-slate-900' },
  { id: 'midnight', name: 'Midnight', colors: 'from-blue-500 to-slate-900' },
  { id: 'cyberpunk', name: 'Cyber', colors: 'from-pink-500 to-slate-900' },
  { id: 'forest', name: 'Forest', colors: 'from-green-500 to-slate-900' },
]

const PRESETS: { id: PresetName; name: string; icon: string; desc: string }[] = [
  { id: 'creative', name: 'Creative', icon: '🎨', desc: 'High temperature, diverse outputs' },
  { id: 'balanced', name: 'Balanced', icon: '⚖️', desc: 'Default settings for general use' },
  { id: 'precise', name: 'Precise', icon: '🎯', desc: 'Low temperature, focused outputs' },
  { id: 'coding', name: 'Coding', icon: '💻', desc: 'Optimized for code generation' },
]

export function SettingsSidebar() {
  const {
    theme,
    setTheme,
    parameters,
    setParameter,
    setSystemPrompt,
    applyPreset,
    resetParameters,
  } = useSettingsStore()
  const { isConnected } = useModelStore()
  const { addToast } = useToast()

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    addToast(`Theme: ${newTheme}`, 'success')
  }

  const handlePresetChange = (preset: PresetName) => {
    applyPreset(preset)
    addToast(`Preset: ${preset}`, 'success')
  }

  return (
    <aside className="w-64 bg-secondary border-l border-border flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-6">
          {/* Theme Section */}
          <section>
            <SectionHeader icon={Palette} title="Theme" />
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-sm font-medium',
                    'bg-card border-border hover:border-primary',
                    theme === t.id && 'bg-primary/15 border-primary'
                  )}
                >
                  <div className={cn('w-3 h-3 rounded-full bg-gradient-to-br', t.colors)} />
                  {t.name}
                </button>
              ))}
            </div>
          </section>

          {/* Presets Section */}
          <section>
            <SectionHeader icon={Sparkles} title="Presets" />
            <div className="space-y-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetChange(preset.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl border transition-all',
                    'bg-card border-border hover:border-primary hover:translate-x-1',
                    // Check if current params match preset (simplified check)
                    parameters.temperature ===
                      { creative: 1.2, balanced: 0.7, precise: 0.3, coding: 0.2 }[preset.id] &&
                      'bg-primary/10 border-primary'
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span>{preset.icon}</span>
                    {preset.name}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{preset.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Parameters Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionHeader icon={SlidersHorizontal} title="Parameters" className="mb-0" />
              <Button variant="outline" size="sm" onClick={resetParameters} className="text-xs h-7">
                Reset
              </Button>
            </div>

            <div className="space-y-4">
              <ParameterSlider
                label="Temperature"
                value={parameters.temperature}
                min={0}
                max={2}
                step={0.1}
                onChange={(v) => setParameter('temperature', v)}
              />
              <ParameterSlider
                label="Max Tokens"
                value={parameters.maxTokens}
                min={64}
                max={8192}
                step={64}
                onChange={(v) => setParameter('maxTokens', v)}
              />
              <ParameterSlider
                label="Top P"
                value={parameters.topP}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => setParameter('topP', v)}
              />
              <ParameterSlider
                label="Top K"
                value={parameters.topK}
                min={1}
                max={100}
                step={1}
                onChange={(v) => setParameter('topK', v)}
              />
              <ParameterSlider
                label="Repeat Penalty"
                value={parameters.repeatPenalty}
                min={1}
                max={2}
                step={0.05}
                onChange={(v) => setParameter('repeatPenalty', v)}
              />
            </div>
          </section>

          {/* System Prompt */}
          <section>
            <SectionHeader icon={Terminal} title="System Prompt" />
            <Textarea
              placeholder="You are a helpful assistant..."
              value={parameters.systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </section>
        </div>
      </ScrollArea>

      {/* Server Status */}
      <div
        className={cn(
          'mx-5 mb-5 px-3 py-2.5 rounded-xl border flex items-center gap-2 text-xs',
          'bg-card',
          isConnected ? 'border-accent-cyan/30' : 'border-destructive/30'
        )}
      >
        {isConnected ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan shadow-[0_0_8px_hsl(var(--accent-cyan))] animate-pulse" />
            <Wifi className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Connected to LM Studio</span>
          </>
        ) : (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
            <WifiOff className="w-3.5 h-3.5 text-destructive" />
            <span>Server offline</span>
          </>
        )}
      </div>
    </aside>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  className,
}: {
  icon: React.ElementType
  title: string
  className?: string
}) {
  return (
    <h3
      className={cn(
        'flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary/80 mb-3',
        className
      )}
    >
      <Icon className="w-4 h-4" />
      {title}
    </h3>
  )
}

function ParameterSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono px-2 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan">
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => v !== undefined && onChange(v)}
      />
    </div>
  )
}
