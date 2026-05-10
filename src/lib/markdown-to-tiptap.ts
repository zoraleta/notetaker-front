// Конвертирует markdown-строку в TipTap-совместимый JSON.
// Поддерживает: ## / ### заголовки, - списки, **bold**, параграфы.
// Используется при создании заметки из AI-результата (мерж, упаковка).

export function markdownToTiptapJson(md: string): Record<string, unknown> {
  const lines = md.split('\n')
  const content: unknown[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('### ')) {
      content.push({ type: 'heading', attrs: { level: 3 }, content: parseInline(line.slice(4)) })
      i++
      continue
    }

    if (line.startsWith('## ')) {
      content.push({ type: 'heading', attrs: { level: 2 }, content: parseInline(line.slice(3)) })
      i++
      continue
    }

    if (line.startsWith('# ')) {
      content.push({ type: 'heading', attrs: { level: 1 }, content: parseInline(line.slice(2)) })
      i++
      continue
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: unknown[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInline(lines[i].slice(2)) }],
        })
        i++
      }
      content.push({ type: 'bulletList', content: items })
      continue
    }

    if (line.trim() === '') {
      i++
      continue
    }

    content.push({ type: 'paragraph', content: parseInline(line) })
    i++
  }

  if (content.length === 0) {
    content.push({ type: 'paragraph' })
  }

  return { type: 'doc', content }
}

function parseInline(text: string): unknown[] {
  const nodes: unknown[] = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }
    nodes.push({ type: 'text', text: match[1], marks: [{ type: 'bold' }] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', text: '' }]
}
