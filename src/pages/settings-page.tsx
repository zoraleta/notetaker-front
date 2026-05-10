import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useSettings, useUpdateModel, useUpdatePrompt } from '@/features/settings/hooks/use-settings'
import { ALLOWED_MODELS } from '@/features/settings/schema'

const PROMPT_DESCRIPTIONS: Record<string, string> = {
  summarize: 'Краткое резюме заметки или статьи с ключевыми тезисами.',
  discuss: 'Диалог об идее пользователя с опорой на контекст из других его заметок.',
  'pack-into-project': 'По итогам диалога формирует структуру проекта: цель, этапы, открытые вопросы.',
}

export function SettingsPage() {
  const { data: settings, isLoading, isError } = useSettings()
  const updateModel = useUpdateModel()
  const updatePrompt = useUpdatePrompt()
  const [promptEdits, setPromptEdits] = useState<Record<string, string>>({})
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())

  function handleSavePrompt(key: string) {
    updatePrompt.mutate({ key, value: promptEdits[key] })
    setPromptEdits((p) => { const n = { ...p }; delete n[key]; return n })
    setSavedKeys((s) => new Set([...s, key]))
    setTimeout(() => setSavedKeys((s) => { const n = new Set(s); n.delete(key); return n }), 2000)
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8 space-y-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (isError || !settings) {
    return <div className="p-8 text-sm text-destructive">Не удалось загрузить настройки</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold">Настройки</h1>

      <div className="space-y-6">
        <section className="space-y-2">
          <h2 className="text-sm font-medium">AI-модель</h2>
          <Select
            value={settings.activeModel}
            onValueChange={(v) => updateModel.mutate(v)}
            disabled={updateModel.isPending}
          >
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALLOWED_MODELS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium">Модель эмбеддингов</h2>
          <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
            {settings.embeddingModel}
          </p>
          <p className="text-xs text-muted-foreground">Изменение требует пересоздания индекса. Только для администратора.</p>
        </section>

        {Object.keys(settings.prompts).length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Промпты</h2>
            {Object.entries(settings.prompts).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-medium">{key}</label>
                {PROMPT_DESCRIPTIONS[key] && (
                  <p className="text-xs text-muted-foreground">{PROMPT_DESCRIPTIONS[key]}</p>
                )}
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  rows={4}
                  defaultValue={value.effective}
                  onChange={(e) => setPromptEdits((p) => ({ ...p, [key]: e.target.value }))}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!promptEdits[key] || promptEdits[key] === value.effective || updatePrompt.isPending}
                  onClick={() => handleSavePrompt(key)}
                  className="gap-1"
                >
                  {savedKeys.has(key) ? <Check className="h-3 w-3" /> : null}
                  {savedKeys.has(key) ? 'Сохранено' : 'Сохранить'}
                </Button>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
