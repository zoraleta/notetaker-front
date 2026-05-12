# notes

CRUD заметок и rich-text редактор на базе Tiptap. Живёт в `src/features/notes/`.

## Логика работы

**Создание заметки:**
1. Кнопка «Новая заметка» (Dashboard или Sidebar) вызывает `useCreateNote`.
2. `createNote` отправляет `POST /notes` с пустым Tiptap-документом.
3. После успеха `navigate('/notes/:id')` — сразу открывается редактор.
4. `useCreateNote.onSuccess` инвалидирует `notesKeys.lists()`.

**Редактор (Tiptap):**
- `editor.tsx` — монтирует `useEditor` с расширениями из `extensions.ts`: `StarterKit`, `Placeholder`, `Link`, `LoadingPlaceholder`.
- Placeholder: `"Нажмите '/' для команд или начните писать..."`.
- Автосохранение: `useUpdateNote` вызывается с debounce 1.5 с после каждого изменения содержимого.
- При сохранении передаются `contentJson` (Tiptap JSON) и `contentText` (plaintext из `editor.getText()`).

**Slash-меню (`/`):**
- Открывается при вводе `/` в пустой строке.
- `items.ts` — список команд (заголовки, списки и т.д.).
- `slash-menu.tsx` — кастомное Tiptap-расширение типа `Suggestion`.

**Floating toolbar (`floating-menu.tsx`):**
- Появляется при выделении текста (Tiptap `BubbleMenu`).
- Кнопки: Bold, Italic, Strike, Link.

**URL-саммаризация (`url-summary-dialog.tsx`):**
- Диалог вставки URL.
- Вызывает `summarizeUrl(url)` из `src/features/ai/api.ts`: сначала `POST /links/parse`, затем `POST /ai/summarize` (SSE-стрим).
- Результат потоково вставляется в редактор через `LoadingPlaceholder` → замена на реальный контент.
- `markdown-to-tiptap.ts` конвертирует Markdown-ответ саммари в Tiptap JSON.

**Обновление заметки (`useUpdateNote`):**
- Оптимистичное обновление: кэш `notesKeys.detail(id)` обновляется немедленно, при ошибке откатывается.
- `onSuccess`: обновляет кэш деталей + инвалидирует список.

**Удаление заметки:**
- `useDeleteNote` → `DELETE /notes/:id` → инвалидирует список → `navigate('/dashboard')`.

**Похожие заметки (`similar-notes.tsx`):**
- Сайдбар редактора: `useSimilarNotes(id)` → `GET /notes/:id/similar`.
- Отображает список `{ id, title, score }`.
- Кнопка «Объединить» рядом с каждой — запускает `useMergeNotes`.

**Объединение заметок (`useMergeNotes`):**
- `POST /ai/merge` с `{ activeNoteId, noteIds }`.
- Ответ — строка с объединённым текстом; вставляется в редактор через `markdown-to-tiptap`.

**Фильтрация в Dashboard:**
- `useNotes(q?)` — передаёт `?q=` в `GET /notes`. Параметр — строка поиска (не семантический, строковой фильтр на сервере либо просто передаётся).
- Фильтр по группе и тегам реализован на стороне UI (не через query-параметры).

## Зависимости
- **`src/lib/http.ts`** — Axios instance для всех запросов.
- **`src/features/ai/api.ts`** — `summarizeUrl`, `structurizeNote` (вызываются из редактора).
- **`src/lib/markdown-to-tiptap.ts`** — конвертация Markdown → Tiptap JSON.
- **API:** `GET /notes`, `GET /notes/:id`, `POST /notes`, `PATCH /notes/:id`, `DELETE /notes/:id`, `GET /notes/:id/similar`, `POST /ai/merge`.

## Страницы
- `/dashboard` → `DashboardPage` — карточки заметок, кнопка создания, фильтр.
- `/notes/:id` → `NoteEditorPage` — редактор + правый сайдбар (похожие заметки, AI-предложения группы).

## Хуки (`src/features/notes/hooks/use-notes.ts`)
- `useNotes(q?)` — список заметок; query key `['notes', 'list', q]`.
- `useNote(id)` — одна заметка; query key `['notes', 'detail', id]`.
- `useCreateNote()` — мутация создания; инвалидирует список.
- `useUpdateNote(id)` — мутация обновления; оптимистичный update кэша деталей.
- `useDeleteNote()` — мутация удаления; инвалидирует список.
- `useSimilarNotes(id)` — похожие заметки; query key `['notes', 'similar', id]`.
- `useMergeNotes()` — мутация объединения; без автоматической инвалидации.

## API-функции (`src/features/notes/api.ts`)
- `fetchNotes(q?) → Note[]` — `GET /notes`.
- `fetchNote(id) → Note` — `GET /notes/:id`.
- `createNote(data) → Note` — `POST /notes`.
- `updateNote(id, data) → Note` — `PATCH /notes/:id`.
- `deleteNote(id) → void` — `DELETE /notes/:id`.
- `fetchSimilarNotes(id) → SimilarNoteHit[]` — `GET /notes/:id/similar`.
- `mergeNotes(activeNoteId, noteIds) → string` — `POST /ai/merge`.

## Схемы (`src/features/notes/schema.ts`)
- `Note` — `{ id, title, contentJson, contentText, groupId: string|null, tags, isIndexedAt, createdAt, updatedAt }`.
- `CreateNoteInput` — `{ title?, contentJson, contentText, tags? }`.
- `UpdateNoteInput` — `{ title?, contentJson?, contentText?, groupId?: string|null, tags? }`.
- `SimilarNoteHit` — `{ id, title, score }` (определён в `api.ts`).

## Query keys (`notesKeys`)
- `notesKeys.all` → `['notes']`
- `notesKeys.lists()` → `['notes', 'list']`
- `notesKeys.list(q?)` → `['notes', 'list', q ?? null]`
- `notesKeys.detail(id)` → `['notes', 'detail', id]`
- `notesKeys.similar(id)` → `['notes', 'similar', id]`

## Ограничения
- **`contentText` формируется на фронте.** Бэк хранит plain-текст для эмбеддингов; фронт обязан передавать актуальный `contentText` при каждом `PATCH`.
- **Автосохранение не ждёт предыдущего запроса.** При быстрой печати несколько `PATCH`-запросов летят параллельно; оптимистичный update покрывает визуальный сдвиг.
- **Фильтрация по группе — на клиенте.** `GET /notes` не принимает `groupId` от фронта; список фильтруется в компоненте.
- **Нет пагинации.** Все заметки загружаются одним запросом.
- **`mergeNotes` не инвалидирует кэш.** После объединения результат вставляется в редактор напрямую; список заметок не обновляется автоматически.
