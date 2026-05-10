export interface IconOption {
  name: string
  label: string
}

export const GROUP_ICONS: IconOption[] = [
  { name: 'FileText', label: 'Документ' },
  { name: 'Briefcase', label: 'Работа' },
  { name: 'BookOpen', label: 'Учёба' },
  { name: 'Plane', label: 'Путешествия' },
  { name: 'Home', label: 'Дом' },
  { name: 'Star', label: 'Избранное' },
  { name: 'Heart', label: 'Личное' },
  { name: 'Music', label: 'Музыка' },
  { name: 'Code2', label: 'Код' },
  { name: 'ShoppingCart', label: 'Покупки' },
  { name: 'Globe', label: 'Интернет' },
  { name: 'Camera', label: 'Фото' },
]

export interface ColorOption {
  value: string
  label: string
}

export const GROUP_COLORS: ColorOption[] = [
  { value: '#64748b', label: 'Серый' },
  { value: '#ef4444', label: 'Красный' },
  { value: '#f97316', label: 'Оранжевый' },
  { value: '#eab308', label: 'Жёлтый' },
  { value: '#22c55e', label: 'Зелёный' },
  { value: '#14b8a6', label: 'Бирюзовый' },
  { value: '#3b82f6', label: 'Синий' },
  { value: '#8b5cf6', label: 'Фиолетовый' },
  { value: '#ec4899', label: 'Розовый' },
]

export const DEFAULT_ICON = 'FileText'
export const DEFAULT_COLOR = '#64748b'
