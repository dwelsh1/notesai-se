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
]
