# Developer Guide — NotesAI SE

## Prerequisites

- Node.js (LTS)
- npm
- LM Studio (local server for AI)
- Windows 10/11 recommended for Electron build

## Setup

1. Install dependencies:
   - `npm install`
2. Start LM Studio server:
   - Use LM Studio UI to run a local model and enable HTTP server.
3. Run the app:
   - `npm run dev:electron`
4. Install Playwright browsers (first time only):
   - `npx playwright install`

## Linting & Formatting

- Lint: `npm run lint`
- Auto-fix lint: `npm run lint:fix`
- Format check: `npm run format`
- Format write: `npm run format:write`

## Local Storage

- NotesAI SE uses SQLite (local file).
- Schema and migrations are managed in the Electron main process.

## AI Integration

- Uses LM Studio HTTP endpoints.
- Configure endpoint and model in Settings.

## Testing

- Unit tests: `npm run test:unit`
- E2E tests (Playwright): `npm run test:e2e`
- E2E tests (Playwright Electron): `npm run test:e2e:electron`

## Contributing

- Follow the phase plan in `docs/notesAI_se-plan.md`.
- Write unit tests before implementation in each phase.
- Add Playwright E2E coverage after unit tests pass.
