import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Loader2 } from 'lucide-react'
import { Command, CommandInput, CommandList, CommandGroup, CommandItem } from '@/components/ui/command'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useNotes, useCreateNote } from '@/features/notes/hooks/use-notes'
import { useSemanticSearch } from '@/features/ai/hooks/use-ai'
import { useDebounce } from '@/hooks/use-debounce'
import type { Note } from '@/features/notes/schema'

interface CmdKProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CmdK({ open, onOpenChange }: CmdKProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 350)
  const { data: allNotes } = useNotes()
  const { data: searchHits, isFetching: isSearching } = useSemanticSearch(debouncedQuery)
  const createNote = useCreateNote()

  const handleSelect = useCallback(
    (id: string) => {
      onOpenChange(false)
      navigate(`/notes/${id}`)
    },
    [navigate, onOpenChange],
  )

  const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] }

  async function handleCreate() {
    const note = await createNote.mutateAsync({ title: query || 'Новая заметка', contentJson: EMPTY_DOC, contentText: '' })
    onOpenChange(false)
    navigate(`/notes/${note.id}`)
  }

  // Когда запрос есть — показываем семантические результаты (бэк вернул title).
  // Когда запроса нет — показываем все заметки из кеша.
  const displayNotes: Array<{ id: string; title: string }> = debouncedQuery.trim()
    ? (searchHits ?? []).map((hit) => ({ id: hit.noteId, title: hit.title }))
    : (allNotes ?? []).map((n: Note) => ({ id: n.id, title: n.title }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
      <CommandInput placeholder="Семантический поиск..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandGroup heading="Действия">
          <CommandItem onSelect={handleCreate} disabled={createNote.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Создать «{query || 'Новая заметка'}»
          </CommandItem>
        </CommandGroup>
        {isSearching && debouncedQuery.trim() ? (
          <CommandGroup heading="Поиск">
            <CommandItem disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ищу...
            </CommandItem>
          </CommandGroup>
        ) : debouncedQuery.trim() && displayNotes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Ничего не найдено.</p>
        ) : displayNotes.length > 0 ? (
          <CommandGroup heading={debouncedQuery.trim() ? 'Результаты' : 'Заметки'}>
            {displayNotes.map((note) => (
              <CommandItem key={note.id} onSelect={() => handleSelect(note.id)}>
                <FileText className="mr-2 h-4 w-4" />
                {note.title || 'Без названия'}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
