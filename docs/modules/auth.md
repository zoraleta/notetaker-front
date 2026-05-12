# auth

Регистрация, вход, хранение токена и защита роутов. Живёт в `src/features/auth/`.

## Логика работы

**Токен:** хранится в `localStorage` под ключом `token`. Функции `getToken`, `setToken`, `removeToken`, `hasAuthToken` — единственная точка доступа к токену во всём приложении.

**Axios-интерцептор (`src/lib/http.ts`):** к каждому исходящему запросу добавляет заголовок `Authorization: Bearer {token}`. При ответе 401 — удаляет токен из localStorage и переводит браузер на `/login?from={текущий путь}`.

**Нативный `fetch` для стримов (`src/features/ai/api.ts`):** использует `getToken()` напрямую и формирует заголовок вручную, т.к. Axios не поддерживает ReadableStream.

**Защита роутов (`src/router.tsx`):**
- `RequireAuth` — обёртка; если токена нет, редиректит на `/login?from={from}`. Оборачивает всё дерево под `AppLayout`.
- `RedirectIfAuth` — обёртка для `/login` и `/register`; если токен есть — редиректит на `/dashboard`.

**Логин / регистрация:**
1. Форма валидируется через Zod + React Hook Form (`src/features/auth/schema.ts`).
2. `useLogin` / `useRegister` вызывают `login()` / `register()`.
3. При успехе сохраняют токен через `setToken`, затем `navigate(from || '/dashboard')`.

**Выход из системы:** явного `logout` роута нет — удаление токена через `removeToken()` + ручной редирект (или автоматически при 401).

## Зависимости
- **`src/lib/http.ts`** — Axios instance; auth-интерцепторы живут здесь.
- **`src/router.tsx`** — `RequireAuth` / `RedirectIfAuth` используют `hasAuthToken()`.
- **`src/features/ai/api.ts`** — импортирует `getToken()` для нативного `fetch`.
- **API:** `POST /auth/login`, `POST /auth/register`.

## Страницы
- `/login` → `LoginPage` — форма логина, ссылка на регистрацию.
- `/register` → `RegisterPage` — форма регистрации, ссылка на логин.

## Хуки
- `useLogin()` — `useMutation` → `login()` → `setToken` → `navigate`.
- `useRegister()` — `useMutation` → `register()` → `setToken` → `navigate`.

## API-функции (`src/features/auth/api.ts`)
- `login(data) → { token }` — `POST /auth/login`.
- `register(data) → { token }` — `POST /auth/register`.
- `getToken() → string | null` — читает `localStorage.token`.
- `setToken(token)` — пишет `localStorage.token`.
- `removeToken()` — удаляет `localStorage.token`.
- `hasAuthToken() → boolean` — проверяет наличие токена.

## Схемы (`src/features/auth/schema.ts`)
- `loginSchema` — `{ email: string, password: string }`.
- `registerSchema` — то же; пароль ≥ 8 символов.

## Ограничения
- **Токен без проверки срока.** Фронт не декодирует JWT; истечение обнаруживается только при ответе 401 от сервера.
- **Нет refresh-токена.** При истечении сессии пользователь логинится заново.
- **Нет `logout`-эндпоинта.** Выход — удаление токена на клиенте.
- **`hasAuthToken` — синхронная.** Проверяет наличие строки, не валидность токена; невалидный токен обнаружится только при первом запросе (401).
