# ai

AI-функции приложения: семантический поиск, саммаризация URL, обсуждение заметки, предложение группы, структурирование, форматирование. Живёт в `src/features/ai/`.

## Логика работы

### Семантический поиск
- Хоткей `Ctrl+K` / `Cmd+K` открывает поисковую панель в `app-sidebar.tsx`.
- `useSemanticSearch(query)` → debounce 350 мс → `POST /ai/search` → `{ noteId, title, score }[]`.
- Минимальный скор для показа задаётся бэком (`MIN_SEARCH_SCORE = 0.4`); фронт просто отображает пришедшие результаты.
- Query key: `['ai', 'search', q]`.

### Саммаризация URL (`url-summary-dialog.tsx`)
1. Пользователь вставляет URL в диалог.
2. `summarizeUrl(url)` — двухшаговый вызов:
   - `POST /links/parse` → `{ content, title, ... }`.
   - `POST /ai/summarize` с `{ text: content }` — возвращает SSE-стрим.
3. Стрим читается через `ReadableStream`; контент потоково вставляется в редактор через `LoadingPlaceholder`.
4. По завершении стрима Markdown конвертируется в Tiptap JSON через `markdown-to-tiptap.ts` и заменяет placeholder.
5. Оба запроса идут через `authFetch` (нативный `fetch` с `Authorization` заголовком).

### Обсуждение заметки (`discuss-sheet.tsx`)
- Боковая панель в `NoteEditorPage`.
- `discussNote(noteId, messages, signal)` → `POST /ai/discuss` → SSE-стрим.
- Каждый токен дописывается в текущее сообщение ассистента через `useState`.
- `AbortSignal` используется для отмены запроса при закрытии панели.
- `markdown-text.tsx` рендерит Markdown из стрима через `ReactMarkdown`.

### Форматирование для заметки
- Компонент в редакторе (slash-меню или кнопка).
- `formatForNote(messages, signal)` → `POST /ai/format-for-note` → SSE-стрим.
- Ответ вставляется в редактор так же, как результат саммари (через LoadingPlaceholder → Tiptap JSON).

### Структурирование заметки
- `structurizeNote(text)` → `POST /ai/structurize` → `{ structured: string }`.
- Не стрим; ответ возвращается целиком.
- Результат передаётся в `markdown-to-tiptap.ts` и вставляется в редактор.

### Предложение группы (`group-suggestions.tsx`)
- Сайдбар `NoteEditorPage` периодически вызывает `suggestGroups(noteText)`.
- `POST /ai/suggest-group` → `{ suggestions: { groupId, score }[], emptyGroupIds }`.
- `emptyGroupIds` — группы без заметок, которые бэк возвращает отдельно (soft-fail; может быть пустым массивом).
- Фронт отображает предложения с процентом совпадения; кнопка «Назначить» вызывает `useUpdateNote({ groupId })`.

### Транспорт: два клиента
- **Axios (`http`)** — для обычных JSON-запросов: `suggestGroups`, `semanticSearch`, `structurizeNote`.
- **`authFetch` (нативный `fetch`)** — для SSE-стримов: `summarizeUrl`, `discussNote`, `formatForNote`. `authFetch` берёт токен через `getToken()` из `src/features/auth/api.ts`.

## Зависимости
- **`src/lib/http.ts`** — Axios instance для не-стримовых вызовов.
- **`src/features/auth/api.ts`** — `getToken()` для `authFetch`.
- **`src/lib/markdown-to-tiptap.ts`** — конвертация Markdown → Tiptap JSON.
- **`src/features/notes/hooks/use-notes.ts`** — `useUpdateNote` для назначения группы.
- **API:** `POST /ai/search`, `POST /links/parse`, `POST /ai/summarize`, `POST /ai/discuss`, `POST /ai/format-for-note`, `POST /ai/structurize`, `POST /ai/suggest-group`.

## Хуки (`src/features/ai/hooks/use-ai.ts`)
- `useSemanticSearch(query)` — дебаунсированный `useQuery`; включается только при непустом `query`.

## API-функции (`src/features/ai/api.ts`)
- `semanticSearch(query) → SearchHit[]` — `POST /ai/search`.
- `suggestGroups(noteText) → GroupSuggestResult` — `POST /ai/suggest-group`.
- `summarizeUrl(url) → { stream: ReadableStream, title: string }` — `POST /links/parse` + `POST /ai/summarize`.
- `discussNote(noteId, messages, signal?) → Response` — `POST /ai/discuss` (SSE).
- `formatForNote(messages, signal?) → Response` — `POST /ai/format-for-note` (SSE).
- `structurizeNote(text) → string` — `POST /ai/structurize`.

## Типы (`src/features/ai/api.ts`)
- `SearchHit` — `{ noteId: string, title: string, score: number }`.
- `GroupSuggestResult` — `{ suggestions: { groupId: string, score: number }[], emptyGroupIds: string[] }`.

## Query keys (`aiKeys`)
- `aiKeys.search(q)` → `['ai', 'search', q]`

## Компоненты
- `discuss-sheet.tsx` — чат-интерфейс; управляет историей сообщений и SSE-стримом.
- `markdown-text.tsx` — рендерит стриминговый Markdown через `ReactMarkdown`.
- `group-suggestions.tsx` (в `src/features/notes/components/`) — предложения группы для текущей заметки.

## Ограничения
- **SSE без `EventSource`.** Все стримы читаются вручную через `ReadableStream` / `TextDecoder`; нет автореконнекта.
- **`AbortController` — вне хука.** Компонент сам управляет сигналом отмены; при размонтировании `discuss-sheet` запрос обрывается.
- **`summarizeUrl` — без кэша TanStack Query.** Каждый вызов — новый запрос; нет `useQuery`.
- **`structurizeNote` — без кэша.** То же: прямой вызов из компонента.
- **Скор предложений группы — от бэка.** `MIN_GROUP_SCORE = 0.3` задан на сервере; фронт показывает всё, что пришло.
