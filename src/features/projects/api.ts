import { http } from '@/lib/http'
import { projectSchema, projectsArraySchema } from './schema'

export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  detail: (id: string) => [...projectsKeys.all, 'detail', id] as const,
}

export async function fetchProjects() {
  const res = await http.get('/projects')
  return projectsArraySchema.parse(res.data)
}

export async function fetchProject(id: string) {
  const res = await http.get(`/projects/${id}`)
  return projectSchema.parse(res.data)
}

export async function deleteProject(id: string) {
  await http.delete(`/projects/${id}`)
}

export interface CreateProjectFromPackInput {
  name: string
  description?: string
  pack: { goal?: string; stages?: { title: string; done: boolean }[]; openQuestions?: string[] }
  sourceNoteIds: string[]
}

export async function createProjectFromPack(data: CreateProjectFromPackInput) {
  const res = await http.post('/projects/from-pack', data)
  return projectSchema.parse(res.data)
}
