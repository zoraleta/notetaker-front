import { useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotes } from '@/features/notes/hooks/use-notes'
import { useNavigate } from 'react-router-dom'

interface GraphNode {
  id: string
  label: string
  x: number
  y: number
}

interface GraphEdge {
  source: string
  target: string
}

function buildGraph(notes: { id: string; title: string }[]) {
  const nodes: GraphNode[] = notes.map((n, i) => ({
    id: n.id,
    label: n.title || 'Без названия',
    x: Math.cos((2 * Math.PI * i) / notes.length) * 200 + 300,
    y: Math.sin((2 * Math.PI * i) / notes.length) * 200 + 250,
  }))
  return { nodes, edges: [] as GraphEdge[] }
}

function GraphCanvas({
  nodes,
  edges,
  onNodeClick,
}: {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick: (id: string) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  return (
    <svg ref={svgRef} className="h-full w-full" viewBox="0 0 600 500">
      {edges.map((e, i) => {
        const s = nodes.find((n) => n.id === e.source)
        const t = nodes.find((n) => n.id === e.target)
        if (!s || !t) return null
        return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="hsl(var(--border))" strokeWidth={1} />
      })}
      {nodes.map((node) => (
        <g key={node.id} onClick={() => onNodeClick(node.id)} className="cursor-pointer">
          <circle cx={node.x} cy={node.y} r={20} fill="hsl(var(--primary))" fillOpacity={0.15} stroke="hsl(var(--primary))" strokeWidth={1.5} />
          <text
            x={node.x}
            y={node.y + 32}
            textAnchor="middle"
            fontSize={11}
            fill="hsl(var(--foreground))"
            className="select-none"
          >
            {node.label.slice(0, 16)}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function GraphPage() {
  const navigate = useNavigate()
  const { data: notes, isLoading } = useNotes()

  if (isLoading) {
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

  const { nodes, edges } = buildGraph(notes)

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Граф знаний</h1>
        <p className="text-sm text-muted-foreground">Кликните на заметку для перехода</p>
      </div>
      <div className="flex-1">
        <GraphCanvas nodes={nodes} edges={edges} onNodeClick={(id) => navigate(`/notes/${id}`)} />
      </div>
    </div>
  )
}
