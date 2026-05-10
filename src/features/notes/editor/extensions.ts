import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Link } from '@tiptap/extension-link'
import { LoadingPlaceholder } from './loading-node'

export const editorExtensions = [
  StarterKit,
  Placeholder.configure({
    placeholder: "Нажмите '/' для команд или начните писать...",
  }),
  Link.configure({
    openOnClick: true,
    HTMLAttributes: { class: 'underline underline-offset-2 text-primary cursor-pointer hover:text-muted-foreground transition-colors' },
  }),
  LoadingPlaceholder,
]
