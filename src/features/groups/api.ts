import { http } from '@/lib/http'
import { groupSchema, groupsArraySchema } from './schema'
import type { CreateGroupInput, UpdateGroupInput } from './schema'

export const groupsKeys = {
  all: ['groups'] as const,
  lists: () => [...groupsKeys.all, 'list'] as const,
}

export async function fetchGroups() {
  const res = await http.get('/groups')
  return groupsArraySchema.parse(res.data)
}

export async function createGroup(data: CreateGroupInput) {
  const res = await http.post('/groups', data)
  return groupSchema.parse(res.data)
}

export async function updateGroup(id: string, data: UpdateGroupInput) {
  const res = await http.patch(`/groups/${id}`, data)
  return groupSchema.parse(res.data)
}

export async function deleteGroup(id: string) {
  await http.delete(`/groups/${id}`)
}
