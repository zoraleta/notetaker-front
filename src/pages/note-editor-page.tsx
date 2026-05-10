import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Sparkles, MessagesSquare, Loader2, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { NoteEditor, type NoteEditorHandle } from '@/features/notes/editor/editor'
import { DiscussSheet } from '@/features/ai/components/discuss-sheet'
import { SimilarNotes } from '@/features/notes/components/similar-notes'
import { GroupSuggestions } from '@/features/notes/components/group-suggestions'
import { useNote, useUpdateNote, useDeleteNote } from '@/features/notes/hooks/use-notes'
import { createNote, deleteNote as deleteNoteApi, notesKeys } from '@/features/notes/api'
import { markdownToTiptapJson } from '@/lib/markdown-to-tiptap'
import { useDebounce } from '@/hooks/use-debounce'
import { structurizeNote } from '@/features/ai/api'

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
  // key={id} форсирует полный remount при переходе между заметками
  // (например, клик в SimilarNotes), иначе tiptap-редактор и локальный state
  // страницы остаются от предыдущей заметки и могут перезаписать новую.
  return <NoteEditorPageInner key={id} id={id!} />
}

function NoteEditorPageInner({ id }: { id: string }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: note, isLoading, isError } = useNote(id)
  const updateNote = useUpdateNote(id)
  const deleteNote = useDeleteNote()
  const [discussOpen, setDiscussOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isStructurizing, setIsStructurizing] = useState(false)
  const [structurizeError, setStructurizeError] = useState(false)
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
  const editorRef = useRef<NoteEditorHandle>(null)

  const handleMergeComplete = useCallback(async (mergedText: string, selectedNoteIds: string[]) => {
    const contentJson = markdownToTiptapJson(mergedText)
    const title = extractTitle(mergedText) || 'Объединённая заметка'
    const newNote = await createNote({ title, contentJson, contentText: mergedText })
    await Promise.all([id, ...selectedNoteIds].map((noteId) => deleteNoteApi(noteId)))
    await qc.invalidateQueries({ queryKey: notesKeys.lists() })
    navigate(`/notes/${newNote.id}`, { replace: true })
  }, [id, navigate, qc])

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

  async function handleStructurize() {
    const text = editorContent?.contentText ?? note?.contentText ?? ''
    if (!text.trim()) return
    setIsStructurizing(true)
    setStructurizeError(false)
    try {
      const structured = await structurizeNote(text)
      editorRef.current?.setContent(structured)
    } catch {
      setStructurizeError(true)
      setTimeout(() => setStructurizeError(false), 3000)
    } finally {
      setIsStructurizing(false)
    }
  }

  async function handleDeleteConfirm() {
    await deleteNote.mutateAsync(id)
    navigate('/dashboard')
  }

  if (isLoading) return <div className="mx-auto max-w-3xl px-6 py-8"><EditorSkeleton /></div>
  if (isError || !note) return <div className="p-8 text-sm text-destructive">Не удалось загрузить заметку</div>

  return (
    <div className="flex h-full min-h-0">
      <div className="flex flex-1 flex-col min-h-0">
        <div className="shrink-0 flex items-center gap-2 px-6 py-3 border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Назад">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          {saveStatus === 'saving' && <span className="text-xs text-muted-foreground">Сохраняем...</span>}
          {saveStatus === 'saved' && <span className="text-xs text-muted-foreground">Сохранено</span>}
          {structurizeError && <span className="text-xs text-destructive">Ошибка структурирования</span>}
          <Button variant="ghost" size="icon" onClick={handleStructurize} disabled={isStructurizing} aria-label="Структурировать текст">
            {isStructurizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDiscussOpen(true)} aria-label="Обсудить заметку">
            <MessagesSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteNote.isPending}
            aria-label="Удалить заметку"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-3xl px-6 py-8">
            <NoteEditor
              ref={editorRef}
              contentJson={note.contentJson}
              onChange={(update) => {
                initialLoad.current = false
                setEditorContent(update)
              }}
            />
          </div>
        </div>
      </div>

      <aside className="hidden w-64 shrink-0 overflow-auto border-l lg:block">
        <GroupSuggestions
          noteId={id}
          noteText={debouncedContent?.contentText ?? note.contentText}
          currentGroupId={note.groupId}
        />
        <SimilarNotes noteId={id} onMergeComplete={handleMergeComplete} />
      </aside>

      <DiscussSheet
        note={note}
        open={discussOpen}
        onOpenChange={setDiscussOpen}
        onAddToNote={(markdown) => editorRef.current?.appendMarkdown(markdown)}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить заметку?</DialogTitle>
            <DialogDescription>Это действие нельзя отменить.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteNote.isPending}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function extractTitle(text: string): string {
  const firstLine = text.split('\n').find((line) => line.trim().length > 0) ?? ''
  return firstLine.trim().replace(/^#+\s*/, '').slice(0, 80)
}
