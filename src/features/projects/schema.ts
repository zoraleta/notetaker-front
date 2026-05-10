import { z } from 'zod'

const stageSchema = z.object({ title: z.string(), done: z.boolean() })

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  goal: z.string().nullable().optional(),
  stagesJson: z.array(stageSchema).nullable().optional(),
  openQuestionsJson: z.array(z.string()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const projectsArraySchema = z.array(projectSchema)

export type Project = z.infer<typeof projectSchema>
export type Stage = z.infer<typeof stageSchema>
