import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Square, Loader2, CheckSquare, PlusSquare } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { discussNote, formatForNote } from '@/features/ai/api'
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
  onAddToNote: (markdown: string) => void
}

export function DiscussSheet({ note, open, onOpenChange, onAddToNote }: DiscussSheetProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set())
  const [isFormatting, setIsFormatting] = useState(false)
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

  function toggleSelect(index: number) {
    if (isStreaming || isFormatting) return
    setSelectedIndexes((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  function clearSelection() {
    setSelectedIndexes(new Set())
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

  async function handleAddToNote() {
    if (selectedIndexes.size === 0 || isFormatting) return
    const selected = [...selectedIndexes].sort((a, b) => a - b).map((i) => messages[i])
    setIsFormatting(true)

    try {
      const res = await formatForNote(selected)
      if (!res.ok || !res.body) throw new Error('Ошибка форматирования')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      const processLine = (line: string) => {
        if (!line.startsWith('data: ')) return
        const data = line.slice(6)
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data) as { response?: string }
          if (parsed.response) accumulated += parsed.response
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

      if (accumulated.trim()) {
        onAddToNote(accumulated.trim())
        clearSelection()
      }
    } catch {
      // ошибка уже будет видна пользователю через отсутствие результата
    } finally {
      setIsFormatting(false)
    }
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
            {messages.map((msg, i) => {
              const isSelected = selectedIndexes.has(i)
              return (
                <div
                  key={i}
                  className={msg.role === 'user' ? 'text-right' : ''}
                  onClick={() => toggleSelect(i)}
                >
                  {msg.role === 'user' ? (
                    <span
                      className={[
                        'inline-block rounded-lg px-3 py-2 text-sm text-primary-foreground max-w-[85%] cursor-pointer select-none transition-colors',
                        isSelected ? 'bg-primary/70 ring-2 ring-primary' : 'bg-primary hover:bg-primary/90',
                      ].join(' ')}
                    >
                      {msg.content}
                    </span>
                  ) : (
                    <div
                      className={[
                        'rounded-lg border px-3 py-2 text-sm cursor-pointer select-none transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-muted hover:bg-muted/70',
                      ].join(' ')}
                    >
                      {msg.content
                        ? <MarkdownText content={msg.content} />
                        : <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {selectedIndexes.size > 0 && (
          <div className="flex items-center gap-2 border-t pt-2 pb-1">
            <Button
              size="sm"
              className="flex-1 gap-2"
              onClick={handleAddToNote}
              disabled={isFormatting}
            >
              {isFormatting
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <PlusSquare className="h-3.5 w-3.5" />}
              {isFormatting ? 'Форматирование...' : `Добавить в заметку (${selectedIndexes.size})`}
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection} disabled={isFormatting}>
              Отмена
            </Button>
          </div>
        )}

        {messages.length > 0 && selectedIndexes.size === 0 && (
          <p className="pb-1 text-center text-xs text-muted-foreground">
            <CheckSquare className="mr-1 inline h-3 w-3" />
            Нажмите на сообщение, чтобы выбрать его
          </p>
        )}

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
              disabled={isStreaming || isFormatting}
              className="flex-1 resize-none overflow-y-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ maxHeight: '160px' }}
            />
            {isStreaming ? (
              <Button size="icon" variant="outline" onClick={handleStop} aria-label="Остановить">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="icon" onClick={handleSend} disabled={!input.trim() || isFormatting} aria-label="Отправить">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
