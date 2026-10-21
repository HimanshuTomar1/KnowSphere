const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'data', 'db.json');

// Default initial database state
const INITIAL_DATA = {
  users: {},
  sessions: {},
  downloads: {},
  otps: {},
  recoveryAuditHistory: []
};

function ensureDbFile() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    // Seed default demo accounts with hashed passwords
    const seedHashedPassword = bcrypt.hashSync('password123', 10);
    const initial = {
      ...INITIAL_DATA,
      users: {
        'explorer@knowsphere.org': {
          name: 'KnowSphere Explorer',
          email: 'explorer@knowsphere.org',
          passwordHash: seedHashedPassword,
          phone: '+1 555-0199',
          verified: true,
          createdAt: Date.now()
        },
        'explorer@kiwix.org': {
          name: 'KnowSphere Explorer',
          email: 'explorer@kiwix.org',
          passwordHash: seedHashedPassword,
          phone: '+1 555-0199',
          verified: true,
          createdAt: Date.now()
        }
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
  }
}

// In-memory cache synced with disk via atomic write
let memoryDb = null;

function loadDb() {
  ensureDbFile();
  if (!memoryDb) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      memoryDb = JSON.parse(raw);
    } catch {
      memoryDb = { ...INITIAL_DATA };
    }
  }
  return memoryDb;
}

function persistDb() {
  if (!memoryDb) return;
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(memoryDb, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[DB] Failed to persist database:', err.message);
  }
}

// ── User operations ──
function getUser(email) {
  const db = loadDb();
  return db.users[email.toLowerCase()] || null;
}

function createUser(userData) {
  const db = loadDb();
  const normalized = userData.email.toLowerCase();
  db.users[normalized] = {
    ...userData,
    email: normalized,
    createdAt: userData.createdAt || Date.now()
  };
  persistDb();
  return db.users[normalized];
}

function updateUser(email, fields) {
  const db = loadDb();
  const normalized = email.toLowerCase();
  if (!db.users[normalized]) return null;
  db.users[normalized] = {
    ...db.users[normalized],
    ...fields
  };
  persistDb();
  return db.users[normalized];
}

// ── Session operations ──
function getSession(sessionId) {
  const db = loadDb();
  return db.sessions[sessionId] || null;
}

function saveSession(sessionId, sessionData) {
  const db = loadDb();
  db.sessions[sessionId] = {
    ...db.sessions[sessionId],
    ...sessionData,
    updatedAt: Date.now()
  };
  persistDb();
  return db.sessions[sessionId];
}

// ── Download operations ──
function getDownloads() {
  const db = loadDb();
  return db.downloads;
}

function getDownload(downloadId) {
  const db = loadDb();
  return db.downloads[downloadId] || null;
}

function saveDownload(downloadId, downloadData) {
  const db = loadDb();
  db.downloads[downloadId] = {
    ...db.downloads[downloadId],
    ...downloadData,
    updatedAt: Date.now()
  };
  persistDb();
  return db.downloads[downloadId];
}

// ── OTP operations ──
function getOtp(email) {
  const db = loadDb();
  return db.otps[email.toLowerCase()] || null;
}

function saveOtp(email, otpData) {
  const db = loadDb();
  db.otps[email.toLowerCase()] = otpData;
  persistDb();
}

function deleteOtp(email) {
  const db = loadDb();
  delete db.otps[email.toLowerCase()];
  persistDb();
}

// ── Recovery Audit History ──
function getAuditHistory() {
  const db = loadDb();
  return db.recoveryAuditHistory || [];
}

function addAuditEntry(entry) {
  const db = loadDb();
  if (!db.recoveryAuditHistory) db.recoveryAuditHistory = [];
  db.recoveryAuditHistory.unshift(entry);
  if (db.recoveryAuditHistory.length > 100) {
    db.recoveryAuditHistory = db.recoveryAuditHistory.slice(0, 100);
  }
  persistDb();
}

module.exports = {
  loadDb,
  persistDb,
  getUser,
  createUser,
  updateUser,
  getSession,
  saveSession,
  getDownloads,
  getDownload,
  saveDownload,
  getOtp,
  saveOtp,
  deleteOtp,
  getAuditHistory,
  addAuditEntry
};
