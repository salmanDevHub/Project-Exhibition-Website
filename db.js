const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = new Database(path.join(__dirname, 'exhibition.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS universities(
  id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL COLLATE NOCASE, city TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('student','supervisor','admin')),
  university_id INTEGER REFERENCES universities(id), reg_no TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS projects(
  id INTEGER PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supervisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  university_id INTEGER REFERENCES universities(id),
  abstract TEXT NOT NULL, problem TEXT DEFAULT '', solution TEXT DEFAULT '',
  objectives TEXT DEFAULT '[]', technologies TEXT DEFAULT '[]', tools TEXT DEFAULT '',
  dbase TEXT DEFAULT '', platform TEXT DEFAULT '', methodology TEXT DEFAULT '',
  keywords TEXT DEFAULT '[]', link TEXT DEFAULT '', pdf TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  reject_reason TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS likes(
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY(user_id, project_id));
`);

// find a university by name, or create it (students/supervisors type their own)
function uni(name, city = '') {
  name = String(name).trim().replace(/\s+/g, ' ');
  const row = db.prepare('SELECT id, city FROM universities WHERE name = ?').get(name);
  if (row) {
    if (!row.city && city) db.prepare('UPDATE universities SET city = ? WHERE id = ?').run(city.trim(), row.id);
    return row.id;
  }
  return db.prepare('INSERT INTO universities(name, city) VALUES(?, ?)').run(name, String(city).trim()).lastInsertRowid;
}

// first-run: participating universities of Vehari, Burewala and nearby
if (!db.prepare('SELECT COUNT(*) c FROM universities').get().c) {
  [['COMSATS University Islamabad, Vehari Campus', 'Vehari'],
   ['University of Education, Vehari Campus', 'Vehari'],
   ['Bahauddin Zakariya University, Vehari Sub-Campus', 'Vehari'],
   ['University of Agriculture Faisalabad, Burewala Sub-Campus', 'Burewala'],
   ['Barani Institute of Sciences, Burewala Campus', 'Burewala'],
   ['Bahauddin Zakariya University, Multan', 'Multan'],
   ['COMSATS University Islamabad, Sahiwal Campus', 'Sahiwal']].forEach(([n, c]) => uni(n, c));
}

// first-run: one admin account
if (!db.prepare("SELECT 1 FROM users WHERE role='admin'").get()) {
  const email = process.env.ADMIN_EMAIL || 'admin@vspark.pk';
  const pass = process.env.ADMIN_PASSWORD || 'Admin@12345';
  db.prepare("INSERT INTO users(name,email,password,role) VALUES('Admin',?,?, 'admin')").run(email, bcrypt.hashSync(pass, 10));
  console.log(`Admin account created -> ${email} / ${pass}  (please change the password)`);
}

module.exports = { db, uni };
