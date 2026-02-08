import Database from 'better-sqlite3'
import path from 'node:path'
import { app } from 'electron'
import { migrations } from './migrations.js'

let db: Database.Database | null = null

export function getDb() {
  if (db) return db
  const dbPath = path.join(app.getPath('userData'), 'notesai-se.sqlite')
  db = new Database(dbPath)
  runMigrations(db)
  return db
}

function runMigrations(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      ranAt TEXT NOT NULL
    );
  `)

  const rows = database.prepare('SELECT id FROM migrations').all() as { id: number }[]
  const applied = new Set(rows.map((r) => r.id))
  const insert = database.prepare('INSERT INTO migrations (id, name, ranAt) VALUES (?, ?, ?)')

  for (const migration of migrations) {
    if (!applied.has(migration.id)) {
      migration.run(database)
      insert.run(migration.id, migration.name, new Date().toISOString())
    }
  }
}
