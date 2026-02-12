# Playwright Smart Reporter — Adoption Plan

**Status: Implemented** (config, script, docs, changelog). LM Studio AI wiring is optional and documented; use `PLAYWRIGHT_SMART_REPORTER_LM_STUDIO_URL` and `OPENAI_API_KEY` if the reporter supports a configurable OpenAI base URL.

This plan covers adopting [playwright-smart-reporter](https://github.com/qa-gary-parker/playwright-smart-reporter) for NotesAI SE, using **LM Studio** for its AI-powered failure analysis instead of Claude/OpenAI/Gemini, and updating docs and tests without breaking current Playwright functionality.

## Decisions (from Q1–Q10)

| Q | Choice | Applied |
|---|--------|--------|
| Q1 | A — Keep both reports (default HTML + Smart Reporter) | Yes |
| Q2 | B — Output under `playwright-reports/` | Yes |
| Q3 | A — Enable history, document CI caching | Yes |
| Q4 | B — Trace `retain-on-failure` | Yes |
| Q5 | C — Both configs, `projectName` for browser/electron | Yes |
| Q6 | B+C — Dedicated env, optional AI | Documented |
| Q7 | A — OpenAI client with baseURL for LM Studio | Documented |
| Q8 | A — Full features from start | Yes |
| Q9 | A — npm script `test:e2e:report` | Yes |
| Q10 | Update testing.md fully; one-line README; changelog | Yes |

---

## 1. What is Playwright Smart Reporter?

Smart Reporter is an intelligent Playwright HTML reporter that adds:

- **AI failure analysis** — Fix suggestions for failed tests (requires an AI provider).
- **Flakiness detection** — Tracks failures across runs (needs persisted history).
- **Performance regression alerts** — Flags tests that get significantly slower.
- **Stability scoring** — Composite health (0–100, grades A+ to F).
- **Failure clustering** — Groups similar failures with error previews.
- **Interactive dashboard** — Overview, Tests, Trends, Comparison, Gallery; themes; keyboard shortcuts; optional step timeline and trace viewer.

Out of the box it supports **Anthropic**, **OpenAI**, and **Google Gemini** via API keys. This plan adds **LM Studio** (local, OpenAI-compatible API) as the AI provider so no cloud keys are required.

---

## 2. Current NotesAI SE Playwright Setup

- **Browser E2E**: `playwright.config.ts` → `tests/playwright/`, reporter `['list'], ['html', { open: 'never' }]`, trace `on-first-retry`, screenshot/video on failure.
- **Electron E2E**: `playwright.electron.config.ts` → `tests/playwright-electron/`, same reporter and trace/screenshot/video.
- **Scripts**: `npm run test:e2e`, `npm run test:e2e:ui`, `npm run test:e2e:electron`.
- **Tags**: `@smoke`, `@ai`, `@chat`, `@data`, `@page`, `@settings`, `@dashboard`, `@sem-search`, `@electron`.

Adoption must **keep all existing commands and behavior working**; Smart Reporter will be an **additional** reporter (or replace only the `html` reporter by design, without changing test runs).

---

## 3. Clarifying Questions (Options + Recommendations)

Please answer these so the implementation can match your preferences. Each has a short recommendation.

---

### Q1. Reporter output and default report

- **A)** Keep current default: run still produces the built-in Playwright HTML report (e.g. `playwright-report/`) and **also** produce Smart Reporter’s HTML (e.g. `smart-report.html`). Two reports per run.
- **B)** Replace built-in HTML with Smart Reporter only: one HTML report per run (Smart Reporter’s). List reporter unchanged.
- **C)** Smart Reporter only in CI; locally keep current (list + built-in HTML).

**Recommendation:** **A** — Keep both. No change to existing report location or open behavior; add Smart Reporter as extra. Easiest rollback and comparison.

---

### Q2. Where to put Smart Reporter output and history

- **A)** Root: `smart-report.html`, `test-history.json` (and optional `history-runs/` if drilldown enabled) in project root.
- **B)** Under a dir: e.g. `playwright-reports/smart-report.html`, `playwright-reports/test-history.json` (align with common “all Playwright artifacts in one place”).
- **C)** Same as current HTML: if built-in report goes to `playwright-report/`, put Smart there too (e.g. `playwright-report/smart-report.html`).

**Recommendation:** **B** — `playwright-reports/` (or `reports/playwright/`) so CI and `.gitignore` can treat one folder as the canonical Playwright output; keeps root clean.

---

### Q3. History persistence and flakiness/trends

Smart Reporter’s flakiness detection and trends need a **persisted** `historyFile` (e.g. `test-history.json`) between runs.

- **A)** Enable history: persist `test-history.json` (and optional `history-runs/`), document CI caching in `docs/testing.md` (e.g. cache key per branch).
- **B)** Disable history for now: no history file, no flakiness/trends; only use Smart Reporter for the single-run report and AI failure analysis.
- **C)** Enable only in CI: persist history in CI; locally skip or use a local-only path.

**Recommendation:** **A** — Enable and document CI caching. Flakiness and trends are high value; NotesAI SE already has CI; one extra cache step is manageable.

---

### Q4. Trace and network logs

Smart Reporter can show inline trace viewer and network logs from trace files. Current config: `trace: 'on-first-retry'`.

- **A)** Keep `on-first-retry`: traces only on retry; Smart Reporter will have traces only for those runs (and network logs only when trace exists).
- **B)** Use `retain-on-failure`: trace on every failure (better for Smart Reporter) but larger artifacts.
- **C)** Use `on`: trace every test (maximum data, heaviest).

**Recommendation:** **A** for now — no config change. If we want more traces for Smart Reporter later, we can switch to **B** in a follow-up.

---

### Q5. Electron config

- **A)** Add Smart Reporter to **both** browser and Electron configs (same options, separate output/history paths per config so they don’t mix).
- **B)** Add only to browser config; keep Electron as-is.
- **C)** Add to both and use `projectName` (e.g. `'browser'` / `'electron'`) so history is isolated per run type.

**Recommendation:** **C** — Use Smart Reporter for both, with `projectName` and separate `outputFile`/`historyFile` per config (e.g. `smart-report-browser.html` vs `smart-report-electron.html`, and separate history files). Clear and safe.

---

### Q6. LM Studio endpoint and env

- **A)** Reuse app AI config: read base URL (and optional key) from existing env or config (e.g. same as editor AI panel), document in `docs/testing.md`.
- **B)** Dedicated env for reporter only: e.g. `PLAYWRIGHT_SMART_REPORTER_LM_STUDIO_URL` (default `http://localhost:1234/v1`), no dependency on app AI config.
- **C)** Optional: if env not set, Smart Reporter runs without AI analysis (no failure suggestions); no LM Studio required for basic report.

**Recommendation:** **B** + **C** — Dedicated `PLAYWRIGHT_SMART_REPORTER_LM_STUDIO_URL` (default `http://localhost:1234/v1`). If unset or LM Studio unreachable, disable AI analysis and still produce the rest of the report.

---

### Q7. Enabling AI analysis with LM Studio

Smart Reporter expects OpenAI-compatible API (it can use `OPENAI_API_KEY` + optional base URL). LM Studio exposes an OpenAI-compatible endpoint.

- **A)** Use Node OpenAI client with `baseURL: process.env.PLAYWRIGHT_SMART_REPORTER_LM_STUDIO_URL` and a placeholder API key (e.g. `lm-studio`); no code change inside the reporter package if it supports custom baseURL.
- **B)** Add a small local wrapper or patch that forwards “OpenAI” requests to LM Studio (e.g. in a script or a thin reporter wrapper) and keep Smart Reporter unchanged.
- **C)** Propose/fork a change upstream to support “LM Studio” as a provider (longer-term); short-term use **A** or **B**.

**Recommendation:** **A** — Configure the reporter (if it accepts OpenAI client options) to use `baseURL` and a dummy key. If the package doesn’t expose baseURL, use **B** (env-based proxy or wrapper that calls LM Studio and returns the format the reporter expects). Details in “LM Studio integration” below.

---

### Q8. Which Smart Reporter features to enable initially

- **A)** Full: AI analysis, flakiness, performance alerts, stability score, failure clustering, trends, comparison, gallery, trace viewer, history drilldown (if enabled).
- **B)** Conservative: no AI initially; enable history, flakiness, trends, and dashboard only; add AI in a second step after LM Studio wiring works.
- **C)** Minimal: only the new HTML report and trace viewer; disable AI, history, flakiness, trends.

**Recommendation:** **B** — Start with dashboard, history, flakiness, trends; add AI (LM Studio) once the reporter is proven stable in the project. Reduces variables if something breaks.

---

### Q9. npm script for viewing the report

- **A)** Add script, e.g. `"test:e2e:report": "npx playwright-smart-reporter-serve playwright-reports/smart-report.html"` (path depends on Q2).
- **B)** No new script; document the `npx playwright-smart-reporter-serve ...` command in `docs/testing.md` only.
- **C)** Add script that opens the default report path so it works even if path changes.

**Recommendation:** **A** — One npm script so “view last Smart Report” is a single command; document in testing.md.

---

### Q10. Docs and tests scope

- **Docs:** Update `docs/testing.md` (Playwright section) with: how to run tests, where Smart Report and history live, how to enable LM Studio for AI, CI cache for history, and link to this plan. Optionally mention in `README.md` (one line) and add a `docs/changelog.md` entry when done.
- **Tests:** No change to existing E2E test logic or assertions. Optionally add a single smoke check that Playwright runs with the new config (e.g. run once and assert report file exists) in CI — only if you want that.

**Recommendation:** Update `docs/testing.md` fully; add one-line README and changelog; skip new “report exists” test unless you want it for CI.

---

## 4. LM Studio Integration (Technical)

- Smart Reporter uses **Anthropic / OpenAI / Gemini** for failure analysis. For NotesAI SE we use **LM Studio** (local, OpenAI-compatible).
- **Approach:** Use the reporter’s OpenAI path with:
  - **Base URL:** `process.env.PLAYWRIGHT_SMART_REPORTER_LM_STUDIO_URL || 'http://localhost:1234/v1'`
  - **API key:** A placeholder (e.g. `lm-studio` or `not-needed`); LM Studio often does not validate it.
- **If the package does not expose baseURL:** Implement a small wrapper or env-driven adapter that:
  - Reads `PLAYWRIGHT_SMART_REPORTER_LM_STUDIO_URL`.
  - On “analyze failure” calls, sends the same prompt to LM Studio (e.g. `POST .../chat/completions`) and returns the response in the format the reporter expects (if any). This may require reading the reporter’s source to see how it invokes OpenAI and what response shape it uses.
- **Fallback:** If the URL is unset or LM Studio is unreachable, disable AI analysis and still generate the report (stability score, flakiness, trends, etc.).

---

## 5. Doc Updates (Concrete)

- **`docs/testing.md`**
  - In the Playwright E2E section, add a subsection “Smart Reporter”:
    - What it is and where the report lives (path from Q2).
    - How to view: `npm run test:e2e:report` (or the chosen script from Q9).
    - History file and optional `history-runs/`; how to persist in CI (cache key, save/restore steps).
    - LM Studio: set `PLAYWRIGHT_SMART_REPORTER_LM_STUDIO_URL` (and that it’s optional); link to this plan.
  - Keep all existing content (tags, selectors, fixtures, Electron, etc.).
- **`README.md`** (optional): One line under testing, e.g. “E2E reports: built-in HTML and optional Smart Reporter (see `docs/testing.md`).”
- **`docs/changelog.md`**: Add an Unreleased entry when implementation is done (e.g. “Playwright Smart Reporter with optional LM Studio AI analysis; see `docs/playwright-smart-report-plan.md`”).

---

## 6. Test Updates (No Breaking Changes)

- **Existing specs:** No changes to test logic, selectors, or assertions. Same `test:e2e` and `test:e2e:electron` behavior.
- **Config:** Only add (or replace) reporter entries and any new `use` options (e.g. trace) if we change Q4; do not remove or rename existing projects or test dirs.
- **Optional:** A small CI or local check that runs Playwright once and asserts that the Smart Reporter output file exists (and optionally that `test-history.json` is created). Only add if you want this safeguard.

---

## 7. Implementation Order (Safe Phasing)

1. **Phase 1 — Add reporter, no AI, no history**
   - Install `playwright-smart-reporter`.
   - Add reporter to `playwright.config.ts` (and optionally `playwright.electron.config.ts`) with:
     - `outputFile` per Q2, `historyFile` in same dir.
     - `enableAIRecommendations: false`, `maxHistoryRuns: 0` or history disabled so no persistence yet.
   - Run full `test:e2e` and `test:e2e:electron`; confirm existing tests still pass and the default HTML report still works (if we kept it per Q1).
   - Add `test:e2e:report` script and update `docs/testing.md` (report location, how to open).

2. **Phase 2 — Enable history and flakiness**
   - Enable history (`maxHistoryRuns: 10`, persist `historyFile`).
   - Add CI cache steps for `test-history.json` (and `history-runs/` if drilldown enabled) in `docs/testing.md` and, if applicable, in the repo’s CI workflow.
   - Run multiple times locally/CI and confirm trends/flakiness appear in the report.

3. **Phase 3 — LM Studio for AI**
   - Wire LM Studio: either via reporter’s OpenAI baseURL (Q7A) or small wrapper (Q7B).
   - Set `enableAIRecommendations: true` when `PLAYWRIGHT_SMART_REPORTER_LM_STUDIO_URL` is set (or always, with graceful fallback if LM Studio is down).
   - Document env in `docs/testing.md` and in this plan.
   - Test: run a failing test, generate report, confirm AI section appears when LM Studio is running.

4. **Phase 4 — Docs and changelog**
   - Finalize `docs/testing.md`, optional README line, and `docs/changelog.md` entry.
   - Mark this plan as “Implemented” at the top with a short summary and date.

---

## 8. Rollback

- To roll back: remove the `playwright-smart-reporter` reporter entry from both configs and (if added) the `test:e2e:report` script; reinstall is not strictly required. All existing Playwright behavior remains unchanged if we keep the default list + HTML reporter (Q1A).

---

## 9. Next Steps

1. **You:** Answer the clarifying questions (Q1–Q10) — you can reply with e.g. “Q1: A, Q2: B, …” or “Accept recommendations.”
2. **Implementation:** Apply the plan (config, scripts, LM Studio wiring, docs) according to your answers and the phased order above.
3. **You:** Run `npm run test:e2e` and `npm run test:e2e:electron` and confirm everything passes and reports look correct.
4. **You:** Give go-ahead to consider the adoption complete (and optionally add the changelog entry and “Implemented” note in this doc).

---

*Plan created from [playwright-smart-reporter](https://github.com/qa-gary-parker/playwright-smart-reporter) README and NotesAI SE current setup. Pending your answers and go-ahead before implementation.*
