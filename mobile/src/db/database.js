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
      adventure_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress',
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      spins_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS nature_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uri TEXT NOT NULL,
      is_plant INTEGER NOT NULL DEFAULT 0,
      plant_name TEXT,
      uploaded_at INTEGER NOT NULL
    );
  `);

  // Migration: add completed_at column if missing
  try {
    db.execSync('ALTER TABLE adventure_progress ADD COLUMN completed_at INTEGER');
  } catch (_) {}

  // Migration: remove UNIQUE constraint from adventure_id (allows multiple completions)
  try {
    const tableInfo = db.getFirstSync(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='adventure_progress'"
    );
    if (tableInfo?.sql?.toUpperCase().includes('UNIQUE')) {
      const hasCompletedAt = tableInfo.sql.toLowerCase().includes('completed_at');
      db.execSync('DROP TABLE IF EXISTS adventure_progress_new');
      db.execSync(`CREATE TABLE adventure_progress_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adventure_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'in_progress',
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        spins_count INTEGER DEFAULT 0
      )`);
      if (hasCompletedAt) {
        db.execSync(
          'INSERT INTO adventure_progress_new (id, adventure_id, status, started_at, completed_at, spins_count) ' +
          'SELECT id, adventure_id, status, started_at, completed_at, spins_count FROM adventure_progress'
        );
      } else {
        db.execSync(
          'INSERT INTO adventure_progress_new (id, adventure_id, status, started_at, spins_count) ' +
          'SELECT id, adventure_id, status, started_at, spins_count FROM adventure_progress'
        );
      }
      db.execSync('DROP TABLE adventure_progress');
      db.execSync('ALTER TABLE adventure_progress_new RENAME TO adventure_progress');
    }
  } catch (e) {
    console.error('[DB migration] failed:', e);
  }

  seedMiniAdventures();
  seedMiniAdventureEntry();
  pruneRemovedAdventures();
}

function seedMiniAdventures() {
  if (!db) return;

  const pennyExists = db.getFirstSync('SELECT id FROM mini_adventures WHERE id = ?', ['penny-hike']);
  if (!pennyExists) {
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
        'Chaos',
        'social_chaos',
      ]
    );
  }

  const natureExists = db.getFirstSync('SELECT id FROM mini_adventures WHERE id = ?', ['find-the-nature']);
  if (!natureExists) {
    db.runSync(
      `INSERT INTO mini_adventures (id, title, description, summary, duration, distance, location, tag, mode_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'find-the-nature',
        'Find the Nature',
        'Go around your local area and take 5 pictures of different plants.',
        'Step outside and look closer. Explore your local area and photograph 5 different plants you find — flowers, trees, shrubs, moss, anything that grows.',
        '45 min',
        '1–2 km',
        'Your local area',
        'Survivalist',
        'survivalist',
      ]
    );
  }

}

function pruneRemovedAdventures() {
  if (!db) return;
  const keep = ['penny-hike', 'find-the-nature', 'mini-adventure'];
  const placeholders = keep.map(() => '?').join(', ');
  db.runSync(`DELETE FROM mini_adventures WHERE id NOT IN (${placeholders})`, keep);
}

function seedMiniAdventureEntry() {
  if (!db) return;
  const exists = db.getFirstSync('SELECT id FROM mini_adventures WHERE id = ?', ['mini-adventure']);
  if (!exists) {
    db.runSync(
      `INSERT INTO mini_adventures (id, title, description, summary, duration, distance, location, tag, mode_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'mini-adventure',
        'Leave a Message',
        'Walk to a nearby random location and leave a handwritten message on paper.',
        'A random outdoor spot within 2km has been chosen for you. Walk there and leave a handwritten message at the location.',
        '2 hours',
        'Up to 2 km',
        'Nearby',
        'Urban',
        'urban_explore',
      ]
    );
  }
}

export function getAllMiniAdventures() {
  if (!db) return [];
  return db.getAllSync('SELECT * FROM mini_adventures');
}

export function getMiniAdventuresByMode(modeType) {
  if (!db) return [];
  return db.getAllSync('SELECT * FROM mini_adventures WHERE mode_type = ?', [modeType]);
}

export function getAvailableAdventuresByMode(modeType) {
  if (!db) return [];
  return db.getAllSync(`
    SELECT ma.*
    FROM mini_adventures ma
    WHERE ma.mode_type = ?
      AND NOT EXISTS (
        SELECT 1 FROM adventure_progress ap
        WHERE ap.adventure_id = ma.id AND ap.status = 'in_progress'
      )
  `, [modeType]);
}

export function getCompletedAdventures() {
  if (!db) return [];
  try {
    return db.getAllSync(
      'SELECT ma.*, ap.id AS progress_id, ap.started_at, ap.completed_at, ap.spins_count ' +
      'FROM adventure_progress ap ' +
      'JOIN mini_adventures ma ON ma.id = ap.adventure_id ' +
      "WHERE ap.status = 'completed' " +
      'ORDER BY ap.completed_at DESC'
    );
  } catch (e) {
    console.error('[DB] getCompletedAdventures failed:', e);
    return [];
  }
}

export function getAdventureProgress(adventureId) {
  if (!db) return null;
  return db.getFirstSync(
    "SELECT * FROM adventure_progress WHERE adventure_id = ? AND status = 'in_progress' LIMIT 1",
    [adventureId]
  );
}

export function startAdventure(adventureId) {
  if (!db) return;
  db.runSync(
    `INSERT INTO adventure_progress (adventure_id, status, started_at, spins_count)
     VALUES (?, 'in_progress', ?, 0)`,
    [adventureId, Date.now()]
  );
}

export function incrementSpins(adventureId) {
  if (!db) return;
  db.runSync(
    "UPDATE adventure_progress SET spins_count = spins_count + 1 WHERE adventure_id = ? AND status = 'in_progress'",
    [adventureId]
  );
}

export function completeAdventure(adventureId) {
  if (!db) return;
  db.runSync(
    "UPDATE adventure_progress SET status = 'completed', completed_at = ? WHERE adventure_id = ? AND status = 'in_progress'",
    [Date.now(), adventureId]
  );
}

export function expireAdventure(adventureId) {
  if (!db) return;
  db.runSync(
    "UPDATE adventure_progress SET status = 'expired' WHERE adventure_id = ? AND status = 'in_progress'",
    [adventureId]
  );
}

export function resetAdventure(adventureId) {
  if (!db) return;
  db.runSync(
    "DELETE FROM adventure_progress WHERE adventure_id = ? AND status = 'in_progress'",
    [adventureId]
  );
}

export function saveNaturePhoto(uri, isPlant, plantName) {
  if (!db) return;
  db.runSync(
    `INSERT INTO nature_photos (uri, is_plant, plant_name, uploaded_at) VALUES (?, ?, ?, ?)`,
    [uri, isPlant ? 1 : 0, plantName ?? null, Date.now()]
  );
}

export function getNaturePhotos() {
  if (!db) return [];
  return db.getAllSync('SELECT * FROM nature_photos ORDER BY uploaded_at ASC');
}

export function clearNaturePhotos() {
  if (!db) return;
  db.runSync('DELETE FROM nature_photos');
}

export default db;
