import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Square, Loader2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { discussNote } from '@/features/ai/api'
import { MarkdownText } from './markdown-text'
import type { Note } from '@/features/notes/schema'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface DiscussSheetProps {
  note: Note
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DiscussSheet({ note, open, onOpenChange }: DiscussSheetProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function resizeTextarea() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  async function handleSend() {
    if (!input.trim() || isStreaming) return
    const userMsg = input.trim()
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    const updatedMessages: Message[] = [...messages, { role: 'user', content: userMsg }]
    setMessages([...updatedMessages, { role: 'assistant', content: '' }])
    setIsStreaming(true)

    const ac = new AbortController()
    abortRef.current = ac

    try {
      const res = await discussNote(note.id, updatedMessages, ac.signal)
      if (!res.ok || !res.body) throw new Error('Ошибка')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const processLine = (line: string) => {
        if (!line.startsWith('data: ')) return
        const data = line.slice(6)
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data) as { response?: string }
          if (parsed.response) {
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + parsed.response,
              }
              return updated
            })
          }
        } catch {
          // игнорируем невалидный чанк
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          processLine(line)
        }
      }
      if (buffer) processLine(buffer)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: 'Ошибка при получении ответа.' }
          return updated
        })
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md" side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Обсудить заметку
          </SheetTitle>
        </SheetHeader>

        <ScrollArea ref={scrollRef} className="flex-1 pr-1">
          <div className="space-y-4 py-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Задайте вопрос по заметке «{note.title || 'Без названия'}»
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'text-right' : ''}>
                {msg.role === 'user' ? (
                  <span className="inline-block rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground max-w-[85%]">
                    {msg.content}
                  </span>
                ) : (
                  <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                    {msg.content
                      ? <MarkdownText content={msg.content} />
                      : <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="pt-2">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Напишите сообщение..."
              value={input}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setInput(e.target.value)
                resizeTextarea()
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              disabled={isStreaming}
              className="flex-1 resize-none overflow-y-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ maxHeight: '160px' }}
            />
            {isStreaming ? (
              <Button size="icon" variant="outline" onClick={handleStop} aria-label="Остановить">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="icon" onClick={handleSend} disabled={!input.trim()} aria-label="Отправить">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
