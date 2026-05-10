import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, CheckCircle2, Circle, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProject } from '@/features/projects/hooks/use-projects'
import { useNotes } from '@/features/notes/hooks/use-notes'

export function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading, isError } = useProject(id!)
  const { data: notes } = useNotes()

  const projectNotes = notes?.filter((n) => n.projectId === id) ?? []

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-muted-foreground">Проект не найден.</p>
        <Button variant="link" className="px-0 mt-2" onClick={() => navigate(-1)}>
          Назад
        </Button>
      </div>
    )
  }

  const stages = project.stagesJson ?? []
  const openQuestions = project.openQuestionsJson ?? []

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Назад
      </Button>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <FolderOpen className="h-3.5 w-3.5" />
          Проект
        </div>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
      </div>

      {project.goal && (
        <section className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Цель</p>
          <p className="text-sm">{project.goal}</p>
        </section>
      )}

      {stages.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Этапы</p>
          <ul className="space-y-1.5">
            {stages.map((stage, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {stage.done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className={stage.done ? 'line-through text-muted-foreground' : ''}>
                  {stage.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {openQuestions.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Открытые вопросы</p>
          <ul className="space-y-1">
            {openQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-muted-foreground">·</span>
                {q}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Заметки ({projectNotes.length})
        </p>
        {projectNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет прикреплённых заметок.</p>
        ) : (
          <ul className="space-y-1">
            {projectNotes.map((note) => (
              <li key={note.id}>
                <Link
                  to={`/notes/${note.id}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{note.title || 'Без названия'}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {new Date(note.updatedAt).toLocaleDateString('ru-RU')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
