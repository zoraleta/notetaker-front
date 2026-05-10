import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchGroups, createGroup, updateGroup, deleteGroup, groupsKeys } from '../api'
import type { CreateGroupInput, UpdateGroupInput } from '../schema'

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
    onSuccess: () => qc.invalidateQueries({ queryKey: groupsKeys.lists() }),
  })
}

export function useUpdateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupInput }) => updateGroup(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupsKeys.lists() }),
  })
}

export function useDeleteGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupsKeys.lists() }),
  })
}
