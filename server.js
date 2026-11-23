const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { db, uni } = require('./db');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || (() => {
  const f = path.join(__dirname, '.secret');
  if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(32).toString('hex'));
  return fs.readFileSync(f, 'utf8');
})();
const CATS = ['AI/ML', 'Web Development', 'Mobile App', 'Data Science', 'IoT', 'Cybersecurity', 'Blockchain', 'Other'];
const UPLOADS = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => { res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'same-origin' }); next(); });
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const fail = (res, code, msg) => res.status(code).json({ error: msg });
const userOut = id => db.prepare(`SELECT u.id,u.name,u.email,u.role,u.reg_no,n.name university FROM users u LEFT JOIN universities n ON n.id=u.university_id WHERE u.id=?`).get(id);

// ---------- session (JWT in an httpOnly cookie) ----------
app.use((req, res, next) => {
  req.user = null;
  try { const t = jwt.verify(req.cookies.token, SECRET); req.user = userOut(t.id) || null; } catch (e) {}
  next();
});
const setLogin = (res, id) => res.cookie('token', jwt.sign({ id }, SECRET, { expiresIn: '7d' }),
  { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 864e5 });
const need = (...roles) => (req, res, next) =>
  !req.user ? fail(res, 401, 'Please login first') :
  roles.length && !roles.includes(req.user.role) ? fail(res, 403, 'You are not allowed to do this') : next();

const tries = new Map();   // simple brute-force protection
const tooMany = k => { const n = (tries.get(k) || []).filter(t => Date.now() - t < 6e5); tries.set(k, n); return n.length >= 8; };

// ---------- register / login ----------
app.post('/api/register', (req, res) => {
  const { name, email, password, role, university, city, reg_no } = req.body || {};
  if (!name?.trim() || !email || !password || !university?.trim()) return fail(res, 400, 'Name, email, password and university are required');
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail(res, 400, 'Enter a valid email');
  if (password.length < 6) return fail(res, 400, 'Password must be at least 6 characters');
  if (!['student', 'supervisor'].includes(role)) return fail(res, 400, 'Choose student or supervisor');
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email.trim())) return fail(res, 409, 'This email is already registered');
  const id = db.prepare('INSERT INTO users(name,email,password,role,university_id,reg_no) VALUES(?,?,?,?,?,?)')
    .run(name.trim(), email.trim(), bcrypt.hashSync(password, 10), role, uni(university, city || ''), (reg_no || '').trim()).lastInsertRowid;
  setLogin(res, id); res.json(userOut(id));
});
app.post('/api/login', (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const key = req.ip + email.toLowerCase();
  if (tooMany(key)) return fail(res, 429, 'Too many attempts. Try again in 10 minutes');
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(email.trim());
  if (!u || !bcrypt.compareSync(password, u.password)) { tries.get(key).push(Date.now()); return fail(res, 401, 'Wrong email or password'); }
  setLogin(res, u.id); res.json(userOut(u.id));
});
app.post('/api/logout', (req, res) => { res.clearCookie('token'); res.json({ ok: true }); });
app.get('/api/me', (req, res) => res.json(req.user));

// ---------- helpers ----------
const SEL = `SELECT p.*, n.name university, n.city city, s.name student, s.reg_no reg_no, v.name supervisor,
  (SELECT COUNT(*) FROM likes l WHERE l.project_id=p.id) likes
  FROM projects p JOIN users s ON s.id=p.student_id LEFT JOIN users v ON v.id=p.supervisor_id LEFT JOIN universities n ON n.id=p.university_id`;
const shape = (p, me) => {
  if (!p) return p;
  ['objectives', 'technologies', 'keywords'].forEach(k => p[k] = JSON.parse(p[k] || '[]'));
  p.hasPdf = !!p.pdf; delete p.pdf;
  p.liked = me ? !!db.prepare('SELECT 1 FROM likes WHERE user_id=? AND project_id=?').get(me.id, p.id) : false;
  return p;
};
const canSee = (p, u) => p.status === 'approved' || (u && (u.role === 'admin' || u.id === p.student_id || u.id === p.supervisor_id));
const list = (s, max = 200) => JSON.stringify(String(s || '').split(/[\n,]/).map(x => x.trim()).filter(Boolean).slice(0, max));

// ---------- public data ----------
app.get('/api/categories', (req, res) => res.json(CATS));
app.get('/api/universities', (req, res) => res.json(db.prepare(
  `SELECT n.name, n.city, (SELECT COUNT(*) FROM projects p WHERE p.university_id=n.id AND p.status='approved') projects
   FROM universities n ORDER BY projects DESC, n.name`).all()));
app.get('/api/stats', (req, res) => res.json({
  universities: db.prepare('SELECT COUNT(*) c FROM universities').get().c,
  projects: db.prepare("SELECT COUNT(*) c FROM projects WHERE status='approved'").get().c,
  students: db.prepare("SELECT COUNT(*) c FROM users WHERE role='student'").get().c,
  supervisors: db.prepare("SELECT COUNT(*) c FROM users WHERE role='supervisor'").get().c }));
app.get('/api/supervisors', need(), (req, res) => res.json(db.prepare(
  `SELECT u.id, u.name, n.name university FROM users u LEFT JOIN universities n ON n.id=u.university_id WHERE u.role='supervisor' ORDER BY u.name`).all()));

app.get('/api/projects/top', (req, res) =>
  res.json(db.prepare(`${SEL} WHERE p.status='approved' ORDER BY likes DESC, p.created_at DESC LIMIT 3`).all().map(p => shape(p, req.user))));

app.get('/api/projects', (req, res) => {
  const { q = '', category = '', university = '' } = req.query;
  const w = ["p.status='approved'"], a = [];
  if (category && category !== 'All') { w.push('p.category=?'); a.push(category); }
  if (university) { w.push('n.name=?'); a.push(university); }
  if (q.trim()) {
    w.push('(p.title LIKE ? OR p.abstract LIKE ? OR p.technologies LIKE ? OR p.keywords LIKE ? OR s.name LIKE ? OR n.name LIKE ?)');
    for (let i = 0; i < 6; i++) a.push(`%${q.trim()}%`);
  }
  const rows = db.prepare(`${SEL} WHERE ${w.join(' AND ')} ORDER BY p.created_at DESC LIMIT 200`).all(a);
  res.json(rows.map(p => shape(p, req.user)));
});

app.get('/api/projects/:id', (req, res) => {
  const p = db.prepare(`${SEL} WHERE p.id=?`).get(req.params.id);
  if (!p || !canSee(p, req.user)) return fail(res, 404, 'Project not found');
  res.json(shape(p, req.user));
});
app.get('/api/projects/:id/pdf', (req, res) => {
  const p = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!p || !p.pdf || !canSee(p, req.user)) return fail(res, 404, 'No document');
  res.type('application/pdf').set('Content-Disposition', 'inline').sendFile(path.join(UPLOADS, path.basename(p.pdf)));
});

// ---------- student: submit / my projects / delete ----------
const upload = multer({
  storage: multer.diskStorage({ destination: UPLOADS, filename: (r, f, cb) => cb(null, crypto.randomBytes(12).toString('hex') + '.pdf') }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (r, f, cb) => f.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Only PDF files are allowed'))
});
app.post('/api/projects', need('student'), (req, res) => {
  upload.single('pdf')(req, res, err => {
    if (err) return fail(res, 400, err.message);
    const b = req.body, drop = () => req.file && fs.unlink(req.file.path, () => {});
    if (!b.title?.trim() || !b.abstract?.trim()) { drop(); return fail(res, 400, 'Title and abstract are required'); }
    if (!CATS.includes(b.category)) { drop(); return fail(res, 400, 'Choose a category'); }
    const sup = db.prepare("SELECT id FROM users WHERE id=? AND role='supervisor'").get(b.supervisor_id);
    if (!sup) { drop(); return fail(res, 400, 'Choose your supervisor'); }
    const uid = db.prepare('SELECT university_id FROM users WHERE id=?').get(req.user.id).university_id;
    const id = db.prepare(`INSERT INTO projects(title,category,student_id,supervisor_id,university_id,abstract,problem,solution,objectives,technologies,tools,dbase,platform,methodology,keywords,link,pdf)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      b.title.trim(), b.category, req.user.id, sup.id, uid, b.abstract.trim(), b.problem || '', b.solution || '',
      list(b.objectives), list(b.technologies), b.tools || '', b.dbase || '', b.platform || '', b.methodology || '',
      list(b.keywords), (b.link || '').trim(), req.file ? req.file.filename : '').lastInsertRowid;
    res.json(shape(db.prepare(`${SEL} WHERE p.id=?`).get(id), req.user));
  });
});
app.get('/api/my/projects', need('student'), (req, res) =>
  res.json(db.prepare(`${SEL} WHERE p.student_id=? ORDER BY p.created_at DESC`).all(req.user.id).map(p => shape(p, req.user))));
app.delete('/api/projects/:id', need(), (req, res) => {
  const p = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!p) return fail(res, 404, 'Project not found');
  if (req.user.role !== 'admin' && p.student_id !== req.user.id) return fail(res, 403, 'You are not allowed to do this');
  if (p.pdf) fs.unlink(path.join(UPLOADS, path.basename(p.pdf)), () => {});
  db.prepare('DELETE FROM projects WHERE id=?').run(p.id); res.json({ ok: true });
});

// ---------- supervisor / admin: review ----------
app.get('/api/review', need('supervisor', 'admin'), (req, res) => {
  const rows = req.user.role === 'admin'
    ? db.prepare(`${SEL} ORDER BY p.created_at DESC`).all()
    : db.prepare(`${SEL} WHERE p.supervisor_id=? ORDER BY p.created_at DESC`).all(req.user.id);
  res.json(rows.map(p => shape(p, req.user)));
});
app.post('/api/projects/:id/review', need('supervisor', 'admin'), (req, res) => {
  const { status, reason = '' } = req.body || {};
  const p = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!p) return fail(res, 404, 'Project not found');
  if (req.user.role !== 'admin' && p.supervisor_id !== req.user.id) return fail(res, 403, 'This project is not assigned to you');
  if (!['approved', 'rejected'].includes(status)) return fail(res, 400, 'Invalid status');
  if (status === 'rejected' && !reason.trim()) return fail(res, 400, 'Please write a reason for rejection');
  db.prepare('UPDATE projects SET status=?, reject_reason=? WHERE id=?').run(status, status === 'rejected' ? reason.trim() : '', p.id);
  res.json({ ok: true });
});
app.get('/api/admin/users', need('admin'), (req, res) => res.json(db.prepare(
  `SELECT u.id,u.name,u.email,u.role,n.name university,u.created_at FROM users u LEFT JOIN universities n ON n.id=u.university_id ORDER BY u.id DESC`).all()));

// ---------- likes ----------
app.post('/api/projects/:id/like', need(), (req, res) => {
  const p = db.prepare("SELECT id FROM projects WHERE id=? AND status='approved'").get(req.params.id);
  if (!p) return fail(res, 404, 'Project not found');
  const had = db.prepare('DELETE FROM likes WHERE user_id=? AND project_id=?').run(req.user.id, p.id).changes;
  if (!had) db.prepare('INSERT INTO likes(user_id,project_id) VALUES(?,?)').run(req.user.id, p.id);
  res.json({ liked: !had, likes: db.prepare('SELECT COUNT(*) c FROM likes WHERE project_id=?').get(p.id).c });
});

app.use('/api', (req, res) => fail(res, 404, 'Not found'));
app.use((err, req, res, next) => { console.error(err); fail(res, 500, 'Server error'); });
app.listen(PORT, () => console.log(`VSpark Project Exhibition running -> http://localhost:${PORT}`));
