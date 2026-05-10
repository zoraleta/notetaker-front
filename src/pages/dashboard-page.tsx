import { useNavigate } from 'react-router-dom'
import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotes, useCreateNote } from '@/features/notes/hooks/use-notes'
import type { Note } from '@/features/notes/schema'

function NoteCard({ note, onClick }: { note: Note; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent"
    >
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">{note.title || 'Без названия'}</p>
          {note.contentText && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {note.contentText.slice(0, 120)}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {new Date(note.updatedAt).toLocaleDateString('ru-RU')}
          </p>
        </div>
      </div>
    </button>
  )
}

function NotesListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <FileText className="h-12 w-12 text-muted-foreground/40" />
      <h2 className="mt-4 text-lg font-medium">Заметок пока нет</h2>
      <p className="mt-1 text-sm text-muted-foreground">Создайте первую заметку, чтобы начать</p>
      <Button className="mt-6 gap-2" onClick={onCreate}>
        <Plus className="h-4 w-4" />
        Новая заметка
      </Button>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: notes, isLoading, isError } = useNotes()
  const createNote = useCreateNote()

  const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] }

  async function handleCreate() {
    const note = await createNote.mutateAsync({ title: 'Новая заметка', contentJson: EMPTY_DOC, contentText: '' })
    navigate(`/notes/${note.id}`)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Все заметки</h1>
        <Button size="sm" className="gap-2" onClick={handleCreate} disabled={createNote.isPending}>
          <Plus className="h-4 w-4" />
          Новая заметка
        </Button>
      </div>

      {isLoading && <NotesListSkeleton />}
      {isError && (
        <p className="text-sm text-destructive">Не удалось загрузить заметки</p>
      )}
      {!isLoading && !isError && (!notes?.length ? (
        <EmptyState onCreate={handleCreate} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onClick={() => navigate(`/notes/${note.id}`)} />
          ))}
        </div>
      ))}
    </div>
  )
}
