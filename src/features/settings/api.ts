import { http } from '@/lib/http'
import { settingsSchema } from './schema'

export const settingsKeys = {
  all: ['settings'] as const,
}

export async function fetchSettings() {
  const res = await http.get('/settings')
  return settingsSchema.parse(res.data)
}

export async function updateModel(model: string) {
  await http.put('/settings/active-model', { model })
}

export async function updatePrompt(key: string, value: string) {
  await http.put(`/settings/prompts/${key}`, { value })
}
