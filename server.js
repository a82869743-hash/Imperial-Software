/* Imperial ERP server: auth (email or mobile + password), role-checked data API, public order tracking. */
const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'imperial.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE, phone TEXT UNIQUE,
  role TEXT NOT NULL, pass TEXT NOT NULL, salary REAL DEFAULT 0, intern INTEGER DEFAULT 0,
  joined TEXT, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, version INTEGER NOT NULL, updated_at INTEGER NOT NULL, updated_by TEXT);
`);

/* ---------- Passwords & sessions ---------- */
function hashPass(pw) { const salt = crypto.randomBytes(16).toString('hex'); return salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex'); }
function checkPass(pw, stored) {
  const [salt, h] = stored.split(':');
  const a = Buffer.from(h, 'hex'), b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const normPhone = p => (p || '').replace(/[^\d]/g, '').slice(-10) || null;
const normEmail = e => (e || '').trim().toLowerCase() || null;

// First run: create the Super Admin. Password comes from ADMIN_PASSWORD or is generated and printed once.
if (!db.prepare('SELECT 1 FROM users LIMIT 1').get()) {
  const pw = process.env.ADMIN_PASSWORD || crypto.randomBytes(6).toString('base64url');
  db.prepare('INSERT INTO users (id,name,email,phone,role,pass) VALUES (?,?,?,?,?,?)')
    .run('U1', 'Admin', normEmail(process.env.ADMIN_EMAIL || 'admin@imperial.local'), normPhone(process.env.ADMIN_PHONE), 'Super Admin', hashPass(pw));
  console.log(`\nSuper Admin created: ${process.env.ADMIN_EMAIL || 'admin@imperial.local'}  password: ${pw}\n(change it from Admin → Users after logging in)\n`);
}

const SESSION_DAYS = 30;
function newSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(token, userId, Date.now() + SESSION_DAYS * 864e5);
  return token;
}
function cookies(req) { return Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p[0])); }
function auth(req, res, next) {
  const t = cookies(req).sid;
  const row = t && db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires > ? AND u.active = 1').get(t, Date.now());
  if (!row) return res.status(401).json({ error: 'Not logged in' });
  req.user = row; req.token = t; next();
}

/* ---------- Permissions ---------- */
// Which shared data keys each module may change. Everyone may write the "common" keys.
const MODULE_KEYS = {
  leads: ['leads'], inquiries: ['inquiries', 'leads'], products: ['products'],
  orders: ['orders', 'payments', 'inquiries'], payments: ['payments', 'orders'], invoices: ['invoices', 'workorders', 'payments'],
  workorders: ['workorders', 'orders', 'inventory', 'formulations', 'pos'], inventory: ['inventory', 'pos'],
  procurement: ['vendors', 'pos', 'market', 'inventory'], lab: ['formulations', 'samples', 'inventory'],
  dispatch: ['workorders', 'invoices'], machines: ['machines'], team: ['tasks', 'activity'],
  attendance: ['attendance', 'leaves', 'holidays'], training: ['modules', 'tests', 'results'], market: ['countries'],
  admin: ['divisions', 'roles', 'roleView', 'divModules', 'workflows', 'templates', 'settings'],
  settings: ['workflows', 'templates', 'settings']
};
const COMMON = ['notifs', 'log', 'tasks', 'activity', 'attendance', 'leaves', 'results'];
const KEYS = [...new Set([...Object.values(MODULE_KEYS).flat(), ...COMMON])];
function rolePages(role) {
  if (role === 'Super Admin') return ['*'];
  const r = db.prepare("SELECT value FROM kv WHERE key = 'roles'").get();
  return (r ? JSON.parse(r.value)[role] : null) || [];
}
// Modules the Super Admin has set to "view only" for a role: visible, but their data cannot be changed.
function viewOnly(role) {
  const r = db.prepare("SELECT value FROM kv WHERE key = 'roleView'").get();
  return (r ? JSON.parse(r.value)[role] : null) || [];
}
function canWrite(user, key) {
  const ro = viewOnly(user.role);
  const pages = rolePages(user.role).filter(p => !ro.includes(p));
  if (pages.includes('*') || COMMON.includes(key)) return true;
  return pages.some(p => (MODULE_KEYS[p] || []).includes(key));
}
const seesSalary = u => ['Super Admin', 'HR', 'Accounts'].includes(u.role);
const publicUser = (u, viewer) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, intern: !!u.intern, joined: u.joined, active: !!u.active, ...(seesSalary(viewer) || viewer.id === u.id ? { salary: u.salary } : {}) });
const adminOnly = (req, res, next) => req.user.role === 'Super Admin' ? next() : res.status(403).json({ error: 'Super Admin only' });

/* ---------- App ---------- */
const app = express();
app.use(express.json({ limit: '15mb' }));
app.use((req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); res.set('Referrer-Policy', 'same-origin'); next(); });

const attempts = new Map();
app.post('/api/login', (req, res) => {
  const ip = req.ip, a = attempts.get(ip) || { n: 0, t: Date.now() };
  if (Date.now() - a.t > 15 * 60e3) { a.n = 0; a.t = Date.now(); }
  if (a.n >= 10) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  const id = String(req.body.login || '').trim();
  const u = id.includes('@') ? db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(normEmail(id))
    : db.prepare('SELECT * FROM users WHERE phone = ? AND active = 1').get(normPhone(id));
  if (!u || !checkPass(String(req.body.password || ''), u.pass)) { a.n++; attempts.set(ip, a); return res.status(401).json({ error: 'Wrong email/mobile or password' }); }
  attempts.delete(ip);
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.set('Set-Cookie', `sid=${newSession(u.id)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure ? '; Secure' : ''}`);
  res.json({ ok: true });
});
app.post('/api/logout', auth, (req, res) => { db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token); res.set('Set-Cookie', 'sid=; Path=/; Max-Age=0'); res.json({ ok: true }); });
app.post('/api/password', auth, (req, res) => {
  const { current, next } = req.body;
  if (!checkPass(String(current || ''), req.user.pass)) return res.status(400).json({ error: 'Current password is wrong' });
  if (String(next || '').length < 8) return res.status(400).json({ error: 'Use at least 8 characters' });
  db.prepare('UPDATE users SET pass = ? WHERE id = ?').run(hashPass(next), req.user.id); res.json({ ok: true });
});

// Everything the app needs on load: me, users, all shared data with versions.
app.get('/api/state', auth, (req, res) => {
  const data = {}, versions = {};
  db.prepare('SELECT key, value, version FROM kv').all().forEach(r => { if (KEYS.includes(r.key)) { data[r.key] = JSON.parse(r.value); versions[r.key] = r.version; } });
  res.json({ me: publicUser(req.user, req.user), users: db.prepare('SELECT * FROM users ORDER BY name').all().map(u => publicUser(u, req.user)), data, versions, empty: !Object.keys(data).length });
});
// Light poll: only keys changed since the client's versions.
app.post('/api/changes', auth, (req, res) => {
  const have = req.body.versions || {}, out = {}, versions = {};
  db.prepare('SELECT key, value, version FROM kv').all().forEach(r => { if (KEYS.includes(r.key) && r.version !== have[r.key]) { out[r.key] = JSON.parse(r.value); versions[r.key] = r.version; } });
  res.json({ data: out, versions });
});
// Save one shared key. `base` is the version the client edited; a newer server version returns 409 with the latest.
app.put('/api/data/:key', auth, (req, res) => {
  const key = req.params.key;
  if (!KEYS.includes(key)) return res.status(404).json({ error: 'Unknown data' });
  if (!canWrite(req.user, key)) return res.status(403).json({ error: 'Your role cannot change ' + key });
  const cur = db.prepare('SELECT version, value FROM kv WHERE key = ?').get(key);
  if (cur && req.body.base !== undefined && req.body.base !== cur.version) return res.status(409).json({ value: JSON.parse(cur.value), version: cur.version });
  const version = (cur ? cur.version : 0) + 1;
  db.prepare('INSERT INTO kv (key,value,version,updated_at,updated_by) VALUES (?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, version=excluded.version, updated_at=excluded.updated_at, updated_by=excluded.updated_by')
    .run(key, JSON.stringify(req.body.value), version, Date.now(), req.user.id);
  res.json({ version });
});

/* Document numbers: each client reserves a small block so two people never get the same WO/SO/PO number. */
db.exec('CREATE TABLE IF NOT EXISTS counters (prefix TEXT PRIMARY KEY, n INTEGER NOT NULL)');
const START = { WO: 3100, SO: 2400, INQ: 500, PO: 7000, L: 1000, SMP: 300, INV: 9000 };
// Always continues after the highest number already in the data too, so seeded or imported records never clash.
const reserve = db.transaction((prefix, count) => {
  const row = db.prepare('SELECT n FROM counters WHERE prefix = ?').get(prefix);
  let max = Math.max(row ? row.n : 0, START[prefix] || 0);
  if (prefix in START) {
    const re = new RegExp('"' + prefix + '-(\\d+)"', 'g');
    db.prepare('SELECT value FROM kv').all().forEach(r => { for (const m of r.value.matchAll(re)) max = Math.max(max, +m[1]); });
  }
  db.prepare('INSERT INTO counters VALUES (?,?) ON CONFLICT(prefix) DO UPDATE SET n = excluded.n').run(prefix, max + count);
  return max + 1;
});
app.post('/api/reserve', auth, (req, res) => {
  const prefix = String(req.body.prefix || ''), count = Math.min(50, Math.max(1, +req.body.count || 10));
  // Invoice series run per company and financial year, e.g. INV-CHEM-2627, starting at 1.
  if (!(prefix in START) && !/^INV-[A-Z0-9]{2,6}-\d{4}$/.test(prefix)) return res.status(400).json({ error: 'Unknown number series' });
  res.json({ from: reserve(prefix, count), count });
});

/* Uploaded files (photos, videos, audio, PDFs) are stored on disk, not in the database. */
const UPLOADS = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });
const MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'video/mp4': '.mp4', 'video/webm': '.webm', 'audio/mpeg': '.mp3', 'audio/webm': '.webm', 'audio/ogg': '.ogg', 'audio/mp4': '.m4a', 'application/pdf': '.pdf' };
app.post('/api/upload', auth, express.raw({ type: () => true, limit: '200mb' }), (req, res) => {
  const ext = MIME[(req.headers['content-type'] || '').split(';')[0]];
  if (!ext) return res.status(400).json({ error: 'File type not allowed' });
  if (!req.body || !req.body.length) return res.status(400).json({ error: 'Empty file' });
  const name = crypto.randomBytes(16).toString('hex') + ext;
  fs.writeFileSync(path.join(UPLOADS, name), req.body);
  res.json({ url: '/files/' + name });
});
// Files are only served to signed-in staff, except dispatch photos reached through a tracking link (checked below).
app.get('/files/:name', (req, res, next) => {
  if (!/^[a-f0-9]{32}\.[a-z0-9]+$/.test(req.params.name)) return res.sendStatus(404);
  const t = cookies(req).sid;
  const okUser = t && db.prepare('SELECT 1 FROM sessions WHERE token = ? AND expires > ?').get(t, Date.now());
  const okTrack = !okUser && req.query.t && (() => {
    const r = db.prepare("SELECT value FROM kv WHERE key = 'workorders'").get();
    const w = r && JSON.parse(r.value).find(x => x.trackToken === req.query.t);
    return w && (w.photos || []).some(p => p.src === '/files/' + req.params.name);
  })();
  if (!okUser && !okTrack) return res.sendStatus(401);
  res.sendFile(path.join(UPLOADS, req.params.name), { headers: { 'Cache-Control': 'private, max-age=86400' } }, e => e && res.sendStatus(404));
});

/* Users (Super Admin) */
app.post('/api/users', auth, adminOnly, (req, res) => {
  const b = req.body, email = normEmail(b.email), phone = normPhone(b.phone);
  if (!b.name || !b.role || (!email && !phone)) return res.status(400).json({ error: 'Name, role and email or mobile are required' });
  if (String(b.password || '').length < 8) return res.status(400).json({ error: 'Password needs at least 8 characters' });
  const id = 'U' + crypto.randomBytes(4).toString('hex');
  try { db.prepare('INSERT INTO users (id,name,email,phone,role,pass,salary,intern,joined) VALUES (?,?,?,?,?,?,?,?,?)').run(id, b.name, email, phone, b.role, hashPass(b.password), +b.salary || 0, b.intern ? 1 : 0, b.joined || new Date().toISOString().slice(0, 10)); }
  catch (e) { return res.status(400).json({ error: 'That email or mobile is already used' }); }
  res.json({ id });
});
app.patch('/api/users/:id', auth, adminOnly, (req, res) => {
  const b = req.body, u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ error: 'No such user' });
  if (u.id === req.user.id && (b.role && b.role !== 'Super Admin' || b.active === false)) return res.status(400).json({ error: 'You cannot demote or deactivate yourself' });
  try {
    db.prepare('UPDATE users SET name=?, email=?, phone=?, role=?, salary=?, intern=?, active=? WHERE id=?').run(
      b.name ?? u.name, b.email !== undefined ? normEmail(b.email) : u.email, b.phone !== undefined ? normPhone(b.phone) : u.phone,
      b.role ?? u.role, b.salary ?? u.salary, b.intern !== undefined ? (b.intern ? 1 : 0) : u.intern, b.active !== undefined ? (b.active ? 1 : 0) : u.active, u.id);
  } catch (e) { return res.status(400).json({ error: 'That email or mobile is already used' }); }
  if (b.password) {
    if (String(b.password).length < 8) return res.status(400).json({ error: 'Password needs at least 8 characters' });
    db.prepare('UPDATE users SET pass = ? WHERE id = ?').run(hashPass(b.password), u.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(u.id);
  }
  if (b.active === false) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(u.id);
  res.json({ ok: true });
});

// Demo staff for the "Load demo data" option. Only works while the database has no shared data yet.
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'imperial-demo';
app.post('/api/demo-users', auth, adminOnly, (req, res) => {
  const orders = db.prepare("SELECT value FROM kv WHERE key = 'orders'").get();
  if ((orders && JSON.parse(orders.value).length) || db.prepare('SELECT COUNT(*) n FROM users').get().n > 1) return res.status(400).json({ error: 'Demo data can only be loaded into an empty system' });
  const ins = db.prepare('INSERT OR IGNORE INTO users (id,name,email,role,pass,salary,intern,joined) VALUES (?,?,?,?,?,?,?,?)');
  const hash = hashPass(DEMO_PASSWORD);
  (req.body.users || []).forEach(u => ins.run(u.id, u.name, u.name.split(' ')[0].toLowerCase() + '@imperial.demo', u.role, hash, +u.salary || 0, u.intern ? 1 : 0, u.joined || null));
  res.json({ ok: true, password: DEMO_PASSWORD });
});

/* Public order tracking: only stage info, by unguessable token */
app.get('/api/track/:token', (req, res) => {
  const r = db.prepare("SELECT value FROM kv WHERE key = 'workorders'").get();
  const w = r && JSON.parse(r.value).find(x => x.trackToken && x.trackToken === req.params.token);
  if (!w) return res.status(404).json({ error: 'Link not valid' });
  const stages = w.stageNames || [];
  res.json({ order: w.order, client: w.client, product: w.productName, qty: w.qty + ' ' + w.unit, stage: w.stage, stages,
    expected: w.expected, note: w.customerNote || '', dispatched: w.stage >= stages.length - 1, photos: w.stage >= stages.length - 1 ? (w.photos || []).filter(p => p.src).map(p => p.src.startsWith('/files/') ? p.src + '?t=' + w.trackToken : p.src) : [] });
});

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.get('/track/:token', (req, res) => res.sendFile(path.join(__dirname, 'public', 'track.html')));

// Clean expired sessions daily
setInterval(() => db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now()), 864e5).unref();
app.listen(PORT, () => console.log(`Imperial ERP running on http://localhost:${PORT}`));
