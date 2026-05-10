import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { Sparkles } from 'lucide-react'
import { slashItems } from './items'

interface SlashMenuProps {
  editor: Editor
  position: { top: number; left: number }
  query: string
  slashPos: number
  onClose: () => void
  onLinkCommand: () => void
}

export function SlashMenu({ editor, position, query, slashPos, onClose, onLinkCommand }: SlashMenuProps) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = slashItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()),
  )

  const filteredRef = useRef(filtered)
  const selectedIdxRef = useRef(selectedIdx)
  const onCloseRef = useRef(onClose)
  const onLinkCommandRef = useRef(onLinkCommand)
  const editorRef = useRef(editor)
  const queryRef = useRef(query)
  const slashPosRef = useRef(slashPos)
  filteredRef.current = filtered
  selectedIdxRef.current = selectedIdx
  onCloseRef.current = onClose
  onLinkCommandRef.current = onLinkCommand
  editorRef.current = editor
  queryRef.current = query
  slashPosRef.current = slashPos

  const [adjustedPos, setAdjustedPos] = useState(position)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let { top, left } = position
    if (left + rect.width > vw - 8) left = vw - rect.width - 8
    if (left < 8) left = 8
    if (top + rect.height > vh - 8) top = position.top - rect.height - 8
    if (top < 8) top = 8
    setAdjustedPos({ top, left })
  }, [position])

  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const active = container.querySelector<HTMLElement>('.bg-accent')
    active?.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const items = filteredRef.current
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx((i) => (i + 1) % items.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx((i) => (i - 1 + items.length) % items.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = items[selectedIdxRef.current]
        if (item) {
          const ed = editorRef.current
          const from = slashPosRef.current
          const to = from + queryRef.current.length + 1
          onCloseRef.current()
          if (item.id === 'url-summary') {
            onLinkCommandRef.current()
          } else {
            ed.chain().focus().deleteRange({ from, to }).run()
            item.command(ed)
          }
        }
      } else if (e.key === 'Escape') {
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', handleKey, { capture: true })
    return () => document.removeEventListener('keydown', handleKey, { capture: true })
  }, [])

  function selectItem(item: (typeof slashItems)[0]) {
    const from = slashPos
    const to = from + query.length + 1
    onClose()
    if (item.id === 'url-summary') {
      onLinkCommand()
    } else {
      editor.chain().focus().deleteRange({ from, to }).run()
      item.command(editor)
    }
  }

  if (!filtered.length) return null

  const groups = ['Блоки', 'AI'] as const

  return (
    <div
      ref={ref}
      style={{ top: adjustedPos.top, left: adjustedPos.left }}
      className="fixed z-50 w-64 rounded-lg border bg-popover shadow-md max-h-72 overflow-y-auto"
    >
      {groups.map((group) => {
        const items = filtered.filter((i) => i.group === group)
        if (!items.length) return null
        return (
          <div key={group}>
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">{group}</div>
            {items.map((item) => {
              const globalIdx = filtered.indexOf(item)
              return (
                <button
                  key={item.id}
                  onClick={() => selectItem(item)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                    globalIdx === selectedIdx ? 'bg-accent' : ''
                  }`}
                >
                  {item.group === 'AI' && <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
