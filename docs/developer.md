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
- Configure endpoint and model in Settings (⚙ icon in header).
- Default endpoint: `http://localhost:1234/v1` (must include `/v1` suffix).
- If LM Studio is running on a different machine, set the full URL (e.g., `http://192.168.1.30:1234/v1`).
- Error messages guide users to Settings if connection fails.
- **Semantic search** uses the `/v1/embeddings` endpoint (OpenAI-compatible). Enable AI in Settings → AI Settings → General and select an embedding model; page embeddings are stored in SQLite and search is by cosine similarity. Open the Semantic Search modal via the Sparkles button in the sidebar or **Ctrl+Shift+K** / **Cmd+Shift+K**.

## Testing

- Unit tests: `npm run test:unit`
- E2E tests (Playwright): `npm run test:e2e`
- E2E tests (Playwright Electron): `npm run test:e2e:electron`
- E2E runs use an isolated app environment (separate DB); see **Test environment** in `docs/testing.md`.

## Contributing

- Follow the phase plan in `docs/notesAI_se-plan.md`.
- Write unit tests before implementation in each phase.
- Add Playwright E2E coverage after unit tests pass.
