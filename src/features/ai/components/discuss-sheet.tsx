import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Square, Loader2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { discussNote, packIntoProject } from '@/features/ai/api'
import { useCreateProjectFromPack } from '@/features/projects/hooks/use-projects'
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
  const createProject = useCreateProjectFromPack()
  const [packing, setPacking] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    if (!input.trim() || isStreaming) return
    const userMsg = input.trim()
    setInput('')
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

  async function handlePack() {
    setPacking(true)
    try {
      const noteContext = `Заметка: "${note.title}"\n${note.contentText}`
      const dialogLines = messages.map((m) =>
        `${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`,
      )
      const dialog = [noteContext, ...dialogLines].join('\n\n')
      const pack = await packIntoProject(dialog)
      await createProject.mutateAsync({
        name: pack.goal,
        pack: { goal: pack.goal, stages: pack.stages, openQuestions: pack.openQuestions },
        sourceNoteIds: [note.id],
      })
    } finally {
      setPacking(false)
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
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'text-right' : ''}>
                {msg.role === 'user' ? (
                  <span className="inline-block rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground max-w-[85%]">
                    {msg.content}
                  </span>
                ) : (
                  <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                    {msg.content || <Skeleton className="h-4 w-40" />}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={handlePack}
            disabled={packing || createProject.isPending}
          >
            {packing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Упаковать в проект
          </Button>
          <div className="flex gap-2">
            <Input
              placeholder="Напишите сообщение..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isStreaming}
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
