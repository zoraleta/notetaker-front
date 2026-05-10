import {
  FileText, Briefcase, BookOpen, Plane, Home, Star, Heart,
  Music, Code2, ShoppingCart, Globe, Camera,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, Briefcase, BookOpen, Plane, Home, Star, Heart,
  Music, Code2, ShoppingCart, Globe, Camera,
}

export function GroupIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? FileText
  return <Icon className={className} />
}
