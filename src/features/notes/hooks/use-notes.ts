import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotes, fetchNote, createNote, updateNote, deleteNote, fetchSimilarNotes, notesKeys } from '../api'
import type { CreateNoteInput, UpdateNoteInput } from '../schema'

export function useNotes(q?: string) {
  return useQuery({
    queryKey: notesKeys.list(q),
    queryFn: () => fetchNotes(q),
  })
}

export function useNote(id: string) {
  return useQuery({
    queryKey: notesKeys.detail(id),
    queryFn: () => fetchNote(id),
    enabled: !!id,
  })
}

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateNoteInput) => createNote(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: notesKeys.lists() }),
  })
}

export function useUpdateNote(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateNoteInput) => updateNote(id, data),
    onSuccess: (updatedNote) => {
      qc.setQueryData(notesKeys.detail(id), updatedNote)
      qc.invalidateQueries({ queryKey: notesKeys.lists() })
    },
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notesKeys.lists() }),
  })
}

export function useSimilarNotes(id: string) {
  return useQuery({
    queryKey: notesKeys.similar(id),
    queryFn: () => fetchSimilarNotes(id),
    enabled: !!id,
  })
}
