# groups

CRUD групп (именованных контейнеров для заметок с иконкой, цветом, описанием). Живёт в `src/features/groups/`.

## Логика работы

**Первая загрузка:**
- `useGroups()` → `GET /groups`; при первом запросе бэк авто-сидирует дефолтные группы и возвращает их.
- Список кэшируется по ключу `['groups', 'list']`.

**Создание группы:**
1. Форма в `GroupsPage` (или модальный диалог) валидируется через Zod + React Hook Form.
2. `useCreateGroup` → `POST /groups` → оптимистичное добавление в кэш → `onError` откатывает.
3. `onSuccess` инвалидирует список.

**Обновление группы:**
- `useUpdateGroup(id)` → `PATCH /groups/:id` → оптимистичное обновление записи в кэше.

**Удаление группы:**
- `useDeleteGroup` → `DELETE /groups/:id` → оптимистичное удаление из кэша.
- На сервере `groupId` у заметок группы обнуляется; фронт не делает дополнительных запросов.

**Оптимистичные обновления (все мутации):**
- `onMutate` — отменяет активные запросы, сохраняет предыдущее состояние кэша, применяет изменение.
- `onError` — восстанавливает предыдущее состояние.
- `onSettled` — инвалидирует список для синхронизации с сервером.

**Иконки и цвета (`src/features/groups/constants.ts`):**
- 12 вариантов иконок (Lucide): `FileText`, `Briefcase`, `BookOpen`, `Star`, `Heart`, `Code`, `Music`, `Camera`, `Globe`, `Zap`, `Target`, `Lightbulb`.
- 9 вариантов цветов (hex): `#64748b`, `#ef4444`, `#f97316`, `#eab308`, `#22c55e`, `#06b6d4`, `#3b82f6`, `#8b5cf6`, `#ec4899`.

**Компонент `GroupIcon`:**
- `src/features/groups/components/group-icon.tsx` — рендерит Lucide-иконку по строковому имени из `name`.

**AI-предложения группы (`group-suggestions.tsx`):**
- Компонент в правом сайдбаре `NoteEditorPage`.
- `suggestGroups(noteText)` → `POST /ai/suggest-group` → `{ suggestions: { groupId, score }[], emptyGroupIds }`.
- Показывает список рекомендованных групп с кнопкой «Назначить».
- При назначении вызывает `useUpdateNote` с `{ groupId }`.

## Зависимости
- **`src/lib/http.ts`** — Axios instance.
- **`src/features/ai/api.ts`** — `suggestGroups()` для AI-предложений.
- **`src/features/notes/hooks/use-notes.ts`** — `useUpdateNote` при назначении группы из сайдбара.
- **API:** `GET /groups`, `POST /groups`, `PATCH /groups/:id`, `DELETE /groups/:id`.

## Страницы
- `/groups` → `GroupsPage` — список карточек групп, создание, редактирование, удаление.
- `/notes/:id` → `NoteEditorPage` — сайдбар с AI-предложениями группы (`group-suggestions.tsx`).
- `/graph` → `GraphPage` — группы отображаются как узлы графа, заметки — как связанные с ними дочерние узлы.

## Хуки (`src/features/groups/hooks/use-groups.ts`)
- `useGroups()` — список групп; query key `['groups', 'list']`.
- `useCreateGroup()` — мутация создания с оптимистичным добавлением.
- `useUpdateGroup(id)` — мутация обновления с оптимистичным patch записи.
- `useDeleteGroup()` — мутация удаления с оптимистичным удалением из кэша.

## API-функции (`src/features/groups/api.ts`)
- `fetchGroups() → Group[]` — `GET /groups`.
- `createGroup(data) → Group` — `POST /groups`.
- `updateGroup(id, data) → Group` — `PATCH /groups/:id`.
- `deleteGroup(id) → void` — `DELETE /groups/:id`.

## Схемы (`src/features/groups/schema.ts`)
- `Group` — `{ id, userId, name, description, icon, color, isDefault, createdAt, updatedAt }`.
- `CreateGroupInput` — `{ name: string(1..100), description?: string(≤500), icon?: string, color?: string }`.
- `UpdateGroupInput` — `{ name?, description?, icon?, color? }`.

## Query keys (`groupsKeys`)
- `groupsKeys.all` → `['groups']`
- `groupsKeys.lists()` → `['groups', 'list']`

## Ограничения
- **`isDefault` — только для чтения.** Фронт отображает флаг для UX (дефолтные группы выделены), но не может его выставить через форму.
- **Нет ограничения на количество групп.** Создание всегда доступно.
- **Удаление необратимо.** Группа не восстанавливается; заметки остаются (groupId обнуляется на сервере).
- **Фильтрация заметок по группе — на клиенте.** `GroupsPage` / `DashboardPage` фильтруют кэш `useNotes()`, не делают повторных запросов с `groupId`.
