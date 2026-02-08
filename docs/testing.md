# Testing — NotesAI SE

## Principles

- Unit tests first for each phase.
- Only after unit tests pass, add Playwright E2E tests.
- Tests must be isolated and clean up after themselves.

## Unit Tests

- Command: `npm run test:unit`
- Use Testing Library for UI.
- Mock LM Studio and IPC boundaries.
- Vitest excludes Playwright specs (`tests/playwright/**`) from unit runs.

## Lint & Format Gate

- Run lint and formatting checks before PRs:
  - `npm run lint`
  - `npm run format`

## Playwright E2E

- Command: `npm run test:e2e`
- Focus on full user flows: create, edit, search, backup, import/export.
- Playwright starts the Vite dev server via `playwright.config.ts`.
- First run requires: `npx playwright install`
- Electron mode: `npm run test:e2e:electron` (builds Electron main + launches app).
- Playwright is configured with retries in CI, trace/screenshot/video on failure.
- Tags: use `@smoke` and `@electron` in test titles for filtering.
- Filter by tag:
  - `npx playwright test -g @smoke`
  - `npx playwright test -g @electron`

## POM-ish Guidelines (Playwright)

- Prefer a selector-first "POM-ish" style over full class-based POMs.
- Keep a shared selectors map (by page/feature) and add helpers only for
  repeated, multi-step flows.
- Avoid wrapping simple framework calls (`visit`, `click`, `type`) unless it
  improves clarity or reduces duplication.
- Use stable `data-testid` selectors and keep naming consistent across
  frameworks.

Suggested layout:

- `tests/selectors/`
  - `app.ts` (shared app-level selectors)
  - `dashboard.ts`
  - `editor.ts`
  - `settings.ts`
- `tests/helpers/`
  - `dashboard.ts` (small multi-step helpers)
  - `editor.ts`
  - `settings.ts`

Example (selectors + helper):

```ts
// tests/selectors/editor.ts
export const editorSelectors = {
  titleInput: '[data-testid="editor-title"]',
  contentArea: '[data-testid="editor-content"]',
  saveButton: '[data-testid="editor-save"]',
}
```

```ts
// tests/helpers/editor.ts
import { editorSelectors } from '../selectors/editor'

export async function fillEditor(
  page: { locator: (s: string) => any },
  title: string,
  body: string,
) {
  await page.locator(editorSelectors.titleInput).fill(title)
  await page.locator(editorSelectors.contentArea).fill(body)
}
```

```ts
// Playwright usage (in spec)
import { test } from '@playwright/test'
import { editorSelectors } from '../selectors/editor'

test('edits page', async ({ page }) => {
  await test.step('fill editor', async () => {
    await page.locator(editorSelectors.titleInput).fill('My note')
    await page.locator(editorSelectors.contentArea).fill('Hello world')
  })
})
```

## Coverage

- `npm run test:unit:coverage`
- Keep coverage targets aligned with NotesAI standards.
