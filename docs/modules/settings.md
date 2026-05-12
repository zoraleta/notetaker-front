# settings

Управление AI-настройками: активная модель и переопределения промптов. Живёт в `src/features/settings/`.

## Логика работы

**Загрузка настроек:**
- `useSettings()` → `GET /settings` → `{ activeModel, allowedModels, prompts: { key, label, default, current }[] }`.
- Кэшируется по ключу `['settings']`.

**Смена модели:**
- `useUpdateModel()` → `PUT /settings/active-model` с `{ model }`.
- `onSuccess` инвалидирует `['settings']`.

**Переопределение промпта:**
- `useUpdatePrompt()` → `PUT /settings/prompts/:key` с `{ value }`.
- `onSuccess` инвалидирует `['settings']`.

**Сброс промпта к дефолту:**
- Не отдельный эндпоинт на фронте; реализуется через `PUT /settings/prompts/:key` с дефолтным значением (или через `DELETE /settings/prompts/:key` — если бэк поддерживает).

**Настройки глобальные:** они принадлежат инстансу, не пользователю. JWT требуется как guard авторизации, но данные общие для всех пользователей.

## Зависимости
- **`src/lib/http.ts`** — Axios instance.
- **API:** `GET /settings`, `PUT /settings/active-model`, `PUT /settings/prompts/:key`.

## Страницы
- `/settings` → `SettingsPage` — выбор модели (select) + список промптов с текстовыми полями.

## Хуки (`src/features/settings/hooks/use-settings.ts`)
- `useSettings()` — загрузка настроек.
- `useUpdateModel()` — мутация смены модели.
- `useUpdatePrompt()` — мутация обновления промпта.

## API-функции (`src/features/settings/api.ts`)
- `fetchSettings() → Settings` — `GET /settings`.
- `updateModel(model) → void` — `PUT /settings/active-model`.
- `updatePrompt(key, value) → void` — `PUT /settings/prompts/:key`.

## Схемы (`src/features/settings/schema.ts`)
- `Settings` — `{ activeModel: string, allowedModels: string[], prompts: PromptEntry[] }`.
- `PromptEntry` — `{ key: string, label: string, default: string, current: string }`.

## Query keys (`settingsKeys`)
- `settingsKeys.all` → `['settings']`

## Ограничения
- **Глобальные настройки.** Изменение промпта или модели одним пользователем влияет на всех.
- **Модель — из whitelist бэка.** `allowedModels` приходит с сервера; фронт не хардкодит список.
- **Нет оптимистичных обновлений.** Настройки меняются редко; обновление ждёт ответа сервера.
