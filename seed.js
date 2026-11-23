// Optional demo data:  npm run seed   (all demo accounts use password: demo123)
const bcrypt = require('bcryptjs');
const { db, uni } = require('./db');
const pw = bcrypt.hashSync('demo123', 10);
const U = n => db.prepare('SELECT id FROM universities WHERE name=?').get(n).id;
const add = (name, email, role, uniName, reg = '') => {
  const o = db.prepare('SELECT id FROM users WHERE email=?').get(email); if (o) return o.id;
  return db.prepare('INSERT INTO users(name,email,password,role,university_id,reg_no) VALUES(?,?,?,?,?,?)').run(name, email, pw, role, U(uniName), reg).lastInsertRowid;
};
const V = 'COMSATS University Islamabad, Vehari Campus', E = 'University of Education, Vehari Campus',
  A = 'University of Agriculture Faisalabad, Burewala Sub-Campus', M = 'Bahauddin Zakariya University, Multan', S = 'COMSATS University Islamabad, Sahiwal Campus';
const s1 = add('Dr. Sana Malik', 'sana@demo.pk', 'supervisor', V), s2 = add('Dr. Imran Ali', 'imran@demo.pk', 'supervisor', E), s3 = add('Dr. Kamran Shah', 'kamran@demo.pk', 'supervisor', M);
const st = [add('Ali Raza', 'ali@demo.pk', 'student', V, 'FA22-BSE-001'), add('Hira Khan', 'hira@demo.pk', 'student', E, 'SP22-BCS-014'),
  add('Salman Shahid', 'salman@demo.pk', 'student', V, 'FA23-BSE-045'), add('Usman Tariq', 'usman@demo.pk', 'student', V, 'FA22-BSE-032'),
  add('Bilal Ahmed', 'bilal@demo.pk', 'student', A, 'AG21-CS-007'), add('Ayesha Siddiqui', 'ayesha@demo.pk', 'student', M, 'BZ22-CS-021'), add('Hamza Iqbal', 'hamza@demo.pk', 'student', S, 'SP22-BSE-050')];
const P = [
 ['Renewable Power Generation Forecasting by Metaheuristic Techniques','Data Science',0,s1,V,'A web-based application that predicts solar power generation using machine learning and metaheuristic optimization.','Solar output changes with weather, which makes grid planning difficult.','A hybrid ABC-LSTM model that tunes LSTM settings using the Artificial Bee Colony algorithm.','Hour-ahead PV forecasting\nTune LSTM with ABC\nCompare with ANN and SVR','Python, FastAPI, PostgreSQL, TensorFlow','Gantt Chart, DFD, ERD','PostgreSQL','Web (Windows, Linux, macOS)','Hybrid LSTM + ABC optimization','Solar Forecasting, LSTM, ABC',1],
 ['Smart Campus Attendance with Face Recognition','AI/ML',1,s2,E,'Automatic classroom attendance using face recognition with a teacher dashboard.','Manual attendance wastes class time and allows proxies.','Camera based recognition with real-time reports.','Detect faces\nMark attendance automatically\nExport reports','Python, OpenCV, Flask, MySQL','Figma, UML','MySQL','Web','CNN face embeddings','Face Recognition, Attendance',1],
 ['Multi-Vendor Fashion E-Commerce Platform','Web Development',2,s1,V,'A Laravel marketplace where vendors sell clothing, perfume and beauty products.','Small vendors cannot afford their own online store.','Vendor panels with orders, payments and reviews.','Vendor dashboards\nSecure checkout\nAdmin control','Laravel, MySQL, Tailwind','Draw.io, Postman','MySQL','Web','Agile with MVC','E-commerce, Laravel',1],
 ['Smart Bus Tracking for University Transport','IoT',3,s1,V,'Live bus location and route tracking for students using GPS.','Students do not know when the bus will arrive.','GPS device plus a web map with arrival alerts.','Live tracking\nRoute management\nFee panel','Flask, SQLite, Leaflet, GPS','Postman','SQLite','Web','Incremental prototyping','GPS, Transport',1],
 ['Secure Multi-Tenant API Gateway','Cybersecurity',4,s3,A,'API gateway with JWT, OAuth and role based access control.','Shared APIs can leak data between tenants.','Tenant isolation with RBAC and rate limiting.','JWT login\nRBAC\nAudit logs','Node.js, Express, MongoDB, React','Jest','MongoDB','Cloud','Threat modelling first','Security, RBAC',1],
 ['Crop Disease Detection using Deep Learning','AI/ML',5,s3,M,'A tool that finds cotton and wheat leaf diseases from a photo.','Farmers cannot spot crop diseases early.','CNN model with treatment advice.','Detect disease\nSuggest treatment\nWork offline','Python, TensorFlow, Flutter','Colab, Figma','SQLite','Android','Transfer learning','Agriculture, CNN',1],
 ['Blockchain Land Record Verification','Blockchain',6,s3,S,'Tamper-proof land record verification using smart contracts.','Paper land records can be forged.','Record hashes stored on blockchain with a public verifier.','Store hashes\nVerify ownership\nAudit trail','Solidity, React, Node.js','Hardhat','IPFS','Web','Smart contract design','Blockchain, Land',1],
 ['Student Expense Tracker App','Mobile App',1,s2,E,'A Flutter app to track and chart student spending.','Students overspend without tracking.','Simple budgeting with charts.','Track expenses\nMonthly charts','Flutter, Firebase','Figma','Firebase','Android, iOS','Prototype then user testing','Budget',0]];
if (!db.prepare('SELECT COUNT(*) c FROM projects').get().c) {
  const ins = db.prepare(`INSERT INTO projects(title,category,student_id,supervisor_id,university_id,abstract,problem,solution,objectives,technologies,tools,dbase,platform,methodology,keywords,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const L = (x, d) => JSON.stringify(x.split(d).map(s => s.trim()).filter(Boolean));
  P.forEach(p => ins.run(p[0], p[1], st[p[2]], p[3], U(p[4]), p[5], p[6], p[7], L(p[8], '\n'), L(p[9], ','), p[10], p[11], p[12], p[13], L(p[14], ','), p[15] ? 'approved' : 'pending'));
  const users = db.prepare("SELECT id FROM users WHERE role='student'").all(), like = db.prepare('INSERT OR IGNORE INTO likes VALUES(?,?)');
  db.prepare("SELECT id FROM projects WHERE status='approved'").all().forEach((p, i) => users.slice(0, (i * 3) % 7 + 1).forEach(u => like.run(u.id, p.id)));
}
console.log('Demo data ready. Logins: sana@demo.pk (supervisor), ali@demo.pk (student) ... password demo123');
