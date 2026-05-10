import { z } from 'zod'
import { http } from '@/lib/http'
import { noteSchema, notesArraySchema } from './schema'
import type { CreateNoteInput, UpdateNoteInput } from './schema'

const similarNoteHitSchema = z.object({ id: z.string(), title: z.string(), score: z.number() })
const similarNoteHitsArraySchema = z.array(similarNoteHitSchema)
export type SimilarNoteHit = z.infer<typeof similarNoteHitSchema>

export const notesKeys = {
  all: ['notes'] as const,
  lists: () => [...notesKeys.all, 'list'] as const,
  list: (q?: string) => [...notesKeys.lists(), q ?? null] as const,
  detail: (id: string) => [...notesKeys.all, 'detail', id] as const,
  similar: (id: string) => [...notesKeys.all, 'similar', id] as const,
}

export async function fetchNotes(q?: string) {
  const res = await http.get('/notes', { params: q ? { q } : undefined })
  return notesArraySchema.parse(res.data)
}

export async function fetchNote(id: string) {
  const res = await http.get(`/notes/${id}`)
  return noteSchema.parse(res.data)
}

export async function createNote(data: CreateNoteInput) {
  const res = await http.post('/notes', data)
  return noteSchema.parse(res.data)
}

export async function updateNote(id: string, data: UpdateNoteInput) {
  const res = await http.patch(`/notes/${id}`, data)
  return noteSchema.parse(res.data)
}

export async function deleteNote(id: string) {
  await http.delete(`/notes/${id}`)
}

export async function fetchSimilarNotes(id: string) {
  const res = await http.get(`/notes/${id}/similar`)
  return similarNoteHitsArraySchema.parse(res.data)
}

export async function mergeNotes(activeNoteId: string, noteIds: string[]): Promise<string> {
  const res = await http.post('/ai/merge', { activeNoteId, noteIds })
  return z.string().parse(res.data)
}
