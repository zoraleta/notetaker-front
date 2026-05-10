import { http } from '@/lib/http'
import { z } from 'zod'
import { getToken } from '@/features/auth/api'

const groupSuggestionSchema = z.object({ groupId: z.string(), score: z.number() })
const groupSuggestResultSchema = z.object({
  suggestions: z.array(groupSuggestionSchema),
  emptyGroupIds: z.array(z.string()),
})
export type GroupSuggestResult = z.infer<typeof groupSuggestResultSchema>

const searchHitSchema = z.object({
  noteId: z.string(),
  title: z.string(),
  score: z.number(),
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

export async function suggestGroups(noteText: string): Promise<GroupSuggestResult> {
  const res = await http.post('/ai/suggest-group', { noteText })
  return groupSuggestResultSchema.parse(res.data)
}

export async function semanticSearch(query: string): Promise<SearchHit[]> {
  const res = await http.post('/ai/search', { query })
  return z.array(searchHitSchema).parse(res.data)
}

export async function summarizeUrl(url: string): Promise<{ stream: ReadableStream<Uint8Array>; title: string }> {
  const parseRes = await authFetch('/links/parse', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
  if (!parseRes.ok) {
    const body = await parseRes.json() as { error?: string }
    throw new Error(body.error ?? 'Не удалось загрузить страницу')
  }
  const { content, title } = await parseRes.json() as { content: string; title: string }

  const summarizeRes = await authFetch('/ai/summarize', {
    method: 'POST',
    body: JSON.stringify({ text: content }),
  })
  if (!summarizeRes.ok || !summarizeRes.body) throw new Error('Не удалось получить саммари')
  return { stream: summarizeRes.body, title: title || url }
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
