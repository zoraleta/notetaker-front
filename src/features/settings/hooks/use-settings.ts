import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSettings, updateModel, updatePrompt, settingsKeys } from '../api'
import type { Settings } from '../schema'

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
    onMutate: async ({ key, value }) => {
      await qc.cancelQueries({ queryKey: settingsKeys.all })
      const previous = qc.getQueryData<Settings>(settingsKeys.all)
      qc.setQueryData<Settings>(settingsKeys.all, (old) => {
        if (!old) return old
        return {
          ...old,
          prompts: {
            ...old.prompts,
            [key]: { ...old.prompts[key], effective: value, override: value },
          },
        }
      })
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(settingsKeys.all, ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: settingsKeys.all }),
  })
}
