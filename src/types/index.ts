// Theme types
export type Theme = 'dark' | 'midnight' | 'cyberpunk' | 'forest'

// Model types
export interface Model {
  id: string
  object: string
  owned_by?: string
  created?: number
}

export type ModelType = 'chat' | 'vision' | 'embed'

export interface ModelBadge {
  text: string
  type: ModelType
}

// Message types
export interface TextContent {
  type: 'text'
  text: string
}

export interface ImageContent {
  type: 'image_url'
  image_url: {
    url: string
  }
}

export type MessageContent = string | (TextContent | ImageContent)[]

export interface StreamMetrics {
  tokensPerSecond: number
  totalTokens: number
  timeToFirstToken: number
  stopReason: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: MessageContent
  timestamp: number
  metrics?: StreamMetrics
}

// Chat types
export interface Chat {
  id: string
  title: string
  messages: Message[]
  modelId?: string
  createdAt: number
  updatedAt: number
}

// Parameter presets
export type PresetName = 'creative' | 'balanced' | 'precise' | 'coding'

export interface ParameterPreset {
  temperature: number
  maxTokens: number
  topP: number
  topK: number
  repeatPenalty: number
}

export interface Parameters extends ParameterPreset {
  systemPrompt: string
}

// API types
export interface ChatCompletionRequest {
  model: string
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: MessageContent
  }>
  temperature?: number
  max_tokens?: number
  top_p?: number
  top_k?: number
  repeat_penalty?: number
  stream?: boolean
}

export interface ChatCompletionChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }>
}

export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface ModelsResponse {
  data: Model[]
  object: string
}

// Settings
export interface Settings {
  theme: Theme
  streaming: boolean
  parameters: Parameters
}

// Presets config
export const PRESETS: Record<PresetName, ParameterPreset> = {
  creative: { temperature: 1.2, maxTokens: 4096, topP: 0.95, topK: 80, repeatPenalty: 1.0 },
  balanced: { temperature: 0.7, maxTokens: 2048, topP: 0.9, topK: 40, repeatPenalty: 1.1 },
  precise: { temperature: 0.3, maxTokens: 2048, topP: 0.7, topK: 20, repeatPenalty: 1.2 },
  coding: { temperature: 0.2, maxTokens: 4096, topP: 0.8, topK: 30, repeatPenalty: 1.15 },
}
