import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Plus, FileText, Layers, Settings, LogOut, Moon, Sun, Search, X, Loader2, NotebookPen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotes, useCreateNote } from '@/features/notes/hooks/use-notes'
import { useSemanticSearch } from '@/features/ai/hooks/use-ai'
import { useDebounce } from '@/hooks/use-debounce'
import { removeToken } from '@/features/auth/api'
import { cn } from '@/lib/utils'
import type { Note } from '@/features/notes/schema'

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 350)

  const { data: notes, isLoading: notesLoading } = useNotes()
  const { data: searchHits, isFetching: isSearching } = useSemanticSearch(debouncedQuery)
  const createNote = useCreateNote()

  const openSearch = useCallback(() => {
    setIsSearchOpen(true)
    setTimeout(() => searchInputRef.current?.focus(), 0)
  }, [])

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
    setQuery('')
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openSearch()
      }
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isSearchOpen, openSearch, closeSearch])

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
    const note = await createNote.mutateAsync({ title: query || 'Новая заметка', contentJson: EMPTY_DOC, contentText: '' })
    if (isSearchOpen) closeSearch()
    navigate(`/notes/${note.id}`)
  }

  function handleNoteSelect(id: string) {
    navigate(`/notes/${id}`)
  }

  const displayNotes: Array<{ id: string; title: string }> = debouncedQuery.trim()
    ? (searchHits ?? []).map((hit) => ({ id: hit.noteId, title: hit.title }))
    : (notes ?? []).map((n: Note) => ({ id: n.id, title: n.title }))

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
        {isSearchOpen ? (
          <div className="flex items-center gap-1">
            <Input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Семантический поиск..."
              className="h-8 text-sm"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={closeSearch}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={openSearch}>
            <Search className="h-4 w-4" />
            Поиск (⌘K)
          </Button>
        )}
      </div>

      <div className="px-3 pb-2">
        <Button size="sm" className="w-full justify-start gap-2" onClick={handleNewNote} disabled={createNote.isPending}>
          <Plus className="h-4 w-4" />
          {isSearchOpen && query ? `Создать «${query}»` : 'Новая заметка'}
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-2">
        {isSearchOpen ? (
          <>
            {isSearching && debouncedQuery.trim() ? (
              <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Ищу...
              </div>
            ) : debouncedQuery.trim() && displayNotes.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">Ничего не найдено.</p>
            ) : (
              <>
                <div className="mb-1 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {debouncedQuery.trim() ? 'Результаты' : 'Заметки'}
                </div>
                <div className="space-y-0.5">
                  {displayNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => handleNoteSelect(note.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent text-left"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{note.title || 'Без названия'}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <>
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

          </>
        )}
      </ScrollArea>

      <Separator />

      <div className="flex flex-col gap-0.5 p-3">
        <Button variant="ghost" size="sm" className="justify-start gap-2" asChild>
          <Link to="/groups">
            <Layers className="h-4 w-4" />
            Группы
          </Link>
        </Button>
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
