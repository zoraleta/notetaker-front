import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateProjectFromPack } from '@/features/projects/hooks/use-projects'
import type { ProjectPack } from '@/features/ai/api'

interface PackProjectDialogProps {
  pack: ProjectPack
  noteId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PackProjectDialog({ pack, noteId, open, onOpenChange, onSuccess }: PackProjectDialogProps) {
  const [name, setName] = useState(() => pack.goal.slice(0, 100))
  const createProject = useCreateProjectFromPack()

  async function handleCreate() {
    const trimmedName = name.trim()
    if (!trimmedName) return
    try {
      await createProject.mutateAsync({
        name: trimmedName,
        pack: {
          goal: pack.goal,
          stages: pack.stages,
          openQuestions: pack.openQuestions,
        },
        sourceNoteIds: [noteId],
      })
      toast.success(`Проект «${trimmedName}» создан`)
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Не удалось создать проект')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Упаковать в проект</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Название</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              placeholder="Название проекта"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Цель</p>
            <p className="text-sm">{pack.goal}</p>
          </div>

          {pack.stages.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Этапы</p>
              <ul className="space-y-1">
                {pack.stages.map((stage, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-muted-foreground">·</span>
                    {stage.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pack.openQuestions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Открытые вопросы</p>
              <ul className="space-y-1">
                {pack.openQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-muted-foreground">·</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createProject.isPending}>
            Отмена
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || createProject.isPending}>
            {createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Создать проект
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
