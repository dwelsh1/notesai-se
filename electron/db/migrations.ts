import Database from 'better-sqlite3'

export type Migration = {
  id: number
  name: string
  run: (db: Database.Database) => void
}

export const migrations: Migration[] = [
  {
    id: 1,
    name: 'init',
    run: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS pages (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          parentId TEXT,
          "order" INTEGER NOT NULL,
          contentMarkdown TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          trashed INTEGER NOT NULL DEFAULT 0,
          favorited INTEGER NOT NULL DEFAULT 0,
          favoriteOrder INTEGER,
          tags TEXT
        );

        CREATE TABLE IF NOT EXISTS tabs (
          id TEXT PRIMARY KEY,
          pageId TEXT NOT NULL,
          pinned INTEGER NOT NULL DEFAULT 0,
          lastActiveAt TEXT NOT NULL,
          "order" INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `)
    },
  },
  {
    id: 2,
    name: 'add_favorite_order',
    run: (db) => {
      // Add favoriteOrder column if it doesn't exist (for existing databases)
      try {
        // Check if column exists by trying to select it
        db.prepare('SELECT favoriteOrder FROM pages LIMIT 1').get()
      } catch {
        // Column doesn't exist, add it
        db.exec(`ALTER TABLE pages ADD COLUMN favoriteOrder INTEGER;`)
      }
    },
  },
  {
    id: 3,
    name: 'add_embeddings',
    run: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS embeddings (
          page_id TEXT PRIMARY KEY,
          embedding TEXT NOT NULL,
          text_hash TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_embeddings_page_id ON embeddings(page_id);
      `)
    },
  },
]
