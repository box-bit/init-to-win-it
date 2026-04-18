import { Platform } from 'react-native';

let db = null;

export function initDB() {
  if (Platform.OS === 'web') return;

  const SQLite = require('expo-sqlite');
  db = SQLite.openDatabaseSync('app.db');
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      score INTEGER DEFAULT 0
    );
  `);
}

export default db;