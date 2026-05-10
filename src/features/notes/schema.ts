import { z } from 'zod'

export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  contentJson: z.unknown(),
  contentText: z.string(),
  groupId: z.string().nullable(),
  tags: z.array(z.string()),
  isIndexedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const notesArraySchema = z.array(noteSchema)

export const createNoteSchema = z.object({
  title: z.string().optional(),
  contentJson: z.record(z.unknown()),
  contentText: z.string(),
  tags: z.array(z.string()).optional(),
})

export const updateNoteSchema = z.object({
  title: z.string().optional(),
  contentJson: z.record(z.unknown()).optional(),
  contentText: z.string().optional(),
  groupId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
})

export type Note = z.infer<typeof noteSchema>
export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
