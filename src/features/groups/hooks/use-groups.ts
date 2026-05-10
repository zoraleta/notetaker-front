import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchGroups, createGroup, updateGroup, deleteGroup, groupsKeys } from '../api'
import type { CreateGroupInput, UpdateGroupInput } from '../schema'
import type { Group } from '../schema'
import { DEFAULT_ICON, DEFAULT_COLOR } from '../constants'

export function useGroups() {
  return useQuery({
    queryKey: groupsKeys.lists(),
    queryFn: fetchGroups,
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateGroupInput) => createGroup(data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: groupsKeys.lists() })
      const previous = qc.getQueryData<Group[]>(groupsKeys.lists())
      const optimistic: Group = {
        id: `optimistic-${crypto.randomUUID()}`,
        userId: '',
        name: data.name,
        description: data.description ?? '',
        icon: data.icon ?? DEFAULT_ICON,
        color: data.color ?? DEFAULT_COLOR,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      qc.setQueryData<Group[]>(groupsKeys.lists(), (old) => [...(old ?? []), optimistic])
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(groupsKeys.lists(), ctx.previous)
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: groupsKeys.lists() }),
  })
}

export function useUpdateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupInput }) => updateGroup(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: groupsKeys.lists() })
      const previous = qc.getQueryData<Group[]>(groupsKeys.lists())
      qc.setQueryData<Group[]>(groupsKeys.lists(), (old) =>
        old?.map((g) =>
          g.id === id
            ? { ...g, ...data, description: data.description ?? g.description, updatedAt: new Date().toISOString() }
            : g,
        ),
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(groupsKeys.lists(), ctx.previous)
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: groupsKeys.lists() }),
  })
}

export function useDeleteGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: groupsKeys.lists() })
      const previous = qc.getQueryData<Group[]>(groupsKeys.lists())
      qc.setQueryData<Group[]>(groupsKeys.lists(), (old) => old?.filter((g) => g.id !== id))
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(groupsKeys.lists(), ctx.previous)
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: groupsKeys.lists() }),
  })
}
