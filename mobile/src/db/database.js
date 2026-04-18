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

    CREATE TABLE IF NOT EXISTS mini_adventures (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      summary TEXT,
      duration TEXT,
      distance TEXT,
      location TEXT,
      tag TEXT,
      mode_type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS adventure_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adventure_id TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'in_progress',
      started_at INTEGER NOT NULL,
      spins_count INTEGER DEFAULT 0
    );
  `);

  seedMiniAdventures();
}

function seedMiniAdventures() {
  if (!db) return;
  const existing = db.getFirstSync('SELECT id FROM mini_adventures WHERE id = ?', ['penny-hike']);
  if (existing) return;

  db.runSync(
    `INSERT INTO mini_adventures (id, title, description, summary, duration, distance, location, tag, mode_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'penny-hike',
      'The Penny Hike',
      'Flip a coin at every crossroad. Heads right, tails left. 30 minutes of pure chaos.',
      'No map. No plan. Every time you hit a crossroad, flip the coin — heads means right, tails means left. Walk for 30 minutes and see where you end up.',
      '30 min',
      '???',
      'Wherever chaos takes you',
      'Social Chaos',
      'social_chaos',
    ]
  );
}

export function getMiniAdventuresByMode(modeType) {
  if (!db) return [];
  return db.getAllSync('SELECT * FROM mini_adventures WHERE mode_type = ?', [modeType]);
}

export function getAdventureProgress(adventureId) {
  if (!db) return null;
  return db.getFirstSync('SELECT * FROM adventure_progress WHERE adventure_id = ?', [adventureId]);
}

export function startAdventure(adventureId) {
  if (!db) return;
  db.runSync(
    `INSERT OR REPLACE INTO adventure_progress (adventure_id, status, started_at, spins_count)
     VALUES (?, 'in_progress', ?, 0)`,
    [adventureId, Date.now()]
  );
}

export function incrementSpins(adventureId) {
  if (!db) return;
  db.runSync(
    'UPDATE adventure_progress SET spins_count = spins_count + 1 WHERE adventure_id = ?',
    [adventureId]
  );
}

export function completeAdventure(adventureId) {
  if (!db) return;
  db.runSync(
    "UPDATE adventure_progress SET status = 'completed' WHERE adventure_id = ?",
    [adventureId]
  );
}

export function expireAdventure(adventureId) {
  if (!db) return;
  db.runSync(
    "UPDATE adventure_progress SET status = 'expired' WHERE adventure_id = ?",
    [adventureId]
  );
}

export function resetAdventure(adventureId) {
  if (!db) return;
  db.runSync('DELETE FROM adventure_progress WHERE adventure_id = ?', [adventureId]);
}

export default db;
