import initSqlJs, { type Database as SqlJsDatabase, type SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = process.env.DATA_DIR || path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'second-brain.db');

let sqlDb: SqlJsDatabase;
let SQL: SqlJsStatic;

function ensureDataDir() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

function saveDb() {
  const data = sqlDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function cleanParams(params: any[]): any[] {
  return params.map((p) => (p === undefined ? null : p));
}

const db = {
  prepare(sql: string) {
    return {
      run(...params: any[]) {
        sqlDb.run(sql, cleanParams(params));
        const changes = sqlDb.getRowsModified();
        saveDb();
        return { changes };
      },
      get(...params: any[]): any {
        const stmt = sqlDb.prepare(sql);
        stmt.bind(cleanParams(params));
        if (stmt.step()) {
          const columns = stmt.getColumnNames();
          const values = stmt.get();
          stmt.free();
          const row: any = {};
          columns.forEach((col: string, i: number) => { row[col] = values[i]; });
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params: any[]): any[] {
        const results: any[] = [];
        const stmt = sqlDb.prepare(sql);
        stmt.bind(cleanParams(params));
        while (stmt.step()) {
          const columns = stmt.getColumnNames();
          const values = stmt.get();
          const row: any = {};
          columns.forEach((col: string, i: number) => { row[col] = values[i]; });
          results.push(row);
        }
        stmt.free();
        return results;
      }
    };
  },
  exec(sql: string) {
    sqlDb.run(sql);
    saveDb();
  },
  pragma(_p: string) {
    // sql.js handles this differently
  }
};

export async function initializeDatabase() {
  SQL = await initSqlJs();
  ensureDataDir();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(buffer);
  } else {
    sqlDb = new SQL.Database();
  }

  sqlDb.run('PRAGMA foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '📁',
      color TEXT DEFAULT '#6366f1',
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      category_id TEXT NOT NULL,
      date DATE NOT NULL,
      notes TEXT,
      is_recurring INTEGER DEFAULT 0,
      recurrence_pattern TEXT,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      monthly_limit REAL NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(category_id, month, year, user_id)
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      pinned INTEGER DEFAULT 0,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      datetime DATETIME NOT NULL,
      recurring TEXT,
      priority TEXT DEFAULT 'medium',
      completed INTEGER DEFAULT 0,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      user_id TEXT NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      folder_id TEXT,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      frequency TEXT DEFAULT 'daily',
      color TEXT DEFAULT '#22c55e',
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      date DATE NOT NULL,
      completed INTEGER DEFAULT 1,
      user_id TEXT NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(habit_id, date, user_id)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      deadline DATE,
      progress INTEGER DEFAULT 0,
      category TEXT DEFAULT 'personal',
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#8b5cf6',
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(name, user_id)
    );

    CREATE TABLE IF NOT EXISTS taggables (
      tag_id TEXT NOT NULL,
      taggable_id TEXT NOT NULL,
      taggable_type TEXT NOT NULL,
      PRIMARY KEY (tag_id, taggable_id, taggable_type),
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  console.log('Database initialized');
}

export default db;
