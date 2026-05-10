import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Plus, FileText, FolderOpen, Settings, LogOut, Moon, Sun, Search, NotebookPen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotes } from '@/features/notes/hooks/use-notes'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { useCreateNote } from '@/features/notes/hooks/use-notes'
import { removeToken } from '@/features/auth/api'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
  onCmdK: () => void
}

export function AppSidebar({ onCmdK }: AppSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const { data: notes, isLoading: notesLoading } = useNotes()
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const createNote = useCreateNote()

  function toggleDark() {
    document.documentElement.classList.toggle('dark')
    setIsDark((d) => !d)
  }

  function handleLogout() {
    removeToken()
    navigate('/login')
  }

  const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] }

  async function handleNewNote() {
    const note = await createNote.mutateAsync({ title: 'Новая заметка', contentJson: EMPTY_DOC, contentText: '' })
    navigate(`/notes/${note.id}`)
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-sidebar">
      <div className="flex items-center justify-between p-4">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-sidebar-foreground hover:opacity-80 transition-opacity">
          <NotebookPen className="h-4 w-4 text-foreground" />
          Notetaker
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleDark} aria-label="Переключить тему">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <div className="px-3 pb-2">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={onCmdK}>
          <Search className="h-4 w-4" />
          Поиск (⌘K)
        </Button>
      </div>

      <div className="px-3 pb-2">
        <Button size="sm" className="w-full justify-start gap-2" onClick={handleNewNote} disabled={createNote.isPending}>
          <Plus className="h-4 w-4" />
          Новая заметка
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-2">
        <div className="mb-1 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Заметки
        </div>
        {notesLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {notes?.map((note) => (
              <Link
                key={note.id}
                to={`/notes/${note.id}`}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent',
                  location.pathname === `/notes/${note.id}` && 'bg-sidebar-accent text-sidebar-accent-foreground',
                )}
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{note.title || 'Без названия'}</span>
              </Link>
            ))}
          </div>
        )}

        {(projects?.length ?? 0) > 0 && (
          <>
            <div className="mb-1 mt-4 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Проекты
            </div>
            {projectsLoading ? (
              <div className="space-y-1">
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            ) : (
              <div className="space-y-0.5">
                {projects?.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent',
                      location.pathname === `/projects/${project.id}` && 'bg-sidebar-accent',
                    )}
                  >
                    <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{project.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </ScrollArea>

      <Separator />

      <div className="flex flex-col gap-0.5 p-3">
        <Button variant="ghost" size="sm" className="justify-start gap-2" asChild>
          <Link to="/graph">
            <FileText className="h-4 w-4" />
            Mind map
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="justify-start gap-2" asChild>
          <Link to="/settings">
            <Settings className="h-4 w-4" />
            Настройки
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="justify-start gap-2 text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Выйти
        </Button>
      </div>
    </aside>
  )
}
