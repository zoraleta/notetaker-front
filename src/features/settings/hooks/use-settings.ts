import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSettings, updateModel, updatePrompt, settingsKeys } from '../api'

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: fetchSettings,
  })
}

export function useUpdateModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (model: string) => updateModel(model),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all }),
  })
}

export function useUpdatePrompt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => updatePrompt(key, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all }),
  })
}
