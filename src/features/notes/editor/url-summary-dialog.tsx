import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { summarizeUrl } from '@/features/ai/api'

interface UrlSummaryDialogProps {
  editor: Editor
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UrlSummaryDialog({ editor, open, onOpenChange }: UrlSummaryDialogProps) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    onOpenChange(false)

    editor.chain().focus().insertContent(`<hr>`).run()

    const placeholder = `<div data-source="ai-summary" class="border-l-2 border-border bg-muted pl-4 py-2 my-2"><p><strong><span data-lucide="sparkles"></span> Саммари: ${url}</strong></p><p>Загрузка...</p></div>`
    editor.chain().focus().insertContent(placeholder).run()

    try {
      const stream = await summarizeUrl(url)
      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      const { state } = editor
      const pos = state.doc.content.size - 2

      editor.commands.insertContentAt(pos, '<p></p>')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data) as { response?: string }
              if (parsed.response) accumulated += parsed.response
            } catch {
              accumulated += data
            }
          }
        }
      }

      editor.chain().focus().insertContent(`<p>${accumulated}</p>`).run()
    } catch {
      editor.chain().focus().insertContent('<p><em>Не удалось получить саммари.</em></p>').run()
    } finally {
      setLoading(false)
      setUrl('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Саммари по ссылке
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
            disabled={isLoading}
          />
          <Button type="submit" className="w-full gap-2" disabled={!url.trim() || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isLoading ? 'Загрузка...' : 'Получить саммари'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
