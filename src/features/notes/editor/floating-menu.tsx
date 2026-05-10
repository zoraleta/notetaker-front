import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react'
import { Bold, Italic, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FloatingMenuProps {
  editor: Editor
}

export function FloatingToolbar({ editor }: FloatingMenuProps) {
  function handleLink() {
    const url = window.prompt('URL ссылки:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-md"
    >
      <Button
        variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-7 w-7"
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="Жирный"
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-7 w-7"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Курсив"
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={editor.isActive('link') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-7 w-7"
        onClick={handleLink}
        aria-label="Ссылка"
      >
        <Link className="h-3.5 w-3.5" />
      </Button>
    </BubbleMenu>
  )
}
