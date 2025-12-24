import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, Parameters, PresetName, ParameterPreset } from '@/types'
import { PRESETS } from '@/types'

interface SettingsState {
  theme: Theme
  streaming: boolean
  parameters: Parameters

  // Actions
  setTheme: (theme: Theme) => void
  toggleStreaming: () => void
  setParameter: <K extends keyof ParameterPreset>(key: K, value: ParameterPreset[K]) => void
  setSystemPrompt: (prompt: string) => void
  applyPreset: (preset: PresetName) => void
  resetParameters: () => void
}

const defaultParameters: Parameters = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  topK: 40,
  repeatPenalty: 1.1,
  systemPrompt: '',
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      streaming: true,
      parameters: defaultParameters,

      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },

      toggleStreaming: () => set((state) => ({ streaming: !state.streaming })),

      setParameter: (key, value) =>
        set((state) => ({
          parameters: { ...state.parameters, [key]: value },
        })),

      setSystemPrompt: (prompt) =>
        set((state) => ({
          parameters: { ...state.parameters, systemPrompt: prompt },
        })),

      applyPreset: (presetName) => {
        const preset = PRESETS[presetName]
        set((state) => ({
          parameters: { ...state.parameters, ...preset },
        }))
      },

      resetParameters: () =>
        set((state) => ({
          parameters: { ...state.parameters, ...PRESETS.balanced },
        })),
    }),
    {
      name: 'modelgarden-settings',
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state?.theme) {
          document.documentElement.setAttribute('data-theme', state.theme)
        }
      },
    }
  )
)
