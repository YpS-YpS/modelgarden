import type {
  Model,
  ModelsResponse,
  ChatCompletionRequest,
  ChatCompletionResponse,
  Message,
  MessageContent,
  StreamMetrics,
} from '@/types'

export type StreamChunk =
  | { type: 'content'; content: string }
  | { type: 'metrics'; metrics: StreamMetrics }

const API_BASE = 'http://127.0.0.1:1234'

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl
  }

  async getModels(): Promise<Model[]> {
    const response = await fetch(`${this.baseUrl}/v1/models`)
    if (!response.ok) {
      throw new Error('Failed to fetch models')
    }
    const data: ModelsResponse = await response.json()
    return data.data
  }

  async chat(
    modelId: string,
    messages: Message[],
    options: {
      temperature?: number
      maxTokens?: number
      topP?: number
      topK?: number
      repeatPenalty?: number
      systemPrompt?: string
    } = {}
  ): Promise<string> {
    const apiMessages = this.buildApiMessages(messages, options.systemPrompt)

    const payload: ChatCompletionRequest = {
      model: modelId,
      messages: apiMessages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      top_k: options.topK,
      repeat_penalty: options.repeatPenalty,
      stream: false,
    }

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Request failed')
    }

    const data: ChatCompletionResponse = await response.json()
    return data.choices[0]?.message.content ?? ''
  }

  async *streamChat(
    modelId: string,
    messages: Message[],
    options: {
      temperature?: number
      maxTokens?: number
      topP?: number
      topK?: number
      repeatPenalty?: number
      systemPrompt?: string
      signal?: AbortSignal
    } = {}
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const apiMessages = this.buildApiMessages(messages, options.systemPrompt)

    const payload: ChatCompletionRequest = {
      model: modelId,
      messages: apiMessages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      top_k: options.topK,
      repeat_penalty: options.repeatPenalty,
      stream: true,
    }

    const startTime = performance.now()
    let firstTokenTime: number | null = null
    let tokenCount = 0
    let stopReason = 'unknown'

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: options.signal,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Request failed')
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let aborted = false

    // Handle abort
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        aborted = true
        reader.cancel()
      })
    }

    while (true) {
      if (aborted) break
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter((line) => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const json = JSON.parse(data)
            const delta = json.choices?.[0]?.delta?.content
            const finishReason = json.choices?.[0]?.finish_reason

            if (finishReason) {
              stopReason = finishReason
            }

            if (delta) {
              if (firstTokenTime === null) {
                firstTokenTime = performance.now()
              }
              // Approximate token count (roughly 4 chars per token)
              tokenCount += Math.ceil(delta.length / 4)
              yield { type: 'content', content: delta }
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    // Calculate and yield metrics
    const endTime = performance.now()
    const totalTime = (endTime - startTime) / 1000 // seconds
    const timeToFirstToken = firstTokenTime ? (firstTokenTime - startTime) / 1000 : 0

    // Determine stop reason
    let finalStopReason = stopReason
    if (aborted) {
      finalStopReason = 'Stopped by user'
    } else if (stopReason === 'stop') {
      finalStopReason = 'EOS Token Found'
    }

    yield {
      type: 'metrics',
      metrics: {
        tokensPerSecond: tokenCount > 0 ? tokenCount / totalTime : 0,
        totalTokens: tokenCount,
        timeToFirstToken,
        stopReason: finalStopReason,
      },
    }
  }

  private buildApiMessages(
    messages: Message[],
    systemPrompt?: string
  ): Array<{ role: 'user' | 'assistant' | 'system'; content: MessageContent }> {
    const apiMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: MessageContent }> =
      []

    if (systemPrompt?.trim()) {
      apiMessages.push({ role: 'system', content: systemPrompt })
    }

    for (const msg of messages) {
      apiMessages.push({
        role: msg.role,
        content: msg.content,
      })
    }

    return apiMessages
  }
}

export const api = new ApiService()
