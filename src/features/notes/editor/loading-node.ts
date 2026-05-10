import { Node } from '@tiptap/core'

export const LoadingPlaceholder = Node.create({
  name: 'loadingPlaceholder',
  group: 'block',
  atom: true,

  addAttributes() {
    return { url: { default: '' } }
  },

  parseHTML() {
    return [{ tag: 'div[data-loading-placeholder]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-loading-placeholder': '', ...HTMLAttributes }]
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div')
      dom.className = 'flex items-center gap-2 text-muted-foreground py-2 text-sm select-none'
      const url = node.attrs.url as string
      dom.innerHTML = `
        <svg class="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Делаю саммари с <a href="${url}" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 text-primary">${url}</a>…</span>
      `
      return { dom }
    }
  },
})
