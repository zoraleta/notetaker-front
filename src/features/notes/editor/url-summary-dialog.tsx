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
  onCloseSlash: () => void
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
}

function markdownToHtml(md: string): string {
  return md
    .split(/\n\n+/)
    .map((block) => {
      block = block.trim()
      if (!block) return ''
      if (block.startsWith('### ')) return `<h3>${inlineMarkdown(block.slice(4))}</h3>`
      if (block.startsWith('## ')) return `<h2>${inlineMarkdown(block.slice(3))}</h2>`
      if (block.startsWith('# ')) return `<h1>${inlineMarkdown(block.slice(2))}</h1>`
      const lines = block.split('\n').filter(Boolean)
      if (lines.every((l) => /^\d+\.\s/.test(l.trim()))) {
        return `<ol>${lines.map((l) => `<li>${inlineMarkdown(l.replace(/^\d+\.\s/, ''))}</li>`).join('')}</ol>`
      }
      if (lines.every((l) => /^[-*]\s/.test(l.trim()))) {
        return `<ul>${lines.map((l) => `<li>${inlineMarkdown(l.replace(/^[-*]\s/, ''))}</li>`).join('')}</ul>`
      }
      return `<p>${inlineMarkdown(block.replace(/\n/g, '<br>'))}</p>`
    })
    .filter(Boolean)
    .join('')
}

export function UrlSummaryDialog({ editor, open, onOpenChange, onCloseSlash }: UrlSummaryDialogProps) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setIsLoading(true)
    const submittedUrl = url
    setUrl('')
    onOpenChange(false)

    editor.chain().focus()
      .insertContent({ type: 'loadingPlaceholder', attrs: { url: submittedUrl } })
      .run()
    onCloseSlash()

    function removeLoadingNode(): number {
      let loadingPos = -1
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'loadingPlaceholder') { loadingPos = pos; return false }
      })
      if (loadingPos >= 0) {
        editor.chain().deleteRange({ from: loadingPos, to: loadingPos + 1 }).run()
      }
      return loadingPos
    }

    try {
      const { stream, title } = await summarizeUrl(submittedUrl)

      const insertPos = removeLoadingNode()
      const pos = insertPos >= 0 ? insertPos : editor.state.doc.content.size - 1
      editor.commands.insertContentAt(pos,
        `<hr><p><strong>✦ <a href="${submittedUrl}">${title}</a></strong></p>`,
      )
      onCloseSlash()

      const contentPos = editor.state.doc.content.size - 1
      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data) as { response?: string }
            if (parsed.response) accumulated += parsed.response
          } catch {
            // пропускаем неполные/служебные строки
          }
        }
      }

      const html = markdownToHtml(accumulated) || '<p>Пустой ответ.</p>'
      editor.commands.insertContentAt(contentPos, html)
    } catch (error) {
      const insertPos = removeLoadingNode()
      const pos = insertPos >= 0 ? insertPos : editor.state.doc.content.size - 1
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
      editor.commands.insertContentAt(pos, `<p><em>Ошибка: ${message}</em></p>`)
    } finally {
      setIsLoading(false)
      onCloseSlash()
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
            {!isLoading && 'Получить саммари'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
