# Segment Brief 003: UI Seed Extraction

## Segment

`ui-seed-extraction`

## Recommended Branch Name

`wave/first-migration-ui-seed`

## Goal

Сделать первый безопасный шаг к `packages/ui`, не ломая текущий runtime и не вынуждая проект к массовой замене импортов по всему приложению.

Смысл сегмента:
- вынести базовые UI primitives в `packages/ui`
- сохранить старые пути как shim-слой
- не тащить в этот сегмент runtime-specific UI

## Source of Truth

Перед началом работы исполнитель обязан прочитать:
- [PLATFORM_MIGRATION_PLAN.md](./PLATFORM_MIGRATION_PLAN.md)
- [FIRST_MIGRATION_PR.md](./FIRST_MIGRATION_PR.md)
- [DELEGATION_AGENT_GUIDE.md](./DELEGATION_AGENT_GUIDE.md)
- [SEGMENT_BRIEF_001_APP_CORE_SEED.md](./SEGMENT_BRIEF_001_APP_CORE_SEED.md)
- [SEGMENT_BRIEF_002_SDK_SEED.md](./SEGMENT_BRIEF_002_SDK_SEED.md)

## In Scope

### 1. Создать первый usable слой в `packages/ui/src`

Нужно перенести только базовые UI primitives:
- `src/lib/shared/ui/avatar.tsx`
- `src/lib/shared/ui/badge.tsx`
- `src/lib/shared/ui/button.tsx`
- `src/lib/shared/ui/dialog.tsx`
- `src/lib/shared/ui/dropdown-menu.tsx`
- `src/lib/shared/ui/form.tsx`
- `src/lib/shared/ui/input.tsx`
- `src/lib/shared/ui/label.tsx`
- `src/lib/shared/ui/popover.tsx`
- `src/lib/shared/ui/scroll-area.tsx`
- `src/lib/shared/ui/select.tsx`
- `src/lib/shared/ui/separator.tsx`
- `src/lib/shared/ui/sheet.tsx`
- `src/lib/shared/ui/spinner.tsx`
- `src/lib/shared/ui/toast.tsx`
- `src/lib/shared/ui/tooltip.tsx`

### 2. Вынести helper `cn`

Нужно перенести:
- `src/lib/shared/utils/utils.ts`

Ожидаемое направление:
- `packages/ui/src/lib/cn.ts`

### 3. Добавить alias для `packages/ui`

Ожидаемое направление:
- `@ui/*` -> `packages/ui/src/*`

### 4. Оставить старые пути как re-export shim

Нужно сохранить совместимость:
- старые файлы в `src/lib/shared/ui/*` должны продолжать существовать как re-export shim
- это не сегмент массовой замены импортов по всему проекту

## Out of Scope

Запрещено включать в сегмент:
- `src/lib/shared/ui/locale-toggle.tsx`
- `src/lib/shared/ui/app-version-badge.tsx`
- `src/lib/shared/ui/toaster.tsx`
- `src/lib/shared/ui/error-component.tsx`
- `src/lib/shared/ui/command.tsx`, если перенос потребует расширения scope
- любые `feature`-компоненты из `src/lib/shared/features/*`
- любые hooks
- любые provider-слои
- любые runtime entrypoints
- массовую замену импортов по приложению

## Why These Constraints Exist

Этот сегмент должен быть безопасным.

Мы не берём:
- `locale-toggle`, потому что он завязан на `next-intl` и locale runtime
- `app-version-badge`, потому что это уже не primitive
- `toaster`, потому что он завязан на `useToast`
- `error-component`, потому что это уже app-level presentational component
- `command`, если он потянет лишнюю связность через `Dialog`

Первый UI-сегмент должен вынести именно базовые primitives, а не весь UI слой сразу.

## Files to Inspect First

- `tsconfig.json`
- `src/lib/shared/utils/utils.ts`
- все файлы из scope

Нужно также проверить внутренние зависимости между ними:
- кто использует `cn`
- кто зависит от `Label`
- кто зависит от `Dialog`

## Expected Target Structure

Ожидаемая структура после выполнения сегмента:

```text
packages/
  ui/
    src/
      lib/
        cn.ts
      components/
        avatar.tsx
        badge.tsx
        button.tsx
        dialog.tsx
        dropdown-menu.tsx
        form.tsx
        input.tsx
        label.tsx
        popover.tsx
        scroll-area.tsx
        select.tsx
        separator.tsx
        sheet.tsx
        spinner.tsx
        toast.tsx
        tooltip.tsx
```

Допустимы небольшие корректировки нейминга, если они последовательны и логичны.

## Constraints

- не ломать текущий runtime
- не менять визуальное поведение компонентов
- не менять public props без необходимости
- не расширять scope
- не запускать массовую замену импортов

## Implementation Notes

### 1. Preferred Migration Style

Нужен именно такой стиль:
- реальный код уезжает в `packages/ui`
- старые `src/lib/shared/ui/*` превращаются в re-export shim

Это важно, потому что:
- позволяет сохранить runtime стабильным
- не требует огромного diff по потребителям
- делает сегмент reviewable

### 2. Local Imports

Если компонент в `packages/ui` зависит от другого компонента в `packages/ui`, нужно уже использовать новый локальный путь или alias `@ui/*`.

### 3. Do Not Force Full Consumer Rewrite

Если сегмент начинает требовать массовую замену импортов по десяткам файлов, исполнитель должен остановиться и оставить это вне текущего scope.

## Expected Deliverable

По завершении сегмента должно быть:
- создано первое рабочее наполнение `packages/ui/src`
- вынесен helper `cn`
- добавлен alias `@ui/*`
- старые UI-файлы сохранены как shim-слой
- пользовательское поведение не изменилось

## Acceptance Criteria

- вынесены только базовые primitives из scope
- старые пути продолжают работать
- `locale-toggle`, `toaster`, `app-version-badge` не тронуты
- typecheck проходит
- lint по затронутым файлам проходит или есть явное объяснение, почему не был запущен

## Validation

Минимум:
- `tsc --noEmit -p tsconfig.json`
- `eslint` по затронутым файлам, если доступен

## Handoff Requirements

Исполнитель обязан в конце вернуть:

### Summary

- что именно вынесено в `packages/ui`
- почему это безопасный первый UI-сегмент

### Changed Files

Плоский список файлов

### What Changed

По каждому важному файлу:
- что изменено
- почему

### Validation

- что проверено
- что не проверено

### Deferred Items

Отдельным списком:
- какие UI-файлы сознательно оставлены вне сегмента
- почему

### Recommended Next Segment

Исполнитель должен предложить следующий логичный сегмент после этого PR.
