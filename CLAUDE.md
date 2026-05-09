# notetaker-front

Фронтенд для notetaker (тестовое задание Mediacube). React-приложение с AI-интерфейсом.

**Бэк — микросервисный**, разнесён по нескольким Cloudflare Workers (см. `notetaker-back/CLAUDE.md`). **Фронт ходит ТОЛЬКО на `api-gateway`** — единственный публично-доступный воркер. Адреса остальных воркеров фронту неизвестны и не должны попадать в код.

---

## Принципы разработки

### DRY (Don't Repeat Yourself)
Логика, встречающаяся более одного раза, выносится в хук/компонент/утилиту. Дублирование — ошибка.

### KISS (Keep It Simple, Stupid)
Простое решение лучше сложного. Не усложнять «на будущее» — проектировать под текущую задачу.

### YAGNI (You Aren't Gonna Need It)
Не писать код, который «может понадобиться». Только то, что нужно прямо сейчас.

### SOLID
- **S** — каждый компонент/функция делает одно дело
- **O** — расширять через props/композицию, не через модификацию работающего
- **L** — дочерние компоненты не ломают контракт родительских
- **I** — узкие props-интерфейсы, не монолитные
- **D** — зависеть от абстракций (типов), не от конкретных реализаций

### Composition over Inheritance
Композиция через `children`, render props и провайдеры. HOC — только при явной необходимости.

---

## Язык проекта

- UI и тексты — **русский**
- Код (имена переменных, функций, типов, файлов) — **английский**
- Комментарии в коде — **русский**
- Сообщения коммитов — **английский** (conventional commits: `feat(scope): ...`)

---

## Стек

- **Framework:** React + Vite
- **Language:** TypeScript
- **UI:** Shadcn UI (примитивы), `@/components/ui/*` — не редактируется руками
- **Styling:** Tailwind CSS (только theme tokens — никаких произвольных hex)
- **Шрифт:** Inter (через Google Fonts или локальный self-host)
- **Иконки:** `lucide-react`
- **Editor:** **Tiptap** (headless) — Notion-like редактор для заметок, без готовых стилей
- **Server state & fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **HTTP:** axios или ky (один клиент в `lib/http.ts`)
- **Деплой:** **Cloudflare Pages** через `wrangler pages deploy dist` (или Git-интеграция в Cloudflare dashboard). Бэкенд — несколько Cloudflare Workers, фронт ходит на `api-gateway`.

---

## Дизайн-принципы

### Стиль

- **Строгий минимализм, Notion-like.** Много «белого» пространства, чистая типографика.
- **Светлая тема — основная.** Тёмная — поддерживается через `dark:` модификатор Tailwind и Shadcn-токены.
- **Компонентная база — Shadcn.** Свои визуальные компоненты — только если в Shadcn нет аналога.

### Типографика

- **Шрифт — Inter** (Google Fonts или self-host через `@fontsource/inter`).
- Иерархия — через **размер и вес**, не через цвет. Не выделяем заголовки фиолетовым/неоновым.
- Базовый размер `text-sm`/`text-base`, заголовки — `text-lg`/`text-xl`/`text-2xl` без `font-black`.

### Цветовая палитра

- **Только Tailwind theme tokens** (`bg-background`, `text-foreground`, `bg-card`, `bg-muted`, `text-primary`, `bg-primary`, `border-border`, …). См. правила в `ui-guardian`.
- Никаких произвольных hex-значений в JSX (`bg-[#0f172a]` — запрещено).
- AI-блоки в UI визуально отделяются нейтрально — `bg-muted` или тонкой рамкой `border-border`, **не** градиентом и **не** «магическим свечением».

### Запрещённые визуальные паттерны (anti-AI-vibe)

Эти приёмы делают интерфейс «попсово-AI-шным» и отключаются полностью:

- **Градиенты в фонах и тексте** — `bg-gradient-*`, `text-transparent bg-clip-text`, и т.п.
- **Неоновые свечения** — массивные `shadow-*` цветными цветами, glow-эффекты, ring-эффекты «вокруг всего».
- **Bloom / blur с цветной заливкой** под элементами интерфейса.
- **Постоянные анимации** на нерелевантных элементах: `animate-pulse`, `animate-bounce`, `animate-spin`, shimmer/skeleton-shine **на статичных** блоках. Допустимы только в реальном Loading-состоянии.
- **«AI-частицы», sparkle-эффекты, фоновые звёздочки/блёстки** в качестве декорации.
- **Цветные градиентные кнопки** (purple→pink, blue→cyan и т.п.).
- **Кастомные «AI-логотипы»** для AI-функций — используем стандартную иконку (см. ниже).

### Motion

- Только сдержанные `transition-colors`, `transition-opacity`, `transition-transform`, длительность ≤200ms (`duration-150` / `duration-200`).
- Никаких бесконечных анимаций кроме явных Loading-состояний (`animate-spin` у Loader-иконки, Shadcn `Skeleton`).
- Hover/focus — изменение цвета/непрозрачности/обводки. Не масштабирование на 1.05, не «прыгание».

### AI-элементы

- **Иконка AI-функций — `Sparkles` из `lucide-react`.** Едина по всему приложению (slash-команды, кнопка «Саммари», кнопка «Разогнать идею» и т.д.). Не плодим иконки `Wand`, `Brain`, кастомные «AI-логотипы».
- **AI-результат появляется плавно.** Если бэк стримит токены — рендерим инкрементально (typewriter-эффект через постепенный append текста, без сторонних библиотек). Если ответ приходит целиком — `transition-opacity` + плавное появление.
- **AI-блок отделяется нейтрально.** Рамка `border-border` + фон `bg-muted` + иконка `Sparkles` слева. Никаких «магических» подсветок.
- **Loading у AI-операции — Shadcn `Skeleton`** в форме ожидаемого результата (для саммари — несколько строк-прямоугольников).

---

## Структура

```
src/
├── components/         Общие UI-компоненты
│   └── ui/             Shadcn-генерируемые (НЕ редактировать руками)
├── features/           Доменные фичи
│   └── <feature>/
│       ├── components/    UI фичи
│       ├── hooks/         useXxx() обёртки над useQuery/useMutation
│       ├── api.ts         queryFn / mutationFn + queryKey factory
│       ├── schema.ts      Zod (синхронные с бэком)
│       └── types.ts       z.infer + локальные типы
├── pages/              Роуты, собирают фичи (без бизнес-логики)
├── lib/                http.ts, query-client.ts, utils, cn()
├── hooks/              Кросс-фичевые хуки
├── App.tsx
└── main.tsx
```

**Поток данных:** `Component → useFeatureQuery() → api.ts → http → backend (api-gateway)`

---

## Layout приложения

```
┌──────────────┬───────────────────────────────────────┐
│              │                                       │
│   Sidebar    │             Main content              │
│  (collapse)  │           (max-w-3xl mx-auto)         │
│              │                                       │
│ • Search     │   ┌────────────────────────────┐      │
│   (Cmd+K)    │   │  Tiptap-editor             │      │
│ • Categories │   │  Placeholder: «Нажмите /»  │      │
│ • Projects   │   │                            │      │
│ • + Note     │   │                            │      │
│              │   └────────────────────────────┘      │
│ ─────────    │                                       │
│ User / Auth  │                                       │
└──────────────┴───────────────────────────────────────┘
```

- **Sidebar** — Shadcn `sidebar` (`npx shadcn add sidebar`). Содержит:
  - Поле поиска по заметкам (открывается через **Cmd+K** → Shadcn `command`).
  - Список категорий и проектов (с возможностью раскрытия).
  - Кнопка «Новая заметка».
  - Внизу — блок auth (профиль / вход / регистрация).
- **Main content** — ограниченная по ширине область `max-w-3xl mx-auto px-6` для фокусировки на тексте.
- **Тёмная тема** — переключатель в sidebar (или хедере), реализуется через `class="dark"` на `<html>` + Shadcn-токены.

Всё ниже — детали фич (`features/<name>/`), маршруты — в `pages/`.

---

## Редактор (Tiptap)

Заметки редактируются через **headless Tiptap**. Стилизация — наша, через Tailwind, не из готовых пакетов Tiptap «с UI».

### Структура файлов

```
features/notes/editor/
├── editor.tsx              ← основной компонент, useEditor()
├── extensions.ts           ← список Tiptap extensions (StarterKit, Placeholder, Link, …)
├── slash-menu/
│   ├── slash-menu.tsx      ← Shadcn Command, отрисовка пунктов
│   ├── items.ts            ← список команд (H1, H2, list, AI: Саммари, AI: Обсудить)
│   └── plugin.ts           ← Tiptap-плагин, ловит ввод '/' и подкидывает меню
├── floating-menu.tsx       ← пузырьковое меню для форматирования выделенного
└── ai-actions.ts           ← вызов AI-команд через TanStack Query mutations
```

### Правила

1. **Headless.** Не подключаем `@tiptap/extension-*-with-ui` или сторонние UI-пакеты Tiptap. Только `@tiptap/core` + extensions без UI. Все меню/тулбары — наши, на Shadcn.
2. **Slash-команды (`/`)** — открывают Shadcn `Command`. Пункты делятся на группы: «Блоки» (Heading 1, Heading 2, Bullet list, …) и «AI» (Саммари, Обсудить — иконка `Sparkles`).
3. **Floating menu** — Shadcn `popover` или встроенный Tiptap `BubbleMenu` с нашими `Button`-ами. Команды: **Bold**, **Italic**, **Link**, опционально `Sparkles` → инлайн-AI.
4. **Placeholder:** `«Нажмите '/' для команд или начните писать...»` — через extension `@tiptap/extension-placeholder`.
5. **AI-команды редактора** идут через TanStack Query mutation → `api-gateway` → `ai`. Результат вставляется в редактор (для саммари — отдельный AI-блок с `Sparkles` + `bg-muted`; для «обсудить» — открытие Sheet, см. `features/ai-chat/`).
6. **Стилизация контента** — через Tailwind классы на узлах (`prose prose-sm` от `@tailwindcss/typography` допустим, но без декоративных украшений). Без cursor-glow, без моргающего курсора.

### Зависимости (фиксируем при первой установке)

Базовый набор Tiptap-пакетов: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, `@tiptap/extension-link`. Дополнительные расширения добавляются по необходимости — в `package.json` без явного запроса не лезть.

---

## Ключевые правила

1. **Server state — только TanStack Query.** Никаких `useState` + `useEffect` + `fetch` для серверных данных.
2. **Query keys через фабрику** на фичу (`notesKeys.list(filters)`, `notesKeys.detail(id)`).
3. **Мутации делают `invalidateQueries`** после success.
4. **API парсит ответ Zod-ом**, не каст `as T`.
5. **Формы — React Hook Form + `zodResolver`.** Никаких параллельных `useState` для значений формы.
6. **Zod-схемы зеркалят бэкенд.** Backend на той же Zod — синхронизируй имена и ограничения.
7. **Shadcn первым делом.** Перед написанием своего компонента — `npx shadcn add <name>`.
8. **`components/ui/*` не редактируется руками.** Кастомизация через CVA-варианты, theme-токены, композицию.
9. **Tailwind через theme tokens** (`bg-background`, `text-foreground`, `bg-primary`, …) — не `bg-[#0f172a]`.
10. **`cn()` из `@/lib/utils`** для условных классов.
11. **Бизнес-логика — в `features/`**, страницы только собирают.
12. **Loading / Error / Empty состояния обязательны** для каждого экрана с данными.
13. **A11y minimum:** `aria-label` на icon-кнопках, `<label>` у inputs, focus-ring не отключаем, alt у `<img>`.
14. **Нет `any`.** Типы из Zod через `z.infer`.

---

## Типичный паттерн фичи

```ts
// features/notes/api.ts
import { http } from '@/lib/http'
import { notesArraySchema, noteSchema } from './schema'

export const notesKeys = {
  all: ['notes'] as const,
  lists: () => [...notesKeys.all, 'list'] as const,
  list: (filters?: NotesFilter) => [...notesKeys.lists(), filters ?? null] as const,
  detail: (id: string) => [...notesKeys.all, 'detail', id] as const,
}

export async function fetchNotes(filters?: NotesFilter) {
  const res = await http.get('/notes', { params: filters })
  return notesArraySchema.parse(res.data)
}
```

```ts
// features/notes/hooks/use-notes.ts
export function useNotes(filters?: NotesFilter) {
  return useQuery({
    queryKey: notesKeys.list(filters),
    queryFn: () => fetchNotes(filters),
  })
}
```

```tsx
// pages/notes-page.tsx
export function NotesPage() {
  const { data, isLoading, isError } = useNotes()
  if (isLoading) return <NotesListSkeleton />
  if (isError) return <ErrorState />
  if (!data?.length) return <EmptyState />
  return <NotesList notes={data} />
}
```

---

## Команды

```bash
npm run dev          # Vite dev server
npm run build        # production build → dist/
npm run preview      # serve dist/
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run deploy       # wrangler pages deploy dist
npx shadcn add <c>   # добавить Shadcn-компонент
```

**Стартовый набор Shadcn-компонентов** (ставим по мере появления фич, не разом):
`sidebar`, `command`, `dialog`, `sheet`, `card`, `form`, `input`, `textarea`, `select`, `button`, `badge`, `skeleton`, `tooltip`, `popover`, `dropdown-menu`, `separator`, `scroll-area`, `sonner`.

---

## Env

`VITE_*` переменные инлайнятся в бандл на этапе сборки — секретов в них быть не должно.

```
# .env.local (dev)
VITE_API_URL=http://localhost:8787   # локальный wrangler dev для api-gateway

# Production
VITE_API_URL=https://notetaker-api-gateway.<account>.workers.dev
```

`VITE_API_URL` всегда указывает на **api-gateway**. Адресов internal-воркеров (`ai`, `notes`, …) на фронте быть не должно — они недоступны извне.

В Pages-проекте production-значения задаются:
- через `[vars]` в `wrangler.toml` (если деплой через `wrangler pages deploy`)
- или в Cloudflare dashboard → Pages → Settings → Environment variables (если Git-интеграция)

---

## Пайплайн разработки

См. [`docs/dev-pipeline-front.md`](docs/dev-pipeline-front.md). Quick Pipeline для мелких/средних правок, Full Pipeline для крупных фич с декомпозицией и финальным ревью.

## Агенты-ревьюеры (`.claude/agents/`)

| Агент | Когда вызывать |
|-------|----------------|
| `pragmatic-architect` | На этапе планирования и в финале — против over-engineering |
| `query-guardian` | После реализации — TanStack Query / RHF / Zod |
| `ui-guardian` | После реализации — Shadcn / Tailwind / a11y |
| `clean-code-guardian` | После реализации — структура, naming, размеры |

Нейросеть **обязана** автоматически вызывать `query-guardian` / `ui-guardian` / `clean-code-guardian` после написания кода (см. шаг Q2 / 2.3 в пайплайне).

---

## Антипаттерны (см. полный список в `docs/dev-pipeline-front.md`)

- `useEffect` + `fetch` для серверных данных
- `useState` для серверных данных
- Хардкод queryKey-строк
- Реизобретённые модалки/dropdown'ы вместо Shadcn
- Хардкод цветов в Tailwind (`bg-[#...]`)
- Редактирование `components/ui/*`
- Каст `as T` ответа API вместо Zod-парсинга
- Бизнес-логика в `pages/`
- Пропуск состояний loading/error/empty
- Пропуск ручного тестирования UI в браузере

---

## Именование

| Сущность | Стиль | Пример |
|---|---|---|
| Файл | kebab-case | `note-card.tsx`, `use-notes.ts` |
| Компонент | PascalCase | `NoteCard`, `CreateNoteForm` |
| Хук | `use*` camelCase | `useNotes`, `useCreateNote` |
| Функция/переменная | camelCase | `fetchNotes`, `userId` |
| Тип/интерфейс | PascalCase | `NoteCardProps`, `Note` |
| Константа | UPPER_SNAKE_CASE | `MAX_NOTE_LENGTH` |
| Boolean | `is*` / `has*` / `can*` | `isLoading`, `hasError`, `canSubmit` |
| Обработчик (внутри) | `handle*` | `handleSubmit`, `handleNoteClick` |
| Обработчик (как prop) | `on*` | `onSelect`, `onChange` |

**Правила компонентов:**
- Один компонент = один файл, файл назван так же, как компонент (kebab-case → PascalCase внутри).
- Props через `interface`, не `type` (если нет union).
- Дефолтные значения через деструктуризацию props, не через `defaultProps`.
- Только функциональные компоненты, никаких классовых.

---

## Порядок импортов

```ts
// 1. React
import { useState, useEffect } from 'react'

// 2. Внешние библиотеки
import { useForm } from 'react-hook-form'
import { Trash } from 'lucide-react'

// 3. Внутренние модули через @/
import { Button } from '@/components/ui/button'
import { http } from '@/lib/http'

// 4. Локальные файлы того же модуля
import { useNotes } from './hooks/use-notes'

// 5. Типы — последними
import type { Note } from './types'
```

Относительные пути (`./`, `../`) допустимы только внутри одной фичи.

---

## Loading / Error / Empty состояния

**Каждая страница с асинхронными данными** обязана отрисовать все три состояния:

1. **Loading** — скелетон, повторяющий форму контента (карточки → прямоугольники, список → строки), не спиннер посреди экрана. Используй Shadcn `<Skeleton>` (`npx shadcn add skeleton`).
2. **Error** — `<ErrorState>` с понятным сообщением и кнопкой «повторить» (если retry имеет смысл).
3. **Empty** — `<EmptyState>` с подсказкой, что делать (CTA на создание).

```tsx
const { data, isLoading, isError } = useNotes()
if (isLoading) return <NotesListSkeleton />
if (isError) return <ErrorState />
if (!data?.length) return <EmptyState />
return <NotesList notes={data} />
```

---

## Документация фич (`docs/features/`)

Крупные фичи (новый домен в `features/`, новый AI-флоу) обязаны иметь файл `docs/features/<feature>.md`.

**Стиль:** сухо, без воды, **без примеров кода**. Только факты для понимания UX и зависимостей.

**Структура файла:**
```markdown
# <feature>

Одна фраза: что делает фича.

## UX-сценарий
Что видит пользователь на каждом шаге, состояния loading/error/empty.

## Зависимости
API эндпоинты бэка, Shadcn-компоненты, другие фичи.

## Hooks
- `useFeatureXxx()` — что возвращает, какие инвалидации делает мутация.

## Schemas
- Список Zod-схем (зеркала бэка).

## Ограничения
Бизнес-правила и инварианты.
```

**Правила:**
- Обновлять **сразу после** изменения кода фичи — документация всегда актуальна.
- Перед работой с фичей нейросеть обязана прочитать `docs/features/<feature>.md`.

---

## Правила работы с AI (Claude Code)

### Перед написанием кода

1. **Step-by-Step Thinking.** Кратко (одним абзацем) описать план: какие файлы создашь, что изменишь, как это решит задачу.
2. **Прочитать существующий код и доку фичи** (`docs/features/<feature>.md`), не предполагать структуру.
3. **Проверить, нет ли уже компонента в Shadcn**, прежде чем писать свой.
4. **Проверить, нет ли уже хука/утилиты** в `lib/` или фиче, прежде чем писать новую.
5. **Одна задача за раз** — не рефакторить попутно то, о чём не просили.
6. **Не трогать рабочий код** под предлогом «улучшения», если задача не про это.

### После написания кода

1. **Verification Step.** Внутренняя проверка: типы TypeScript, нет лишних импортов, соблюдены правила этого файла.
2. `npm run typecheck` обязательно.
3. **Прогон в браузере через `npm run dev`** — golden path + edge cases. Typecheck не проверяет UX.
4. Вызваны агенты-ревьюеры (см. пайплайн).

### При неопределённости — остановиться и уточнить

Не гадать, а задать вопрос с вариантами, если:
- Непонятно, в какой фиче должна быть логика
- Есть несколько равноценных подходов
- Задача затрагивает несколько фич и неясен приоритет
- Edge cases / поведение при ошибке не описаны

### Запрещено без явного запроса

- Добавлять новые зависимости в `package.json`
- Менять структуру роутинга
- Рефакторить рабочий код под предлогом «улучшения»
- Добавлять комментарии к коду, который не изменялся
- Писать `TODO` / `FIXME` / `HACK` без обсуждения
- Создавать новые файлы, если задача решается правкой существующих
- Использовать `console.log` в коммите (только для временной отладки с последующим удалением)
- Использовать `any` (используй `unknown` + сужение типа)
- Редактировать `components/ui/*` (Shadcn-скаффолды)

### Масштаб изменений

- **Минимальный diff = лучший diff.**
- Изменение должно быть ровно настолько большим, насколько нужно для задачи.
- Если задача большая — разбить на шаги и согласовать подход (Full Pipeline).
