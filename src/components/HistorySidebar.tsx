import { useState } from 'react'
import { Plus, Search, MessageSquare, Trash2, Sprout, Boxes, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ModelCard, ModelCardSkeleton } from '@/components/ModelCard'
import { useChatStore, getMessagePreview } from '@/stores/chatStore'
import { useModelStore } from '@/stores/modelStore'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { Chat } from '@/types'

export function HistorySidebar() {
  const [searchQuery, setSearchQuery] = useState('')
  const { chats, currentChatId, createChat, selectChat, deleteChat } = useChatStore()
  const { models, isLoading } = useModelStore()
  const { addToast } = useToast()

  const handleNewChat = async () => {
    await createChat()
    addToast('New chat created', 'success')
  }

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteChat(chatId)
    addToast('Chat deleted', 'success')
  }

  // Filter and group chats
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    if (chat.title.toLowerCase().includes(q)) return true
    return chat.messages.some((m) => {
      const preview = getMessagePreview(m.content, 100)
      return preview.toLowerCase().includes(q)
    })
  })

  const groupedChats = groupChatsByDate(filteredChats)

  return (
    <aside className="w-80 bg-secondary border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow">
            <Sprout className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="font-display font-bold text-base tracking-tight">
            <span className="text-muted-foreground">Intel SIV</span>{' '}
            <span className="text-foreground">Model</span>{' '}
            <span className="text-primary">Garden</span>
          </div>
        </div>
        <Button onClick={handleNewChat} className="w-full">
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Models Section */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary/80 mb-3">
          <Boxes className="w-4 h-4" />
          Models
        </h3>
        <div className="max-h-[380px] overflow-y-auto models-scroll">
          <div className="space-y-1.5">
            {isLoading ? (
              <ModelCardSkeleton />
            ) : models.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No models found
              </p>
            ) : (
              models.map((model) => <ModelCard key={model.id} modelId={model.id} />)
            )}
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="flex-1 flex flex-col min-h-0 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary/80 mb-3">
          <Clock className="w-4 h-4" />
          History
        </h3>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="flex-1 -mx-4">
          <div className="space-y-3 px-4">
            {Object.entries(groupedChats).map(([group, groupChats]) => (
              <div key={group}>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2">
                  {group}
                </h4>
                <div className="space-y-1">
                  {groupChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => selectChat(chat.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-all group text-left',
                        'hover:bg-card-foreground/5',
                        currentChatId === chat.id && 'bg-primary/15 border border-primary/30'
                      )}
                    >
                      <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-medium truncate">{chat.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {chat.messages.length > 0
                            ? getMessagePreview(chat.messages[0]?.content ?? '', 30)
                            : 'No messages yet'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredChats.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No conversations yet
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  )
}

function groupChatsByDate(chats: Chat[]) {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  const groups: Record<string, Chat[]> = {}

  for (const chat of chats) {
    const chatDate = new Date(chat.updatedAt).toDateString()
    let group: string

    if (chatDate === today) {
      group = 'Today'
    } else if (chatDate === yesterday) {
      group = 'Yesterday'
    } else {
      group = 'Previous'
    }

    if (!groups[group]) {
      groups[group] = []
    }
    groups[group]!.push(chat)
  }

  return groups
}
