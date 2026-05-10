import { z } from 'zod'

export const settingsSchema = z.object({
  activeModel: z.string(),
  embeddingModel: z.string(),
  prompts: z.record(z.string()),
})

export type Settings = z.infer<typeof settingsSchema>

export const ALLOWED_MODELS = [
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
] as const
