# routing

Навигация приложения на React Router v7. Конфиг в `src/router.tsx`.

## Структура роутов

| Путь | Компонент | Защита |
|------|-----------|--------|
| `/login` | `LoginPage` | `RedirectIfAuth` |
| `/register` | `RegisterPage` | `RedirectIfAuth` |
| `/` | редирект → `/dashboard` | `RequireAuth` |
| `/dashboard` | `DashboardPage` | `RequireAuth` |
| `/notes/:id` | `NoteEditorPage` | `RequireAuth` |
| `/groups` | `GroupsPage` | `RequireAuth` |
| `/settings` | `SettingsPage` | `RequireAuth` |
| `/graph` | `GraphPage` | `RequireAuth` |

Все защищённые роуты вложены в `AppLayout` (sidebar + `<Outlet>`).

## Логика работы

**`RequireAuth`:**
- Синхронно проверяет `hasAuthToken()` (наличие `localStorage.token`).
- Если токена нет → `<Navigate to="/login?from={pathname}" replace />`.
- Не делает запроса к серверу; невалидный токен обнаружится при первом API-запросе (401 → интерцептор Axios → редирект на `/login`).

**`RedirectIfAuth`:**
- Если токен есть → `<Navigate to="/dashboard" replace />`.
- Предотвращает попадание авторизованного пользователя на `/login` или `/register`.

**Сохранение `from`:**
- `from` — `encodeURIComponent(pathname)` передаётся в query-параметре.
- `useLogin` / `useRegister` после успешной аутентификации делают `navigate(from || '/dashboard')`.
- Аналогично Axios-интерцептор при 401 ставит `?from=` перед редиректом.

**`AppLayout` (`src/components/app-layout.tsx`):**
- Рендерит `AppSidebar` слева и `<Outlet />` справа.
- Сайдбар доступен на всех вложенных страницах.

## Зависимости
- **`src/features/auth/api.ts`** — `hasAuthToken()`.
- **`src/components/app-layout.tsx`** — общий layout для защищённых страниц.
- **`src/pages/*.tsx`** — страницы.

## Ограничения
- **Нет ленивой загрузки.** Все страницы импортируются статически; `React.lazy` не используется.
- **Нет роли/прав.** Единственное разделение — авторизован / не авторизован.
- **Нет 404-страницы.** Неизвестный путь остаётся без отображения (нет `path='*'`).
