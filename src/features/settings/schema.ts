import { z } from 'zod'

const promptViewSchema = z.object({
  default: z.string(),
  override: z.string().nullable(),
  effective: z.string(),
})

export const settingsSchema = z.object({
  activeModel: z.string(),
  allowedModels: z.array(z.string()),
  embeddingModel: z.string(),
  embeddingDimensions: z.number(),
  prompts: z.record(promptViewSchema),
})

export type Settings = z.infer<typeof settingsSchema>

export const ALLOWED_MODELS = [
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
] as const
