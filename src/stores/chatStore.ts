import { create } from 'zustand'
import type { Chat, Message, MessageContent } from '@/types'
import { db } from '@/services/database'

interface ChatState {
  chats: Chat[]
  currentChatId: string | null
  isGenerating: boolean

  // Actions
  loadChats: () => Promise<void>
  createChat: () => Promise<string>
  deleteChat: (chatId: string) => Promise<void>
  selectChat: (chatId: string) => void
  updateChatTitle: (chatId: string, title: string) => Promise<void>
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => Promise<Message>
  updateMessage: (chatId: string, messageId: string, content: string) => Promise<void>
  setGenerating: (isGenerating: boolean) => void
  getCurrentChat: () => Chat | undefined
  exportChat: (chatId: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChatId: null,
  isGenerating: false,

  loadChats: async () => {
    const chats = await db.getAllChats()
    set({ chats })

    // Select most recent chat or create new one
    if (chats.length > 0) {
      const mostRecent = chats.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b))
      set({ currentChatId: mostRecent.id })
    } else {
      const chatId = await get().createChat()
      set({ currentChatId: chatId })
    }
  },

  createChat: async () => {
    const chat: Chat = {
      id: `chat_${Date.now()}`,
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await db.saveChat(chat)
    set((state) => ({
      chats: [chat, ...state.chats],
      currentChatId: chat.id,
    }))
    return chat.id
  },

  deleteChat: async (chatId) => {
    await db.deleteChat(chatId)
    const { chats, currentChatId } = get()
    const newChats = chats.filter((c) => c.id !== chatId)
    set({ chats: newChats })

    if (currentChatId === chatId) {
      if (newChats.length > 0) {
        set({ currentChatId: newChats[0]?.id ?? null })
      } else {
        await get().createChat()
      }
    }
  },

  selectChat: (chatId) => set({ currentChatId: chatId }),

  updateChatTitle: async (chatId, title) => {
    const { chats } = get()
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) return

    const updatedChat = { ...chat, title, updatedAt: Date.now() }
    await db.saveChat(updatedChat)
    set({
      chats: chats.map((c) => (c.id === chatId ? updatedChat : c)),
    })
  },

  addMessage: async (chatId, messageData) => {
    const { chats } = get()
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) throw new Error('Chat not found')

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      ...messageData,
      timestamp: Date.now(),
    }

    const isFirstMessage = chat.messages.length === 0
    const updatedChat: Chat = {
      ...chat,
      messages: [...chat.messages, message],
      updatedAt: Date.now(),
      // Auto-title based on first user message
      title:
        isFirstMessage && messageData.role === 'user'
          ? getMessagePreview(messageData.content, 40)
          : chat.title,
    }

    await db.saveChat(updatedChat)
    set({
      chats: chats.map((c) => (c.id === chatId ? updatedChat : c)),
    })

    return message
  },

  updateMessage: async (chatId, messageId, content) => {
    const { chats } = get()
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) return

    const updatedChat = {
      ...chat,
      messages: chat.messages.map((m) => (m.id === messageId ? { ...m, content } : m)),
      updatedAt: Date.now(),
    }

    await db.saveChat(updatedChat)
    set({
      chats: chats.map((c) => (c.id === chatId ? updatedChat : c)),
    })
  },

  setGenerating: (isGenerating) => set({ isGenerating }),

  getCurrentChat: () => {
    const { chats, currentChatId } = get()
    return chats.find((c) => c.id === currentChatId)
  },

  exportChat: (chatId) => {
    const { chats } = get()
    const chat = chats.find((c) => c.id === chatId)
    if (!chat || chat.messages.length === 0) return

    const exportData = {
      title: chat.title,
      messages: chat.messages,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${chat.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  },
}))

// Helper function to extract preview text from message content
export function getMessagePreview(content: MessageContent, maxLength: number = 50): string {
  let text: string
  if (typeof content === 'string') {
    text = content
  } else {
    const textContent = content.find((c) => c.type === 'text')
    text = textContent && 'text' in textContent ? textContent.text : 'Image message'
  }
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}
