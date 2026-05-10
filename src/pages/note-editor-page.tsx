import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sparkles, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NoteEditor } from '@/features/notes/editor/editor'
import { DiscussSheet } from '@/features/ai/components/discuss-sheet'
import { SimilarNotes } from '@/features/notes/components/similar-notes'
import { useNote, useUpdateNote, useDeleteNote } from '@/features/notes/hooks/use-notes'
import { useDebounce } from '@/hooks/use-debounce'

function EditorSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  )
}

export function NoteEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: note, isLoading, isError } = useNote(id!)
  const updateNote = useUpdateNote(id!)
  const deleteNote = useDeleteNote()
  const [discussOpen, setDiscussOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle')
  const [editorContent, setEditorContent] = useState<{ contentJson: Record<string, unknown>; contentText: string } | null>(null)
  const debouncedContent = useDebounce(editorContent, 1500)
  const initialLoad = useRef(true)
  // Refs для стабильного save — чтобы useCallback не пересоздавался при каждом
  // изменении note/updateNote и не вызывал бесконечный цикл сохранений.
  const noteRef = useRef(note)
  noteRef.current = note
  const updateNoteRef = useRef(updateNote)
  updateNoteRef.current = updateNote

  const save = useCallback(async (update: { contentJson: Record<string, unknown>; contentText: string }) => {
    if (!noteRef.current) return
    setSaveStatus('saving')
    const title = extractTitle(update.contentText) || 'Без названия'
    await updateNoteRef.current.mutateAsync({ contentJson: update.contentJson, contentText: update.contentText, title })
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }, [])

  useEffect(() => {
    if (!debouncedContent || initialLoad.current) return
    save(debouncedContent)
  }, [debouncedContent, save])

  async function handleDelete() {
    if (!window.confirm('Удалить заметку?')) return
    await deleteNote.mutateAsync(id!)
    navigate('/dashboard')
  }

  if (isLoading) return <div className="mx-auto max-w-3xl px-6 py-8"><EditorSkeleton /></div>
  if (isError || !note) return <div className="p-8 text-sm text-destructive">Не удалось загрузить заметку</div>

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <div className="mb-6 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} aria-label="Назад">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1" />
            {saveStatus === 'saving' && <span className="text-xs text-muted-foreground">Сохраняем...</span>}
            {saveStatus === 'saved' && <span className="text-xs text-muted-foreground">Сохранено</span>}
            <Button variant="ghost" size="icon" onClick={() => setDiscussOpen(true)} aria-label="Обсудить с AI">
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleteNote.isPending}
              aria-label="Удалить заметку"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <NoteEditor
            contentJson={note.contentJson}
            onChange={(update) => {
              initialLoad.current = false
              setEditorContent(update)
            }}
          />
        </div>
      </div>

      <aside className="hidden w-64 shrink-0 overflow-auto border-l lg:block">
        <SimilarNotes noteId={id!} />
      </aside>

      <DiscussSheet note={note} open={discussOpen} onOpenChange={setDiscussOpen} />
    </div>
  )
}

function extractTitle(text: string): string {
  const firstLine = text.split('\n').find((line) => line.trim().length > 0) ?? ''
  return firstLine.trim().slice(0, 80)
}
