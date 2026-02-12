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
- Editor unit tests cover render, toolbar, slash menu basics, placeholder display, and auto-focus behavior.

## Lint & Format Gate

- Run lint and formatting checks before PRs:
  - `npm run lint`
  - `npm run format`

## Playwright E2E

- Command: `npm run test:e2e`
- Focus on full user flows: create, edit, search, backup, import/export.
- Playwright starts the Vite dev server via `playwright.config.ts`.
- First run requires: `npx playwright install`
- **Electron run**: Electron E2E is a **separate run**. `npm run test:e2e` runs only browser tests in `tests/playwright`. Electron specs live in `tests/playwright-electron` and are run with `npm run test:e2e:electron` (builds Electron main, then launches the app; ensure the renderer is served or built as required).
- Playwright is configured with retries in CI, trace/screenshot/video on failure.

### Smart Reporter

E2E runs also produce an **intelligent HTML report** via [playwright-smart-reporter](https://github.com/qa-gary-parker/playwright-smart-reporter). It provides failure clustering, flakiness detection across runs, performance regression alerts, stability scoring, trend charts, and optional **AI-powered failure analysis** using LM Studio.

- **Report location** (under project root; directory is created automatically before each run):
  - Browser run: `playwright-reports/smart-report.html`
  - Electron run: `playwright-reports/smart-report-electron.html`
  - History (for flakiness/trends): `playwright-reports/test-history-browser.json` and `playwright-reports/test-history-electron.json` (isolated per project; last 10 runs).
- **View the report**: `npm run test:e2e:report` — serves the browser Smart Report locally (trace viewer works without `file://` CORS issues). For Electron report: `npx playwright-smart-reporter-serve playwright-reports/smart-report-electron.html`.
- **History persistence (CI)**  
  To get flakiness and trends, persist the history files between runs. Example (GitHub Actions):
  - Cache key: `test-history-smart-${{ github.ref }}`
  - Restore cache before `npm run test:e2e` / `test:e2e:electron`
  - Save cache after tests (e.g. `playwright-reports/test-history-*.json`) with key including `${{ github.run_id }}` so the latest run is cached.
  See `docs/playwright-smart-report-plan.md` for full options and CI examples.
- **LM Studio (AI failure analysis)**  
  Optional. To get AI fix suggestions for failed tests using your local LM Studio:
  - Set `PLAYWRIGHT_SMART_REPORTER_LM_STUDIO_URL` (default `http://localhost:1234/v1` if the reporter supports it).
  - Set `OPENAI_API_KEY=lm-studio` (or another placeholder; LM Studio often does not validate the key).
  - If the reporter uses the OpenAI client with a configurable base URL, point it at LM Studio; otherwise the report is still generated without AI suggestions when the env is unset or LM Studio is unreachable.
  - Plan and LM Studio wiring details: `docs/playwright-smart-report-plan.md`.

Trace is set to **retain-on-failure** so the Smart Report can show traces and network logs for failed tests.

### Waiting (E2E)

- **Prefer assertion-based waits** over fixed sleeps. Use `expect(locator).toBeVisible({ timeout: 5000 })` (or similar) after actions that change the DOM, so the test proceeds as soon as the condition is met.
- Use `waitForTimeout` only when there is no observable condition (e.g. a short delay for an animation that has no accessible state). Otherwise tests become slower and flakier under load.
- Fixtures provide `waitForSavedAndPageLink(page)` for the common “save then wait for sidebar” flow; use it instead of “wait for Saved” + sleep + URL parse.

### Smoke tests (`baseline.spec.ts`, tag `@smoke`)

Short, fast tests that cover critical flows. Run with: `npx playwright test -g @smoke`

- **App boot** — Shell, sidebar, dashboard title, page list visible.
- **Theme** — Toggle to dark theme and verify it persists after reload.
- **Navigation** — Header nav opens Settings and Dashboard; direct route to `/settings` works.
- **Tabs** — Tab bar visible; add-tab opens tab picker; Esc closes picker.
- **Semantic search** — Sparkles opens Semantic Search modal with heading; Esc closes.
- **Settings** — Main tabs (General, Data, AI) visible; Data Management shows Backup / Import / Export.
- **Page creation** — Create page → entry in sidebar, URL has `/page/`, editor content area visible.
- **Sidebar** — Page search filter input present (Filter pages…).
- **Regression flow** — Create page, open AI panel, run AI (mocked), insert response into editor; tab count.

### Tags (filtering)

Tests use tags for filtering (e.g. `test('... @smoke', ...)`):

| Tag | Scope |
|-----|--------|
| `@smoke` | Baseline and critical path (baseline.spec) |
| `@ai` | AI panel and LM Studio flows (ai.spec) |
| `@chat` | AI Chat panel (right-side chat, ai-chat.spec) |
| `@data` | Import/export, backup, theme persistence (import-export, settings) |
| `@page` | Page tree, hierarchy, sidebar (page-tree, page-hierarchy) |
| `@settings` | Settings UI and AI Settings (settings.spec) |
| `@dashboard` | Tabs and dashboard (tabs-dashboard.spec) |
| `@sem-search` | Semantic search modal (semantic-search.spec) |
| `@electron` | Electron-only specs (playwright-electron) |

Filter by tag:

- `npx playwright test -g @smoke`
- `npx playwright test -g @ai`
- `npx playwright test -g @chat`
- `npx playwright test -g @electron`
- Combine: `npx playwright test -g "@smoke|@ai|@chat"`

### Test environment

- E2E tests run the app in an **isolated environment**: a separate user-data directory and database, not the one your normal Desktop app uses.
- Playwright never loads your real app data. Each run starts from a **clean or minimal state** (empty or seeded for the test).
- The pages you see during a Playwright run are those **created by the test** (e.g. new pages with default title "Untitled" until the test renames them). This keeps tests repeatable and independent.

## POM-ish Guidelines (Playwright)

- Prefer a selector-first "POM-ish" style over full class-based POMs.
- Keep a shared selectors map (by page/feature) and add helpers only for
  repeated, multi-step flows.
- Avoid wrapping simple framework calls (`visit`, `click`, `type`) unless it
  improves clarity or reduces duplication.
- Use stable `data-testid` selectors and keep naming consistent across
  frameworks. Prefer adding new selectors to `tests/selectors/` (by feature) rather than inlining raw strings in specs.

### AI Chat (right panel)

- AI Chat is a **right-side panel** opened by the **MessageCircle** button in the sidebar
  (`data-testid="ai-chat-toggle"`) or **Ctrl+Shift+C** / **Cmd+Shift+C**.
- Panel selectors: `ai-chat-panel`, `ai-chat-header`, `ai-chat-title`, `ai-chat-connection-status`,
  `ai-chat-empty-state`, `ai-chat-messages-area`, `ai-chat-input`, `ai-chat-send`, `ai-chat-new`,
  `ai-chat-export`, `ai-chat-clear`, `ai-chat-close`, `ai-chat-loading`, `ai-chat-message-user`,
  `ai-chat-message-assistant`, `ai-chat-message-error`, `ai-chat-unavailable`.
- Source pages (below assistant messages): `ai-chat-sources`, `ai-chat-sources-toggle`,
  `ai-chat-sources-list`, `ai-chat-source-<pageId>`, `ai-chat-source-file-<name>`.
- Attachments (above input): `ai-chat-attachments`, `ai-chat-remove-page-<id>`, `ai-chat-remove-file-<name>`.
- Page selector modal: `ai-chat-page-selector-backdrop`, `ai-chat-page-selector-modal`, `ai-chat-page-selector-input`, `ai-chat-page-selector-list`, `ai-chat-page-selector-check-<pageId>`, `ai-chat-page-selector-done`, `ai-chat-page-selector-close`.
- Actions: `ai-chat-attach-files`, `ai-chat-add-pages`, `ai-chat-file-input`, `ai-chat-retry`.
- **Keyboard**: Enter sends message, Shift+Enter new line, Ctrl+Shift+C toggles chat panel, Escape closes page selector (and other modals).

### Semantic Search (modal)

- Semantic search is a **modal** opened by the **Sparkles** button
  (`data-testid="semantic-search-toggle"`) or **Ctrl+Shift+K** / **Cmd+Shift+K**.
- Modal selectors: `semantic-search-modal`, `semantic-search-backdrop`,
  `semantic-search-input`, `semantic-search-idle`, `semantic-search-unavailable`,
  `semantic-search-error`, `semantic-search-no-results`,
  `semantic-search-result-<pageId>`.
- Sidebar search input is always text filter (`placeholder="Filter pages..."`);
  do not rely on "Search by meaning..." in the sidebar.

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
  contentArea: '[data-testid="editor-content"]',
  // Title is the first H1 in the editor content
  titleH1: '[data-testid="editor-content"] h1',
  aiInstruction: '[data-testid="ai-instruction"]',
  aiResponse: '[data-testid="ai-response"]',
}

// Toolbar: data-testid="editor-toolbar" (group); toolbar-bold, toolbar-italic, toolbar-underline,
// toolbar-strikethrough, toolbar-link, link-popover, link-url-input, link-apply, link-remove,
// toolbar-table, table-insert, table-delete; editor-ai-toggle, editor-save; save-status.
```

```ts
// Playwright usage (in spec)
import { test } from './fixtures'
import { editorSelectors } from '../selectors/editor'

test('edits page', async ({ page, gotoApp }) => {
  await gotoApp()
  await page.getByTestId('page-create').click()
  await page.getByTestId('page-list').getByRole('link', { name: /untitled/i }).last().click()
  await page.locator(editorSelectors.contentArea).click()
  await page.keyboard.type('Hello world')
})
```

## Coverage

- `npm run test:unit:coverage`
- Keep coverage targets aligned with NotesAI standards.
