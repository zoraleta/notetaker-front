import type { Editor } from '@tiptap/react'

export interface SlashItem {
  id: string
  title: string
  description: string
  group: 'Блоки' | 'AI'
  command: (editor: Editor) => void
}

export const slashItems: SlashItem[] = [
  {
    id: 'heading-1',
    title: 'Заголовок 1',
    description: 'Большой заголовок',
    group: 'Блоки',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'heading-2',
    title: 'Заголовок 2',
    description: 'Средний заголовок',
    group: 'Блоки',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'heading-3',
    title: 'Заголовок 3',
    description: 'Малый заголовок',
    group: 'Блоки',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bullet-list',
    title: 'Список',
    description: 'Маркированный список',
    group: 'Блоки',
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'ordered-list',
    title: 'Нумерованный список',
    description: 'Упорядоченный список',
    group: 'Блоки',
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'blockquote',
    title: 'Цитата',
    description: 'Блок цитаты',
    group: 'Блоки',
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'code-block',
    title: 'Код',
    description: 'Блок кода',
    group: 'Блоки',
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'url-summary',
    title: 'Ссылка',
    description: 'Саммари по URL (AI)',
    group: 'AI',
    command: () => {
      // Обрабатывается через onLinkCommand в slash-menu.tsx
    },
  },
]
