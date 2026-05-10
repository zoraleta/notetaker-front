import { z } from 'zod'

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const projectsArraySchema = z.array(projectSchema)

export type Project = z.infer<typeof projectSchema>
