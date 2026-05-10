import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useSimilarNotes } from '@/features/notes/hooks/use-notes'

interface SimilarNotesProps {
  noteId: string
}

export function SimilarNotes({ noteId }: SimilarNotesProps) {
  const navigate = useNavigate()
  const { data: notes, isLoading } = useSimilarNotes(noteId)

  return (
    <div className="p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Похожие</h3>
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      )}
      {!isLoading && (!notes?.length ? (
        <p className="text-xs text-muted-foreground">Нет похожих заметок</p>
      ) : (
        <div className="space-y-1">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => navigate(`/notes/${note.id}`)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{note.title || 'Без названия'}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
