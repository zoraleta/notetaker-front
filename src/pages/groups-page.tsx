import { useState } from 'react'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup } from '@/features/groups/hooks/use-groups'
import type { Group } from '@/features/groups/schema'

function GroupRow({ group }: { group: Group }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description)
  const updateGroup = useUpdateGroup()
  const deleteGroup = useDeleteGroup()

  function handleSave() {
    updateGroup.mutate(
      { id: group.id, data: { name, description } },
      { onSuccess: () => setEditing(false) },
    )
  }

  function handleCancel() {
    setName(group.name)
    setDescription(group.description)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название группы"
          className="text-sm"
          autoFocus
        />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание (необязательно)"
          className="text-sm"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!name.trim() || updateGroup.isPending}
            className="gap-1"
          >
            <Check className="h-3.5 w-3.5" />
            Сохранить
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} className="gap-1">
            <X className="h-3.5 w-3.5" />
            Отмена
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between rounded-lg border bg-card p-4">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{group.name}</span>
          {group.isDefault && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              по умолчанию
            </span>
          )}
        </div>
        {group.description && (
          <p className="text-xs text-muted-foreground">{group.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-4">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setEditing(true)}
          aria-label="Редактировать"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => deleteGroup.mutate(group.id)}
          disabled={deleteGroup.isPending}
          aria-label="Удалить"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function NewGroupForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const createGroup = useCreateGroup()

  function handleCreate() {
    if (!name.trim()) return
    createGroup.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      { onSuccess: onDone },
    )
  }

  return (
    <div className="rounded-lg border border-dashed bg-card p-4 space-y-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название группы"
        className="text-sm"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Описание (необязательно)"
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!name.trim() || createGroup.isPending}
          className="gap-1"
        >
          <Check className="h-3.5 w-3.5" />
          Создать
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone} className="gap-1">
          <X className="h-3.5 w-3.5" />
          Отмена
        </Button>
      </div>
    </div>
  )
}

export function GroupsPage() {
  const { data: groups, isLoading, isError } = useGroups()
  const [adding, setAdding] = useState(false)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8 space-y-3">
        <Skeleton className="h-7 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <div className="p-8 text-sm text-destructive">Не удалось загрузить группы</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Группы</h1>
        <Button size="sm" onClick={() => setAdding(true)} disabled={adding} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Новая группа
        </Button>
      </div>

      <div className="space-y-2">
        {adding && <NewGroupForm onDone={() => setAdding(false)} />}
        {groups?.map((group) => (
          <GroupRow key={group.id} group={group} />
        ))}
        {!adding && groups?.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Нет групп</p>
        )}
      </div>
    </div>
  )
}
