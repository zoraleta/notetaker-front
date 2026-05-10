import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Link } from '@tiptap/extension-link'

export const editorExtensions = [
  StarterKit,
  Placeholder.configure({
    placeholder: "Нажмите '/' для команд или начните писать...",
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { class: 'underline underline-offset-2 text-primary' },
  }),
]
