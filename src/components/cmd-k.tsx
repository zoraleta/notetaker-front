import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { useNotes, useCreateNote } from '@/features/notes/hooks/use-notes'
import { useDebounce } from '@/hooks/use-debounce'

interface CmdKProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CmdK({ open, onOpenChange }: CmdKProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)
  const { data: notes } = useNotes(debouncedQuery || undefined)
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

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Поиск заметок..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>Заметок не найдено.</CommandEmpty>
        <CommandGroup heading="Действия">
          <CommandItem onSelect={handleCreate} disabled={createNote.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Создать «{query || 'Новая заметка'}»
          </CommandItem>
        </CommandGroup>
        {(notes?.length ?? 0) > 0 && (
          <CommandGroup heading="Заметки">
            {notes?.map((note) => (
              <CommandItem key={note.id} onSelect={() => handleSelect(note.id)}>
                <FileText className="mr-2 h-4 w-4" />
                {note.title || 'Без названия'}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
