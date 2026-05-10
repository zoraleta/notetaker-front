import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useGroups, useCreateGroup } from '@/features/groups/hooks/use-groups'
import { GroupIcon } from '@/features/groups/components/group-icon'
import { DEFAULT_ICON, DEFAULT_COLOR } from '@/features/groups/constants'
import { suggestGroups } from '@/features/ai/api'
import { useUpdateNote } from '../hooks/use-notes'
import type { Group } from '@/features/groups/schema'

const MIN_TEXT_LENGTH = 30

interface Props {
  noteId: string
  noteText: string
  currentGroupId: string | null
}

// URLs add noise to embeddings — semantic similarity should be based on prose,
// not on link strings. Strip http(s) URLs and collapse whitespace.
function stripUrls(text: string): string {
  return text.replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim()
}

export function GroupSuggestions({ noteId, noteText, currentGroupId }: Props) {
  const { data: groups } = useGroups()
  const updateNote = useUpdateNote(noteId)

  const cleanedText = useMemo(() => stripUrls(noteText), [noteText])

  const { data: result, isFetching } = useQuery({
    queryKey: ['ai', 'suggest-group', cleanedText.slice(0, 500)],
    queryFn: () => suggestGroups(cleanedText),
    enabled: cleanedText.length >= MIN_TEXT_LENGTH,
    staleTime: 60_000,
    retry: false,
  })

  const groupMap = useMemo(
    () => new Map((groups ?? []).map((g) => [g.id, g])),
    [groups],
  )

  const suggestedIds = useMemo(
    () => new Set((result?.suggestions ?? []).map((s) => s.groupId)),
    [result],
  )

  const suggested = useMemo(
    () =>
      (result?.suggestions ?? []).flatMap((s) => {
        const g = groupMap.get(s.groupId)
        return g ? [g] : []
      }),
    [result, groupMap],
  )

  const empty = useMemo(
    () =>
      (result?.emptyGroupIds ?? [])
        .filter((id) => !suggestedIds.has(id))
        .flatMap((id) => {
          const g = groupMap.get(id)
          return g ? [g] : []
        }),
    [result, suggestedIds, groupMap],
  )

  function toggle(groupId: string) {
    updateNote.mutate({ groupId: currentGroupId === groupId ? null : groupId })
  }

  const allGroups = groups ?? []
  if (allGroups.length === 0) return null

  const hasAiSections = result !== undefined
  const currentGroup = currentGroupId ? groupMap.get(currentGroupId) : undefined

  return (
    <div className="p-4 border-b">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Группа
        </p>
        {isFetching && (
          <span className="text-xs text-muted-foreground">анализируем…</span>
        )}
      </div>

      {currentGroup && (
        <div className="mb-3">
          <GroupChip
            group={currentGroup}
            selected
            onClick={() => toggle(currentGroup.id)}
          />
        </div>
      )}

      {hasAiSections ? (
        <div className="space-y-2">
          {suggested.length > 0 && (
            <Section title="По содержанию">
              {suggested.map((g) => (
                <GroupChip
                  key={g.id}
                  group={g}
                  selected={g.id === currentGroupId}
                  onClick={() => toggle(g.id)}
                />
              ))}
            </Section>
          )}
          {empty.length > 0 && (
            <Section title="Пустые группы">
              {empty.map((g) => (
                <GroupChip
                  key={g.id}
                  group={g}
                  selected={g.id === currentGroupId}
                  onClick={() => toggle(g.id)}
                />
              ))}
            </Section>
          )}
          {suggested.length === 0 && empty.length === 0 && (
            <FlatList groups={allGroups} currentGroupId={currentGroupId} onToggle={toggle} />
          )}
        </div>
      ) : (
        <FlatList groups={allGroups} currentGroupId={currentGroupId} onToggle={toggle} />
      )}

      <div className="mt-3">
        <OtherGroupPicker
          groups={allGroups}
          currentGroupId={currentGroupId}
          onPick={(id) => updateNote.mutate({ groupId: id })}
        />
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
}

function FlatList({
  groups,
  currentGroupId,
  onToggle,
}: {
  groups: Group[]
  currentGroupId: string | null
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {groups.map((g) => (
        <GroupChip
          key={g.id}
          group={g}
          selected={g.id === currentGroupId}
          onClick={() => onToggle(g.id)}
        />
      ))}
    </div>
  )
}

function GroupChip({
  group,
  selected,
  onClick,
}: {
  group: Group
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
        selected
          ? 'border-transparent text-white'
          : 'border-border bg-background hover:bg-accent',
      )}
      style={selected ? { backgroundColor: group.color } : { color: group.color }}
    >
      <GroupIcon name={group.icon} className="h-3 w-3 shrink-0" />
      <span>{group.name}</span>
      {selected && <Check className="h-3 w-3 shrink-0" />}
    </button>
  )
}

function OtherGroupPicker({
  groups,
  currentGroupId,
  onPick,
}: {
  groups: Group[]
  currentGroupId: string | null
  onPick: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const createGroup = useCreateGroup()

  async function handleCreate() {
    const name = newName.trim()
    if (!name || createGroup.isPending) return
    const created = await createGroup.mutateAsync({
      name,
      icon: DEFAULT_ICON,
      color: DEFAULT_COLOR,
    })
    setNewName('')
    onPick(created.id)
    setOpen(false)
  }

  function handlePick(id: string) {
    onPick(id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
          <Plus className="h-3 w-3" />
          Другая
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="max-h-48 overflow-auto space-y-0.5">
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => handlePick(g.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                style={{ backgroundColor: g.color + '22', color: g.color }}
              >
                <GroupIcon name={g.icon} className="h-3 w-3" />
              </span>
              <span className="flex-1 truncate">{g.name}</span>
              {g.id === currentGroupId && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}
        </div>
        <div className="mt-2 border-t pt-2">
          <p className="mb-1.5 text-xs text-muted-foreground">Новая группа</p>
          <div className="flex gap-1">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Название"
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newName.trim() || createGroup.isPending}
              className="h-8 shrink-0 px-2"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNewName('')
                setOpen(false)
              }}
              className="h-8 shrink-0 px-2"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
