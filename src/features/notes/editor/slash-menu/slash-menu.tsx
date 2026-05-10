import { useState, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { Sparkles } from 'lucide-react'
import { slashItems } from './items'

interface SlashMenuProps {
  editor: Editor
  position: { top: number; left: number }
  query: string
  onClose: () => void
  onLinkCommand: () => void
}

export function SlashMenu({ editor, position, query, onClose, onLinkCommand }: SlashMenuProps) {
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
  filteredRef.current = filtered
  selectedIdxRef.current = selectedIdx
  onCloseRef.current = onClose
  onLinkCommandRef.current = onLinkCommand
  editorRef.current = editor

  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

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
          onCloseRef.current()
          if (item.id === 'url-summary') {
            onLinkCommandRef.current()
          } else {
            item.command(editorRef.current)
          }
        }
      } else if (e.key === 'Escape') {
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  function selectItem(item: (typeof slashItems)[0]) {
    onClose()
    if (item.id === 'url-summary') {
      onLinkCommand()
    } else {
      item.command(editor)
    }
  }

  if (!filtered.length) return null

  const groups = ['Блоки', 'AI'] as const

  return (
    <div
      ref={ref}
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 w-64 rounded-lg border bg-popover shadow-md"
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
