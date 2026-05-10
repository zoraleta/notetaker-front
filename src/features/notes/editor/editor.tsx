import { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { editorExtensions } from './extensions'
import { FloatingToolbar } from './floating-menu'
import { SlashMenu } from './slash-menu/slash-menu'
import { UrlSummaryDialog } from './url-summary-dialog'
import { markdownToTiptapJson } from '@/lib/markdown-to-tiptap'
import { cn } from '@/lib/utils'

interface EditorUpdate {
  contentJson: Record<string, unknown>
  contentText: string
}

interface NoteEditorProps {
  contentJson: unknown
  onChange: (update: EditorUpdate) => void
  className?: string
}

export interface NoteEditorHandle {
  setContent: (text: string) => void
  appendMarkdown: (markdown: string) => void
}

export const NoteEditor = forwardRef<NoteEditorHandle, NoteEditorProps>(
  function NoteEditor({ contentJson, onChange, className }, ref) {
  const [slashState, setSlashState] = useState<{
    open: boolean
    position: { top: number; left: number }
    query: string
    slashPos: number
  } | null>(null)
  const [urlDialogOpen, setUrlDialogOpen] = useState(false)
  const skipOnUpdate = useRef(false)

  const editor = useEditor({
    extensions: editorExtensions,
    content: contentJson as Parameters<typeof useEditor>[0]['content'],
    onUpdate({ editor }) {
      if (skipOnUpdate.current) return
      onChange({ contentJson: editor.getJSON() as Record<string, unknown>, contentText: editor.getText() })
      checkSlash(editor)
    },
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-sm max-w-none focus:outline-none min-h-[60vh]',
      },
    },
  })

  // Синхронизация не нужна: редактор инициализируется один раз из contentJson,
  // потом является source of truth. Внешние изменения contentJson игнорируются.

  useImperativeHandle(ref, () => ({
    setContent: (markdown: string) => {
      if (!editor) return
      const json = markdownToTiptapJson(markdown)
      skipOnUpdate.current = true
      editor.chain().setContent(json).run()
      skipOnUpdate.current = false
      onChange({ contentJson: editor.getJSON() as Record<string, unknown>, contentText: editor.getText() })
    },
    appendMarkdown: (markdown: string) => {
      if (!editor) return
      const json = markdownToTiptapJson(markdown)
      const nodes = (json.content as unknown[]) ?? []
      const pos = editor.state.doc.content.size - 1
      editor.commands.insertContentAt(pos, [{ type: 'horizontalRule' }, ...nodes] as Parameters<typeof editor.commands.insertContentAt>[1])
    },
  }), [editor, onChange])

  const checkSlash = useCallback(
    (ed: NonNullable<typeof editor>) => {
      const { state } = ed
      const { from } = state.selection
      const textBefore = state.doc.textBetween(Math.max(0, from - 50), from, '\n', '\n')
      const slashIdx = textBefore.lastIndexOf('/')

      if (slashIdx === -1 || textBefore.slice(slashIdx + 1).includes('\n')) {
        setSlashState(null)
        return
      }

      const query = textBefore.slice(slashIdx + 1)
      const domPos = ed.view.coordsAtPos(from - query.length - 1)

      setSlashState({
        open: true,
        position: { top: domPos.bottom + 4, left: domPos.left },
        query,
        slashPos: from - query.length - 1,
      })
    },
    [],
  )

  function closeSlash() {
    setSlashState(null)
  }

  function handleLinkCommand() {
    if (!editor || !slashState) return
    editor.chain().focus().deleteRange({ from: slashState.slashPos, to: slashState.slashPos + slashState.query.length + 1 }).run()
    setUrlDialogOpen(true)
  }

  if (!editor) return null

  return (
    <div className={cn('relative', className)}>
      <FloatingToolbar editor={editor} />
      <EditorContent editor={editor} />

      {slashState?.open && (
        <SlashMenu
          editor={editor}
          position={slashState.position}
          query={slashState.query}
          slashPos={slashState.slashPos}
          onClose={closeSlash}
          onLinkCommand={handleLinkCommand}
        />
      )}

      <UrlSummaryDialog editor={editor} open={urlDialogOpen} onOpenChange={setUrlDialogOpen} onCloseSlash={closeSlash} />
    </div>
  )
})
