# Пайплайн разработки с нейросетями (notetaker-front)

Руководство для разработчика и AI-ассистента по совместной разработке функционала на стеке **React + Vite + TypeScript + Shadcn UI + Tailwind + TanStack Query + React Hook Form + Zod + Tiptap (headless editor)**.

---

## Выбор пайплайна

| Масштаб | Триггер | Пайплайн |
|---------|---------|----------|
| **Мелкий** | Фикс бага, 1–2 файла, < 50 строк | [Quick Pipeline](#quick-pipeline) |
| **Средний** | Новый компонент/хук/форма, 3–5 файлов | [Quick Pipeline](#quick-pipeline) |
| **Крупный** | Новая фича в `features/`, новые роуты, новый AI-флоу | [Full Pipeline](#full-pipeline) |

---

# Quick Pipeline

Укороченный пайплайн для мелких/средних изменений.

## Когда использовать

- Фикс бага в существующем компоненте
- Новый компонент в существующей фиче
- Новый хук-обёртка над useQuery/useMutation
- Стилевые правки, рефакторинг без смены архитектуры

## Шаги

### Q1. Краткий анализ

```
📍 QUICK PIPELINE: Анализ задачи

**Задача:** [краткое описание]
**Масштаб:** Мелкий / Средний
**Затрагиваемые файлы:** ~N файлов

Начинаю реализацию.
```

### Q2. Реализация + проверка агентами

Нейросеть:
1. Пишет код
2. После написания **автоматически** вызывает агентов:
   - 🤖 `query-guardian` — если код трогает API/queryKey/мутации/формы
   - 🤖 `ui-guardian` — если код добавляет/меняет UI
   - 🤖 `clean-code-guardian` — если изменён файл > 50 строк
3. Исправляет замечания

```
📍 QUICK PIPELINE: Реализация

[Код...]

🤖 Агенты:
- query-guardian: ✅ Пройдено / ⚠️ Исправлено
- ui-guardian: ✅ Пройдено / ⚠️ Исправлено
- clean-code-guardian: ✅ Пройдено / ⚠️ Исправлено

Запусти `npm run typecheck` и проверь в браузере через `npm run dev`.
```

### Q3. Проверка и коммит

Разработчик:
1. `npm run typecheck` (`tsc --noEmit`)
2. `npm run lint`
3. **Ручной прогон в браузере** через `npm run dev` — golden path + edge cases
4. Коммит

```
📍 QUICK PIPELINE: Готово

Изменения готовы. Сделай коммит:
`git add . && git commit -m "тип(scope): описание"`
```

---

# Full Pipeline

Полный пайплайн для крупных фич.

---

## Фаза 0: Подготовка

### Разработчик
1. Создать ветку: `git checkout -b feature/название-фичи`
2. Сформулировать цель в 2–3 предложениях
3. Определить Definition of Done (включая UX-критерии: лоадеры, ошибки, пустые состояния)

### Нейросеть
1. Изучить контекст:
   - `CLAUDE.md` — стек, структура, ключевые паттерны
   - `src/features/*` — существующие фичи как образец
   - `src/lib/http.ts` и `src/lib/query-client.ts` — http/QueryClient настройки
   - `components.json` — конфиг Shadcn (где компоненты, какие алиасы)
   - Контракт API бэка (`notetaker-back`) — Zod-схемы должны зеркалить
2. Не предлагать решений, противоречащих архитектуре
3. Проверить, есть ли в Shadcn нужный компонент, прежде чем писать свой

---

## Фаза 1: Декомпозиция

### Разработчик
- Описывает бизнес-цель и UX-сценарий

### Нейросеть
- Разбивает на этапы (1–4 часа работы каждый)
- Создаёт план в `docs/features/<feature-name>.md`

### 🤖 Вызов pragmatic-architect

```
📍 PIPELINE: Фаза 1 — Декомпозиция

[План этапов...]

🤖 pragmatic-architect: проверка на over-engineering

⚖️ Результат:
- Необходимость: ✅
- Простота: ✅ / ⚠️
- Использование Shadcn / существующих хуков: ✅ / ⚠️

Подтверди план или внеси корректировки.
```

**Формат плана:**
```markdown
# <Название фичи>

## Цель
[Краткое описание]

## UX-сценарий
- Что видит пользователь на каждом шаге
- Состояния: loading, error, empty

## Этапы

### Этап 1: <Название>
- Описание
- Затрагиваемые слои: features / pages / components / lib
- Новые файлы:
- Зависимости от других этапов / API эндпоинтов
- Shadcn-компоненты, которые нужны (Dialog, Command, ...)

### Этап 2: ...

## Definition of Done
- [ ] Критерий 1
- [ ] Критерий 2
- [ ] Loading/Error/Empty состояния реализованы
```

---

## Фаза 2: Цикл разработки этапа

### 2.1 Планирование этапа

Нейросеть составляет детальный план:
- Структура `features/<feature>/`
- Какие хуки `useXxx()` обёртки над useQuery/useMutation нужны
- Какие Zod-схемы (синхронные с бэком)
- Какие Shadcn-примитивы используем (`npx shadcn add ...`)
- Loading / Error / Empty состояния

### 🤖 pragmatic-architect (для архитектурных этапов)

```
📍 PIPELINE: Фаза 2.1 — Планирование этапа N

[План...]

🤖 pragmatic-architect

⚖️ Verdict: Approved / Needs Simplification
```

### 2.2 Ревью плана разработчиком

**Критерии хорошего плана:**
- Без over-engineering
- Server state — только через TanStack Query (нет useState для серверных данных)
- Формы — только React Hook Form + zodResolver
- Shadcn-первый: проверили, нет ли уже готового компонента
- Учтены состояния loading/error/empty

### 2.3 Реализация

Нейросеть:
- Пошагово реализует план
- При необходимости: `npx shadcn add <component>`
- `npm run typecheck` после изменений типов
- Параллельно отслеживает консольные ошибки в `npm run dev`

### 🤖 Автоматический вызов агентов после реализации

```
📍 PIPELINE: Фаза 2.3 — Реализация

[Код...]

🤖 Проверка агентами:

query-guardian:
- Server state через useQuery (нет useEffect+fetch): ✅
- Query key factory используется: ✅
- Мутации делают invalidateQueries: ✅
- Формы — RHF + zodResolver: ✅
- API парсит ответ через Zod: ✅

ui-guardian:
- Используются Shadcn-примитивы (нет реизобретённых модалок): ✅
- Theme tokens (bg-background и т.д.), нет хардкодных цветов: ✅
- Нет градиентов / glow / shimmer / sparkle-фонов / scale-on-hover: ✅
- AI-функции отмечены иконкой Sparkles (lucide-react): ✅
- AI-блок оформлен нейтрально (bg-muted + border): ✅
- Tiptap headless: нет UI-пакетов сверху, slash-меню через Shadcn Command: ✅
- A11y: aria-label на icon-кнопках, label у inputs: ✅
- cn() для условных классов: ✅

clean-code-guardian:
- Структура `features/<feature>/`: ✅
- Naming (kebab-case files, PascalCase components, useX hooks, isX booleans): ✅
- Размер компонентов: ✅
- Early returns, без магических значений: ✅

Готово к ручному тестированию в браузере.
```

### 2.4 Ручное тестирование (UI!)

**Это критично для фронта.** Typecheck не проверяет UX.

Нейросеть составляет чек-лист:
```markdown
## Чек-лист этапа N

### Golden path
- [ ] Открыть страницу X → данные грузятся → отображаются
- [ ] Заполнить форму → submit → success-toast → данные обновились

### Loading / Error / Empty
- [ ] Замедлить сеть (Network: Slow 3G) → виден skeleton/loader
- [ ] Сервер 500 → виден ErrorState с понятным сообщением
- [ ] Пустые данные → виден EmptyState

### Валидация формы
- [ ] Невалидные данные → inline-ошибки от Zod
- [ ] Disabled submit при isPending
- [ ] После success: form.reset()

### Auth
- [ ] Без токена → редирект на /login
- [ ] С истёкшим токеном → корректная обработка 401

### Адаптив
- [ ] Mobile (< 640px)
- [ ] Tablet
- [ ] Desktop

### A11y minimum
- [ ] Tab проходит по интерактивным элементам
- [ ] Focus-ring виден
- [ ] Icon-only кнопки имеют aria-label
```

Разработчик проходит чек-лист в браузере, фиксирует баги.

### 2.5 Code Review

Нейросеть проверяет:

1. **Слои** — `features/` владеют логикой, `pages/` собирают, `components/ui/` не редактируется руками
2. **Дублирование** — общие хелперы в `lib/`, нет копипасты queryFn/mutationFn
3. **Безопасность** — Zod парсит ответы API, не `as Note[]`; токены в HttpOnly cookie или защищённом хранилище; нет XSS через `dangerouslySetInnerHTML`
4. **Ошибки** — все `useQuery`/`useMutation` обрабатывают `isError`, ничего не глотается молча
5. **TypeScript** — нет `any`; типы из Zod через `z.infer`; props через `interface`
6. **Производительность** — `React.lazy` для страниц если бандл большой; `useMemo`/`useCallback` только там, где меряли

### 2.6 Исправления

Нейросеть исправляет замечания, объясняет каждое.

### 2.7 Коммит

```
feat(scope): краткое описание

- Деталь 1
- Деталь 2
```

Один этап = один коммит (или несколько логически связанных).

### 2.8 → следующий этап

---

## Фаза 3: Завершение фичи

### Интеграционная проверка
- Полный пользовательский сценарий end-to-end в браузере (`npm run dev`)
- Проверка с реальным `notetaker-back` (не моками)
- Проверка билда: `npm run build` + `npm run preview`
- **Cloudflare Pages dry-run:** `wrangler pages deploy dist --dry-run` (или эквивалент в CI), убедиться, что бандл собирается и SPA-роутинг настроен
- **`VITE_API_URL`** для production указывает на Workers prod-URL (не на localhost) — задано через `wrangler.toml` `[vars]` или Pages dashboard
- Lighthouse base check (Performance / Accessibility) — без фанатизма, но без позорных красных метрик

### 🤖 Финальная проверка

```
📍 PIPELINE: Фаза 3 — Финальная проверка

🤖 pragmatic-architect:
- Архитектура: ✅
- Нет over-engineering: ✅

🤖 query-guardian:
- TanStack Query везде, где сервер: ✅
- Формы RHF+Zod: ✅
- Schema sync с бэком: ✅

🤖 ui-guardian:
- Shadcn-первый: ✅
- Theme tokens: ✅
- A11y minimum: ✅

🤖 clean-code-guardian:
- Структура: ✅
- Naming: ✅

Фича готова к PR.
```

### PR

```markdown
## Summary
- [Кратко о фиче]

## Changes
- Новая фича: features/<name>
- Новые страницы: <список>
- Добавлены Shadcn-компоненты: <список>

## Testing
- [ ] Golden path в браузере
- [ ] Loading/Error/Empty состояния
- [ ] Адаптив (mobile/desktop)
- [ ] A11y minimum (tab, aria-label, focus-ring)
- [ ] typecheck/lint/build пройдены
- [ ] `wrangler pages deploy --dry-run` без ошибок
- [ ] `VITE_API_URL` для prod указывает на prod-Worker
- [ ] 🤖 Все агенты: ✅

## Screenshots
[скриншоты ключевых экранов]
```

---

## Справочник агентов

| Агент | Задача | Когда вызывается |
|-------|--------|------------------|
| 🤖 `pragmatic-architect` | Анти-over-engineering | Фаза 1, шаг 2.1, финал |
| 🤖 `query-guardian` | TanStack Query / RHF / Zod | Шаг 2.3 (если затронуты данные/формы) |
| 🤖 `ui-guardian` | Shadcn / Tailwind / a11y | Шаг 2.3 (если затронут UI) |
| 🤖 `clean-code-guardian` | Структура и naming | Шаг 2.3 (файлы > 50 строк) |

Документация агентов: `.claude/agents/`

---

## Чек-лист для нейросети

Перед каждым действием:
- [ ] Прочитан `CLAUDE.md`?
- [ ] Изучены ли существующие фичи в `src/features/`?
- [ ] Проверено ли, что нужный компонент есть в Shadcn?
- [ ] Использован ли существующий `useQuery`/`useMutation` хук, если данные те же?
- [ ] Schema синхронна с бэкендом?
- [ ] `npm run typecheck` проходит?
- [ ] Вызваны агенты после реализации?
- [ ] Проверены состояния Loading/Error/Empty в браузере?

## Чек-лист для разработчика

Перед этапом:
- [ ] Цель и UX-сценарий понятны?
- [ ] План согласован?
- [ ] Definition of Done зафиксирован (включая loading/error/empty)?

После этапа:
- [ ] Ручное тестирование пройдено в браузере?
- [ ] Замечания агентов исправлены?
- [ ] Коммит сделан с осмысленным сообщением?

---

## Антипаттерны

1. **`useEffect` + `fetch` для серверных данных** — это `useQuery`
2. **`useState` для серверных данных** — это TanStack Query cache
3. **Хардкод queryKey-строк** — используй фабрику ключей
4. **Хандроллед модалки** — есть `Dialog`/`AlertDialog` в Shadcn
5. **Хардкод цветов `#0f172a`** — используй theme tokens (`bg-background`, ...)
6. **Редактирование `components/ui/*`** — это Shadcn-скаффолды, оборачивай или вари свои
7. **`as Note[]` каст fetch-ответа** — парси Zod-ом
8. **Бизнес-логика в `pages/`** — выноси в `features/`
9. **Игнорирование агентов** — замечания обязательны к разбору
10. **Пропуск ручного тестирования UI** — typecheck не ловит UX-баги
11. **Градиенты/glow/sparkle-эффекты/постоянные анимации** — запрещены, см. «Дизайн-принципы» в `CLAUDE.md`
12. **Кастомные иконки для AI-функций** — везде только `Sparkles` из `lucide-react`
13. **Готовые UI-пакеты поверх Tiptap** (`novel`, `*-with-ui`) — мы headless, slash-меню на Shadcn `Command`
14. **Прямой `fetch` на адрес internal-воркера** — фронт ходит ТОЛЬКО на `api-gateway` через `lib/http.ts`
