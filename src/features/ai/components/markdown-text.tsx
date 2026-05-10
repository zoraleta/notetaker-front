import { Fragment } from 'react'

interface Props {
  content: string
  className?: string
}

interface Segment {
  type: 'bold' | 'italic' | 'text'
  value: string
}

function parseInline(text: string): Segment[] {
  const segments: Segment[] = []
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      segments.push({ type: 'text', value: text.slice(last, m.index) })
    }
    if (m[2] !== undefined) {
      segments.push({ type: 'bold', value: m[2] })
    } else if (m[3] !== undefined) {
      segments.push({ type: 'italic', value: m[3] })
    }
    last = m.index + m[0].length
  }
  if (last < text.length) {
    segments.push({ type: 'text', value: text.slice(last) })
  }
  return segments
}

function renderInline(text: string) {
  return parseInline(text).map((seg, i) => {
    if (seg.type === 'bold') return <strong key={i}>{seg.value}</strong>
    if (seg.type === 'italic') return <em key={i}>{seg.value}</em>
    return <Fragment key={i}>{seg.value}</Fragment>
  })
}

type Block =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'li'; text: string }
  | { type: 'p'; text: string }

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n')
  const blocks: Block[] = []

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (/^### (.+)/.test(line)) {
      blocks.push({ type: 'h3', text: line.slice(4) })
    } else if (/^## (.+)/.test(line)) {
      blocks.push({ type: 'h2', text: line.slice(3) })
    } else if (/^# (.+)/.test(line)) {
      blocks.push({ type: 'h1', text: line.slice(2) })
    } else if (/^[-*•] (.+)/.test(line)) {
      blocks.push({ type: 'li', text: line.slice(2) })
    } else {
      blocks.push({ type: 'p', text: line })
    }
  }
  return blocks
}

export function MarkdownText({ content, className }: Props) {
  const blocks = parseBlocks(content)

  const nodes: React.ReactNode[] = []
  let listItems: string[] = []

  const flushList = (key: string) => {
    if (listItems.length === 0) return
    nodes.push(
      <ul key={key} className="my-1 list-disc pl-4 space-y-0.5">
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>,
    )
    listItems = []
  }

  blocks.forEach((block, idx) => {
    if (block.type === 'li') {
      listItems.push(block.text)
      return
    }

    flushList(`list-${idx}`)

    if (block.type === 'h1') {
      nodes.push(<p key={idx} className="font-bold text-base mt-2">{renderInline(block.text)}</p>)
    } else if (block.type === 'h2') {
      nodes.push(<p key={idx} className="font-semibold mt-2">{renderInline(block.text)}</p>)
    } else if (block.type === 'h3') {
      nodes.push(<p key={idx} className="font-medium mt-1">{renderInline(block.text)}</p>)
    } else if (block.text.trim() === '') {
      nodes.push(<div key={idx} className="h-2" />)
    } else {
      nodes.push(<p key={idx}>{renderInline(block.text)}</p>)
    }
  })
  flushList('list-end')

  return <div className={className}>{nodes}</div>
}
