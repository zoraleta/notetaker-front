import { useRef, useState, useCallback, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotes } from '@/features/notes/hooks/use-notes'
import { useGroups } from '@/features/groups/hooks/use-groups'
import { GroupIcon } from '@/features/groups/components/group-icon'
import { DEFAULT_COLOR, DEFAULT_ICON } from '@/features/groups/constants'
import { useNavigate } from 'react-router-dom'
import type { Note } from '@/features/notes/schema'
import type { Group } from '@/features/groups/schema'

const UNGROUPED_ID = '__ungrouped__'
const GROUP_R = 34
const NOTE_R = 14
const GROUP_ORBIT = 230

interface GroupNode {
  id: string
  label: string
  icon: string
  color: string
  x: number
  y: number
}

interface NoteNode {
  id: string
  label: string
  color: string
  x: number
  y: number
}

interface Edge {
  gx: number
  gy: number
  nx: number
  ny: number
  color: string
}

function buildGraph(notes: Note[], groups: Group[]) {
  const groupNodes: GroupNode[] = []
  const noteNodes: NoteNode[] = []
  const edges: Edge[] = []

  const activeGroups: Array<Group | { id: string; name: string; icon: string; color: string }> = groups.filter((g) =>
    notes.some((n) => n.groupId === g.id),
  )

  const ungrouped = notes.filter((n) => !n.groupId || !groups.find((g) => g.id === n.groupId))
  if (ungrouped.length > 0) {
    activeGroups.push({ id: UNGROUPED_ID, name: 'Без группы', icon: DEFAULT_ICON, color: DEFAULT_COLOR })
  }

  if (activeGroups.length === 0) {
    notes.forEach((note, i) => {
      const angle = (2 * Math.PI * i) / notes.length - Math.PI / 2
      noteNodes.push({ id: note.id, label: note.title || 'Без названия', color: DEFAULT_COLOR, x: Math.cos(angle) * 180, y: Math.sin(angle) * 180 })
    })
    return { groupNodes, noteNodes, edges }
  }

  activeGroups.forEach((group, gi) => {
    const gAngle = (2 * Math.PI * gi) / activeGroups.length - Math.PI / 2
    const gx = Math.cos(gAngle) * GROUP_ORBIT
    const gy = Math.sin(gAngle) * GROUP_ORBIT

    groupNodes.push({ id: group.id, label: group.name, icon: group.icon, color: group.color, x: gx, y: gy })

    const groupNotes = group.id === UNGROUPED_ID ? ungrouped : notes.filter((n) => n.groupId === group.id)
    const noteOrbit = Math.max(80, groupNotes.length * 22)

    groupNotes.forEach((note, ni) => {
      const spreadAngle = groupNotes.length === 1 ? gAngle : gAngle + ((ni - (groupNotes.length - 1) / 2) * (Math.PI / Math.max(groupNotes.length, 2))) * 1.4
      const nx = gx + Math.cos(spreadAngle) * noteOrbit
      const ny = gy + Math.sin(spreadAngle) * noteOrbit

      noteNodes.push({ id: note.id, label: note.title || 'Без названия', color: group.color, x: nx, y: ny })
      edges.push({ gx, gy, nx, ny, color: group.color })
    })
  })

  return { groupNodes, noteNodes, edges }
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function GraphCanvas({
  groupNodes,
  noteNodes,
  edges,
  onNoteClick,
}: {
  groupNodes: GroupNode[]
  noteNodes: NoteNode[]
  edges: Edge[]
  onNoteClick: (id: string) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [svgSize, setSvgSize] = useState({ w: 800, h: 600 })
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const moved = useRef(false)

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const update = () => setSvgSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(4, Math.max(0.15, prev.scale * (e.deltaY > 0 ? 0.9 : 1.11))),
    }))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    isDragging.current = true
    moved.current = false
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const cx = svgSize.w / 2 + transform.x
  const cy = svgSize.h / 2 + transform.y

  return (
    <svg
      ref={svgRef}
      className="h-full w-full select-none"
      style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <g transform={`translate(${cx},${cy}) scale(${transform.scale})`}>
        {edges.map((e, i) => (
          <line
            key={i}
            x1={e.gx}
            y1={e.gy}
            x2={e.nx}
            y2={e.ny}
            stroke={e.color}
            strokeOpacity={0.3}
            strokeWidth={1.5}
          />
        ))}

        {noteNodes.map((node) => (
          <g
            key={node.id}
            onClick={() => {
              if (!moved.current) onNoteClick(node.id)
            }}
            style={{ cursor: 'pointer' }}
          >
            <circle cx={node.x} cy={node.y} r={NOTE_R + 4} fill={hexToRgba(node.color, 0.12)} />
            <circle cx={node.x} cy={node.y} r={NOTE_R} fill={hexToRgba(node.color, 0.85)} stroke={node.color} strokeWidth={1.5} />
            <text x={node.x} y={node.y + NOTE_R + 13} textAnchor="middle" fontSize={10} fill="currentColor" className="fill-foreground" opacity={0.8}>
              {node.label.length > 18 ? node.label.slice(0, 17) + '…' : node.label}
            </text>
          </g>
        ))}

        {groupNodes.map((group) => (
          <g key={group.id}>
            <circle cx={group.x} cy={group.y} r={GROUP_R + 8} fill={hexToRgba(group.color, 0.08)} />
            <circle cx={group.x} cy={group.y} r={GROUP_R} fill={hexToRgba(group.color, 0.9)} stroke={group.color} strokeWidth={2} />
            <foreignObject
              x={group.x - 12}
              y={group.y - 12}
              width={24}
              height={24}
              style={{ pointerEvents: 'none', overflow: 'visible' }}
            >
              <div
                // @ts-ignore
                xmlns="http://www.w3.org/1999/xhtml"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', color: 'white' }}
              >
                <GroupIcon name={group.icon} className="h-4 w-4" />
              </div>
            </foreignObject>
            <text x={group.x} y={group.y + GROUP_R + 16} textAnchor="middle" fontSize={11} fontWeight={600} fill={group.color}>
              {group.label.length > 16 ? group.label.slice(0, 15) + '…' : group.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}

export function GraphPage() {
  const navigate = useNavigate()
  const { data: notes, isLoading: notesLoading } = useNotes()
  const { data: groups, isLoading: groupsLoading } = useGroups()

  if (notesLoading || groupsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-96 w-full max-w-2xl rounded-xl" />
      </div>
    )
  }

  if (!notes?.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Нет заметок для отображения</p>
      </div>
    )
  }

  const { groupNodes, noteNodes, edges } = buildGraph(notes, groups ?? [])

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Mind map</h1>
        <p className="text-sm text-muted-foreground">Колесо — масштаб · Перетащить — навигация · Клик — перейти к заметке</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <GraphCanvas groupNodes={groupNodes} noteNodes={noteNodes} edges={edges} onNoteClick={(id) => navigate(`/notes/${id}`)} />
      </div>
    </div>
  )
}
