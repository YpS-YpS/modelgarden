import { memo } from 'react'
import { User, Bot, Zap, Clock, Hash, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message, MessageContent, StreamMetrics } from '@/types'

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = message.role === 'user'
  const content = formatContent(message.content)

  return (
    <div
      className={cn(
        'flex gap-3.5 max-w-[80%] animate-fade-in',
        isUser && 'self-end flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          isUser
            ? 'bg-card border border-border'
            : 'bg-gradient-to-br from-primary to-accent shadow-[0_0_20px_hsl(var(--primary)/0.3)]'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-primary-foreground" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'rounded-xl px-4 py-3 text-sm leading-relaxed transition-colors',
          isUser
            ? 'bg-primary/10 border border-primary/30'
            : 'bg-card border border-border'
        )}
      >
        {isStreaming ? (
          <TypingIndicator />
        ) : (
          <>
            <div
              className="prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: content.html }}
            />
            {content.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="Uploaded"
                className="max-w-[300px] rounded-lg mt-3"
              />
            ))}
            {!isUser && message.metrics && (
              <MetricsDisplay metrics={message.metrics} />
            )}
          </>
        )}
      </div>
    </div>
  )
})

function TypingIndicator() {
  return (
    <div className="flex gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-primary animate-typing"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}

function MetricsDisplay({ metrics }: { metrics: StreamMetrics }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/50 text-[10px] text-muted-foreground">
      <span className="flex items-center gap-1">
        <Zap className="w-3 h-3 text-primary" />
        {metrics.tokensPerSecond.toFixed(2)} tok/sec
      </span>
      <span className="flex items-center gap-1">
        <Hash className="w-3 h-3" />
        {metrics.totalTokens} tokens
      </span>
      <span className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {metrics.timeToFirstToken.toFixed(2)}s to first token
      </span>
      <span className="flex items-center gap-1">
        <Square className="w-3 h-3" />
        {metrics.stopReason}
      </span>
    </div>
  )
}

function formatContent(content: MessageContent): { html: string; images: string[] } {
  const images: string[] = []
  let text: string

  if (typeof content === 'string') {
    text = content
  } else {
    const textParts: string[] = []
    for (const part of content) {
      if (part.type === 'text') {
        textParts.push(part.text)
      } else if (part.type === 'image_url') {
        images.push(part.image_url.url)
      }
    }
    text = textParts.join('\n')
  }

  // First escape all HTML
  let html = escapeHtml(text)

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-secondary rounded-lg p-3 overflow-x-auto my-3"><code class="font-mono text-xs">$2</code></pre>')

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Italic
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')

  // Headers (process longest first to avoid partial matches)
  html = html.replace(/^###### (.+)$/gm, '<h6 class="text-xs font-bold mt-3 mb-1 text-muted-foreground">$1</h6>')
  html = html.replace(/^##### (.+)$/gm, '<h5 class="text-sm font-bold mt-3 mb-1">$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-sm font-bold mt-4 mb-2">$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-2">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="border-border my-4">')

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')

  // Process tables AFTER escaping (so table HTML isn't escaped)
  html = processMarkdownTables(html)

  // Line breaks (but not after block elements)
  html = html.replace(/(?<!<\/li>|<\/h[123]>|<\/table>|<\/div>|<\/pre>|<\/ul>|<hr[^>]*>)\n/g, '<br>')

  return { html, images }
}

function processMarkdownTables(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i] ?? ''

    // Check if this line could be a table header (contains |)
    if (line.includes('|') && i + 1 < lines.length) {
      const nextLine = lines[i + 1] ?? ''

      // Check if next line is a separator (contains | and -)
      if (nextLine.match(/^\|?[\s-:|]+\|[\s-:|]*$/)) {
        // This is a table - parse it
        const tableLines: string[] = [line]
        let j = i + 1

        // Collect all table lines
        while (j < lines.length && (lines[j]?.includes('|') ?? false)) {
          tableLines.push(lines[j]!)
          j++
        }

        // Convert to HTML table
        const tableHtml = convertTableToHtml(tableLines)
        result.push(tableHtml)
        i = j
        continue
      }
    }

    result.push(line)
    i++
  }

  return result.join('\n')
}

function convertTableToHtml(lines: string[]): string {
  if (lines.length < 2) return lines.join('\n')

  const parseRow = (line: string): string[] => {
    return line
      .split('|')
      .map(cell => cell.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1 || arr.length <= 2)
      .filter(cell => cell !== '')
  }

  const headerCells = parseRow(lines[0] ?? '')
  // Skip separator line (index 1)
  const bodyRows = lines.slice(2).map(parseRow)

  let html = '<div class="overflow-x-auto my-4"><table class="w-full border-collapse text-sm">'

  // Header
  html += '<thead><tr class="border-b border-border bg-secondary/50">'
  for (const cell of headerCells) {
    html += `<th class="px-3 py-2 text-left font-semibold text-foreground">${cell}</th>`
  }
  html += '</tr></thead>'

  // Body
  html += '<tbody>'
  for (const row of bodyRows) {
    html += '<tr class="border-b border-border/50 hover:bg-secondary/30">'
    for (const cell of row) {
      html += `<td class="px-3 py-2 text-muted-foreground">${cell}</td>`
    }
    html += '</tr>'
  }
  html += '</tbody></table></div>'

  return html
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
