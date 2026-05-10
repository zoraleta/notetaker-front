import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGroups } from '@/features/groups/hooks/use-groups'
import { GroupIcon } from '@/features/groups/components/group-icon'
import { suggestGroups } from '@/features/ai/api'
import { useUpdateNote } from '../hooks/use-notes'
import type { Group } from '@/features/groups/schema'

const MIN_TEXT_LENGTH = 30

interface Props {
  noteId: string
  noteText: string
  currentGroupId: string | null
}

export function GroupSuggestions({ noteId, noteText, currentGroupId }: Props) {
  const { data: groups } = useGroups()
  const updateNote = useUpdateNote(noteId)

  // AI suggestions — optional enhancement, never blocks group display.
  const { data: result, isFetching } = useQuery({
    queryKey: ['ai', 'suggest-group', noteText.slice(0, 500)],
    queryFn: () => suggestGroups(noteText),
    enabled: noteText.length >= MIN_TEXT_LENGTH,
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

      {hasAiSections ? (
        <div className="space-y-2">
          {suggested.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">По содержанию</p>
              <div className="flex flex-wrap gap-1">
                {suggested.map((g) => (
                  <GroupChip
                    key={g.id}
                    group={g}
                    selected={g.id === currentGroupId}
                    onClick={() => toggle(g.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {empty.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Пустые группы</p>
              <div className="flex flex-wrap gap-1">
                {empty.map((g) => (
                  <GroupChip
                    key={g.id}
                    group={g}
                    selected={g.id === currentGroupId}
                    onClick={() => toggle(g.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {suggested.length === 0 && empty.length === 0 && (
            <div className="flex flex-wrap gap-1">
              {allGroups.map((g) => (
                <GroupChip
                  key={g.id}
                  group={g}
                  selected={g.id === currentGroupId}
                  onClick={() => toggle(g.id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Show all groups immediately while AI loads or if AI is unavailable.
        <div className="flex flex-wrap gap-1">
          {allGroups.map((g) => (
            <GroupChip
              key={g.id}
              group={g}
              selected={g.id === currentGroupId}
              onClick={() => toggle(g.id)}
            />
          ))}
        </div>
      )}
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
