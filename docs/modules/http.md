# http

HTTP-клиент и транспортный слой. Живёт в `src/lib/`.

## Логика работы

**Axios instance (`src/lib/http.ts`):**
- `baseURL` из `import.meta.env.VITE_API_URL`.
- **Request interceptor:** добавляет `Authorization: Bearer {token}` из `localStorage.token` к каждому запросу.
- **Response interceptor:** при статусе 401 — удаляет токен, делает `window.location.href = /login?from={pathname}`.

**`authFetch` (`src/features/ai/api.ts`):**
- Нативный `fetch` для SSE-стримов, где `axios` неприменим (нет поддержки `ReadableStream`).
- Берёт токен через `getToken()` и ставит заголовок вручную.
- Используется только для `summarizeUrl`, `discussNote`, `formatForNote`.

**TanStack Query client (`src/lib/query-client.ts`):**
- `staleTime: 60_000` — 1 минута до перезапроса.
- `retry: 1` — одна повторная попытка при ошибке.

## Переменные окружения
- `VITE_API_URL` — базовый URL бэкенда (например, `https://notetaker-api-gateway.workers.dev`). Задаётся в `.env` / `.env.local`.

## Зависимости
- **`src/features/auth/api.ts`** → `getToken()` используется в `authFetch`.

## Ограничения
- **Один Axios instance на всё приложение.** Нет отдельных инстансов для разных сервисов.
- **401 — жёсткий редирект.** Не через React Router `navigate`, а через `window.location.href`; история браузера сбрасывается.
- **`authFetch` не использует интерцепторы.** Ошибки из SSE-стримов обрабатываются вручную в вызывающем коде.
