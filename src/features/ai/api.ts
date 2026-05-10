import { http } from '@/lib/http'
import { z } from 'zod'
import { getToken } from '@/features/auth/api'

const packResultSchema = z.object({
  name: z.string(),
  description: z.string(),
  noteIds: z.array(z.string()),
})

const searchHitSchema = z.object({
  noteId: z.string(),
  title: z.string(),
  score: z.number(),
  projectId: z.string().nullable(),
})

export type SearchHit = z.infer<typeof searchHitSchema>

export const aiKeys = {
  search: (q: string) => ['ai', 'search', q] as const,
}

function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken()
  return fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
}

export async function semanticSearch(query: string): Promise<SearchHit[]> {
  const res = await http.post('/ai/search', { query })
  return z.array(searchHitSchema).parse(res.data)
}

export async function summarizeUrl(url: string): Promise<ReadableStream<Uint8Array>> {
  const response = await authFetch('/links/summarize', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
  if (!response.ok || !response.body) throw new Error('Не удалось получить саммари')
  return response.body
}

export async function packIntoProject(noteId: string) {
  const res = await http.post('/ai/pack-into-project', { noteId })
  return packResultSchema.parse(res.data)
}

export function discussNote(
  noteId: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  signal?: AbortSignal,
): Promise<Response> {
  return authFetch('/ai/discuss', {
    method: 'POST',
    body: JSON.stringify({ noteId, messages }),
    signal,
  })
}
