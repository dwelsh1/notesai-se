# Changelog — NotesAI SE

All notable changes to NotesAI SE will be documented in this file.

The format follows Keep a Changelog and Semantic Versioning.

## [Unreleased]

- Initial planning docs created.
- Added ESLint + Prettier configuration and scripts.
- Upgraded Vitest to v4 via audit fix.
- Added Playwright baselines with shared selectors.
- Removed Cypress E2E setup (Playwright-only).
- Added Playwright Electron test config and baseline tests.
- Switched Electron build to NodeNext ESM for Playwright Electron support.
- Added internal API documentation stub.
- Added Phase 1 page tree UI, search, favorites, trash, and shortcuts.
- Added Phase 2 tiptap editor, toolbar, slash menu, and tests.
- Suppressed Electron security warning (dev-only) and React Router future warnings.
- Started Phase 3 with tabs state, tabs bar, and dashboard data.
- Started Phase 4 with import/export and backup policy unit tests.
- Added settings UI stubs for import/export and backups.
- Started Phase 5 with LM Studio client and prompt builder tests.
- Added AI settings and editor panel stubs.
- Added Playwright Phase 5 AI panel coverage (mocked).