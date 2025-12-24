import Dexie, { type Table } from 'dexie'
import type { Chat } from '@/types'

class ModelGardenDB extends Dexie {
  chats!: Table<Chat, string>

  constructor() {
    super('ModelGardenDB')

    this.version(1).stores({
      chats: 'id, updatedAt, createdAt',
    })
  }

  async getAllChats(): Promise<Chat[]> {
    return this.chats.orderBy('updatedAt').reverse().toArray()
  }

  async getChat(id: string): Promise<Chat | undefined> {
    return this.chats.get(id)
  }

  async saveChat(chat: Chat): Promise<void> {
    await this.chats.put(chat)
  }

  async deleteChat(id: string): Promise<void> {
    await this.chats.delete(id)
  }

  async clearAllChats(): Promise<void> {
    await this.chats.clear()
  }

  async getChatCount(): Promise<number> {
    return this.chats.count()
  }

  async searchChats(query: string): Promise<Chat[]> {
    const q = query.toLowerCase()
    return this.chats
      .filter((chat) => {
        if (chat.title.toLowerCase().includes(q)) return true
        return chat.messages.some((msg) => {
          const content =
            typeof msg.content === 'string'
              ? msg.content
              : msg.content.find((c) => c.type === 'text')
          if (content && typeof content === 'object' && 'text' in content) {
            return content.text.toLowerCase().includes(q)
          }
          return typeof content === 'string' && content.toLowerCase().includes(q)
        })
      })
      .toArray()
  }
}

export const db = new ModelGardenDB()
