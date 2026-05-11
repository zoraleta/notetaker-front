import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Merge, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useSimilarNotes, useMergeNotes } from '@/features/notes/hooks/use-notes'

interface SimilarNotesProps {
  noteId: string
  onMergeComplete: (mergedText: string, selectedNoteIds: string[]) => Promise<void>
}

export function SimilarNotes({ noteId, onMergeComplete }: SimilarNotesProps) {
  const navigate = useNavigate()
  const { data: notes, isLoading, refetch, isFetching } = useSimilarNotes(noteId)
  const mergeMutation = useMergeNotes()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [mergeError, setMergeError] = useState<string | null>(null)

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleMerge() {
    setMergeError(null)
    try {
      const noteIds = Array.from(selectedIds)
      const result = await mergeMutation.mutateAsync({ activeNoteId: noteId, noteIds })
      setSelectedIds(new Set())
      await onMergeComplete(result, noteIds)
    } catch {
      setMergeError('Не удалось объединить заметки')
    }
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Похожие</h3>
          <p className="text-[10px] text-muted-foreground/60">Новые заметки проанализируются примерно через минуту</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          title="Обновить"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
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
        <>
          <div className="space-y-1">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
              >
                <input
                  type="checkbox"
                  id={`similar-${note.id}`}
                  checked={selectedIds.has(note.id)}
                  onChange={() => toggleSelect(note.id)}
                  className="h-3.5 w-3.5 shrink-0 accent-primary"
                />
                <button
                  onClick={() => navigate(`/notes/${note.id}`)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{note.title || 'Без названия'}</span>
                </button>
              </div>
            ))}
          </div>

          {selectedIds.size > 0 && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-3 w-full gap-1.5"
              onClick={handleMerge}
              disabled={mergeMutation.isPending}
            >
              <Merge className="h-3.5 w-3.5" />
              {mergeMutation.isPending ? 'Объединяем...' : `Объединить (${selectedIds.size})`}
            </Button>
          )}
          {mergeError && (
            <p className="mt-2 text-xs text-destructive">{mergeError}</p>
          )}
        </>
      ))}
    </div>
  )
}
