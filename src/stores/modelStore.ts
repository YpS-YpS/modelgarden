import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Model, ModelBadge } from '@/types'
import { api } from '@/services/api'

interface ModelState {
  models: Model[]
  selectedModelId: string | null
  isLoading: boolean
  isConnected: boolean
  error: string | null

  // Actions
  loadModels: () => Promise<void>
  selectModel: (modelId: string) => void
  checkConnection: () => Promise<boolean>
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      models: [],
      selectedModelId: null,
      isLoading: false,
      isConnected: false,
      error: null,

      loadModels: async () => {
        set({ isLoading: true, error: null })
        try {
          const allModels = await api.getModels()
          // Filter out embedding models (nomic-embed-text, etc.)
          const models = allModels.filter(
            (m) => !m.id.toLowerCase().includes('embed') && !m.id.toLowerCase().includes('nomic')
          )
          set({ models, isLoading: false, isConnected: true })

          // Auto-select first model if none selected
          const { selectedModelId } = get()
          if (!selectedModelId || !models.find((m) => m.id === selectedModelId)) {
            if (models[0]) {
              set({ selectedModelId: models[0].id })
            }
          }
        } catch (error) {
          set({
            isLoading: false,
            isConnected: false,
            error: error instanceof Error ? error.message : 'Failed to load models',
          })
        }
      },

      selectModel: (modelId) => set({ selectedModelId: modelId }),

      checkConnection: async () => {
        try {
          await api.getModels()
          set({ isConnected: true })
          return true
        } catch {
          set({ isConnected: false })
          return false
        }
      },
    }),
    {
      name: 'modelgarden-models',
      partialize: (state) => ({ selectedModelId: state.selectedModelId }),
    }
  )
)

// Helper functions
export function getModelDisplayName(modelId: string): string {
  const parts = modelId.split('/')
  const name = parts[parts.length - 1] ?? modelId
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function getModelBadge(modelId: string): ModelBadge {
  const id = modelId.toLowerCase()
  if (id.includes('embed')) return { text: 'Embed', type: 'embed' }
  if (id.includes('vl') || id.includes('vision')) return { text: 'Vision', type: 'vision' }
  return { text: 'Chat', type: 'chat' }
}

export function isVisionModel(modelId: string): boolean {
  const id = modelId.toLowerCase()
  return id.includes('vl') || id.includes('vision')
}
