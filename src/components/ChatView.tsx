import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Square,
  Image,
  Zap,
  Download,
  RefreshCw,
  Sprout,
  Code,
  Lightbulb,
  Building2,
  FlaskConical,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from '@/components/ChatMessage'
import { useChatStore } from '@/stores/chatStore'
import { useModelStore, isVisionModel } from '@/stores/modelStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useToast } from '@/components/ui/toast'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'
import type { StreamMetrics } from '@/types'

const QUICK_PROMPTS = [
  { icon: FlaskConical, text: 'Explain quantum computing in simple terms' },
  { icon: Code, text: 'Write a Python function to sort a list using quicksort' },
  { icon: Building2, text: 'What are the key principles of good software architecture?' },
  { icon: Lightbulb, text: 'Help me brainstorm creative startup ideas for 2025' },
]

export function ChatView() {
  const [input, setInput] = useState('')
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [imageName, setImageName] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const { currentChatId, getCurrentChat, addMessage, updateChatTitle, isGenerating, setGenerating } =
    useChatStore()
  const { selectedModelId, loadModels } = useModelStore()
  const { streaming, parameters } = useSettingsStore()
  const { addToast } = useToast()

  const currentChat = getCurrentChat()
  const messages = currentChat?.messages ?? []

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      addToast('Please select an image file', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setCurrentImage(event.target?.result as string)
      setImageName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setCurrentImage(null)
    setImageName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text && !currentImage) return
    if (!selectedModelId) {
      addToast('Please select a model first', 'error')
      return
    }
    if (!currentChatId) return
    if (isGenerating) return

    // Build message content
    const content = currentImage
      ? [
          { type: 'text' as const, text: text || 'What do you see in this image?' },
          { type: 'image_url' as const, image_url: { url: currentImage } },
        ]
      : text

    // Add user message
    await addMessage(currentChatId, { role: 'user', content })

    // Clear input
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    removeImage()

    // Generate response
    setGenerating(true)
    setStreamingContent('')

    try {
      const chatMessages = [...messages, { id: '', role: 'user' as const, content, timestamp: Date.now() }]

      if (streaming) {
        // Create abort controller for this request
        abortControllerRef.current = new AbortController()

        let fullContent = ''
        let metrics: StreamMetrics | undefined
        try {
          for await (const chunk of api.streamChat(selectedModelId, chatMessages, {
            temperature: parameters.temperature,
            maxTokens: parameters.maxTokens,
            topP: parameters.topP,
            topK: parameters.topK,
            repeatPenalty: parameters.repeatPenalty,
            systemPrompt: parameters.systemPrompt,
            signal: abortControllerRef.current.signal,
          })) {
            if (chunk.type === 'content') {
              fullContent += chunk.content
              setStreamingContent(fullContent)
            } else if (chunk.type === 'metrics') {
              metrics = chunk.metrics
            }
          }
        } catch (err) {
          // If aborted, still save what we have
          if (err instanceof Error && err.name === 'AbortError') {
            metrics = {
              tokensPerSecond: 0,
              totalTokens: 0,
              timeToFirstToken: 0,
              stopReason: 'Stopped by user',
            }
          } else {
            throw err
          }
        }
        if (fullContent) {
          await addMessage(currentChatId, { role: 'assistant', content: fullContent, metrics })
        }
        abortControllerRef.current = null
      } else {
        const response = await api.chat(selectedModelId, chatMessages, {
          temperature: parameters.temperature,
          maxTokens: parameters.maxTokens,
          topP: parameters.topP,
          topK: parameters.topK,
          repeatPenalty: parameters.repeatPenalty,
          systemPrompt: parameters.systemPrompt,
        })
        await addMessage(currentChatId, { role: 'assistant', content: response })
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to generate response', 'error')
    } finally {
      setGenerating(false)
      setStreamingContent('')
    }
  }, [
    input,
    currentImage,
    selectedModelId,
    currentChatId,
    isGenerating,
    messages,
    streaming,
    parameters,
    addMessage,
    setGenerating,
    addToast,
  ])

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const handleQuickPrompt = (text: string) => {
    setInput(text)
    textareaRef.current?.focus()
  }

  const handleExport = () => {
    if (currentChatId) {
      useChatStore.getState().exportChat(currentChatId)
      addToast('Chat exported', 'success')
    }
  }

  const handleRefreshModels = async () => {
    addToast('Refreshing...', 'info')
    await loadModels()
  }

  const canUploadImage = selectedModelId && isVisionModel(selectedModelId)

  return (
    <main className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between">
        <input
          type="text"
          value={currentChat?.title ?? 'New Conversation'}
          onChange={(e) => currentChatId && updateChatTitle(currentChatId, e.target.value)}
          className="bg-transparent border-none text-base font-display font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg px-2 py-1 hover:bg-card transition-colors"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleExport} title="Export Chat">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleRefreshModels} title="Refresh Models">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1" viewportRef={scrollViewportRef}>
        <div className="p-6 space-y-5">
          {messages.length === 0 ? (
            <WelcomeState onPromptClick={handleQuickPrompt} />
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isGenerating && streamingContent && (
                <ChatMessage
                  message={{
                    id: 'streaming',
                    role: 'assistant',
                    content: streamingContent,
                    timestamp: Date.now(),
                  }}
                />
              )}
              {isGenerating && !streamingContent && (
                <ChatMessage
                  message={{
                    id: 'typing',
                    role: 'assistant',
                    content: '',
                    timestamp: Date.now(),
                  }}
                  isStreaming
                />
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-6 border-t border-border bg-background/80 backdrop-blur-xl">
        <div className="flex gap-3 items-end">
          <div
            className={cn(
              'flex-1 bg-card border border-border rounded-xl p-4 space-y-3 transition-all',
              'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
            )}
          >
            {/* Image Preview */}
            {currentImage && (
              <div className="flex items-center gap-3 p-2.5 bg-secondary rounded-lg">
                <img
                  src={currentImage}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{imageName}</p>
                </div>
                <button
                  onClick={removeImage}
                  className="p-1 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="w-full bg-transparent border-none resize-none focus:outline-none text-sm leading-relaxed min-h-[24px] max-h-[200px]"
            />

            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (!canUploadImage) {
                      addToast('Select a Vision model to use images', 'error')
                      return
                    }
                    fileInputRef.current?.click()
                  }}
                  style={{ opacity: canUploadImage ? 1 : 0.5 }}
                >
                  <Image className="w-4 h-4" />
                </Button>
                <Button
                  variant={streaming ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => useSettingsStore.getState().toggleStreaming()}
                  title={streaming ? 'Streaming enabled' : 'Streaming disabled'}
                >
                  <Zap className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Enter to send · Shift+Enter for new line
              </span>
            </div>
          </div>

          {isGenerating ? (
            <Button
              variant="destructive"
              size="icon"
              className="h-11 w-11 shrink-0 !bg-red-600 hover:!bg-red-700 shadow-lg shadow-red-600/30"
              onClick={handleStop}
              title="Stop generation"
            >
              <Square className="w-5 h-5 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-11 w-11 shrink-0 bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/40 hover:shadow-primary/60 hover:brightness-110"
              onClick={handleSend}
              disabled={!input.trim() && !currentImage}
            >
              <Send className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}

function WelcomeState({ onPromptClick }: { onPromptClick: (text: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-5">
      <div className="w-[72px] h-[72px] rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow animate-float">
        <Sprout className="w-8 h-8 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight mb-2">
          Welcome to <span className="text-primary">Model Garden</span>
        </h1>
        <p className="text-muted-foreground max-w-md">
          Intel SIV's local AI playground. Select a model and start exploring.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-lg mt-4">
        {QUICK_PROMPTS.map(({ icon: Icon, text }) => (
          <button
            key={text}
            onClick={() => onPromptClick(text)}
            className="p-4 rounded-xl bg-card border border-border hover:border-primary hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 transition-all text-left group"
          >
            <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
            <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
              {text}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
