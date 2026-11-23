const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
async function api(url, o = {}) {
  const fd = o.body instanceof FormData, opt = { credentials: 'same-origin', method: o.method };
  if (o.body) { opt.body = fd ? o.body : JSON.stringify(o.body); if (!fd) opt.headers = { 'Content-Type': 'application/json' }; }
  const r = await fetch('/api' + url, opt), d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Something went wrong');
  return d;
}
let U = null, CATS = [], cat = 'All', q = '', uf = '', tab = 'Overview', rtab = 'pending', timer;
const toast = (m, bad) => { const t = document.createElement('div'); t.className = 'modal'; t.style.background = 'transparent'; t.style.pointerEvents = 'none'; t.style.alignItems = 'flex-end'; t.innerHTML = `<div class="${bad ? 'err' : 'ok'}" style="box-shadow:0 4px 20px #0003;margin-bottom:30px">${esc(m)}</div>`; document.body.append(t); setTimeout(() => t.remove(), 2600); };

// ---------- nav ----------
function nav() {
  $('#nav').innerHTML = `<a class="nl" href="#">Home</a><a class="nl" href="#explore">Explore</a>` + (U
    ? `<span class="mu" style="font-size:12px">${esc(U.name)} · ${U.role}</span><a class="nl" href="#${U.role === 'student' ? 'student' : 'review'}">My Panel</a><a class="nl" onclick="logout()">Logout</a>`
    : `<a class="nl" onclick="authBox('login')">Log in</a><button class="bn" onclick="authBox('register')">Register now →</button>`);
}
async function logout() { await api('/logout', { method: 'POST' }); U = null; location.hash = ''; route(); toast('Logged out'); }

// ---------- login / register ----------
function authBox(mode = 'login') {
  document.querySelector('.modal.auth')?.remove();
  const m = document.createElement('div'); m.className = 'modal auth';
  const reg = mode === 'register';
  m.innerHTML = `<div class="box" style="max-width:430px">
  <div class="tabs2" style="margin:0"><button class="chip ${!reg ? 'on' : ''}" data-m="login">Log in</button><button class="chip ${reg ? 'on' : ''}" data-m="register">Register</button></div>
  <div id="ae" class="err" style="display:none"></div>
  ${reg ? `<select id="a_role"><option value="student">I am a student</option><option value="supervisor">I am a supervisor</option></select><input id="a_name" placeholder="Full name">` : ''}
  <input id="a_email" type="email" placeholder="Email"><input id="a_pass" type="password" placeholder="Password (min 6 characters)">
  ${reg ? `<input id="a_uni" placeholder="Your university name (type it)"><input id="a_city" placeholder="City (e.g. Vehari, Burewala)"><input id="a_reg" placeholder="Registration number (students)">` : ''}
  <button class="p" id="a_go">${reg ? 'Create account' : 'Log in'}</button><button onclick="this.closest('.modal').remove()">Cancel</button></div>`;
  document.body.append(m);
  m.querySelectorAll('[data-m]').forEach(b => b.onclick = () => authBox(b.dataset.m));
  const go = async () => {
    const v = id => $(id)?.value.trim();
    try {
      U = await api(reg ? '/register' : '/login', { method: 'POST', body: reg
        ? { role: v('#a_role'), name: v('#a_name'), email: v('#a_email'), password: $('#a_pass').value, university: v('#a_uni'), city: v('#a_city'), reg_no: v('#a_reg') }
        : { email: v('#a_email'), password: $('#a_pass').value } });
      m.remove(); location.hash = U.role === 'student' ? '#student' : '#review'; route(); toast(reg ? 'Account created' : 'Welcome ' + U.name);
    } catch (e) { const x = $('#ae'); x.textContent = e.message; x.style.display = 'block'; }
  };
  $('#a_go').onclick = go; m.querySelectorAll('input').forEach(i => i.onkeydown = e => e.key === 'Enter' && go());
}

// ---------- cards ----------
const card = (p, r) => `<div class="card" onclick="location.hash='#p/${p.id}'">${r ? `<span class="rank">#${r}</span>` : ''}<span class="tag">${esc(p.category)}</span><h3 style="margin:8px 0 4px;font-size:16px">${esc(p.title)}</h3><div class="mu" style="font-size:13px">${esc(p.university)}<br>${esc(p.student)} · ♥ ${p.likes}</div><div style="margin-top:8px">${p.technologies.slice(0, 3).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>`;

// ---------- home ----------
async function home() {
  const [st, top, unis] = await Promise.all([api('/stats'), api('/projects/top'), api('/universities')]);
  const t = top[0];
  $('#app').className = 'fw';
  $('#app').innerHTML = `<section class="hr"><div class="w"><div><span class="pill">VEHARI · BUREWALA · NEARBY UNIVERSITIES</span><h1>PROJECT<br>EXHIBITION<br><span class="gr">SHOWCASE</span></h1><p style="font-weight:700;margin:0 0 6px">Submit. Review. Showcase.</p><p style="color:#cbd5e1;max-width:420px;font-size:13px">Students from different universities publish their projects, supervisors review them, and everyone can explore the best work in one place.</p><div class="row" style="margin-top:16px">${U ? '' : '<button class="bn" onclick="authBox(\'register\')">Register now →</button>'}<button class="bo" onclick="location.hash=\'#explore\'">Explore projects ↓</button></div><div style="margin-top:14px;font-size:11px;color:#94a3b8">✓ Open to all universities &nbsp; ✓ Supervisor approved</div></div>
  ${t ? `<div class="hc" onclick="location.hash='#p/${t.id}'"><div class="hb">★ PROJECT OF THE SEASON</div><div class="hcat">${esc(t.category)}</div><h3>${esc(t.title)}</h3><div class="hm">🎓 ${esc(t.university)}</div><div class="hm">👤 ${esc(t.student)} &nbsp;·&nbsp; Supervisor: ${esc(t.supervisor || '-')}</div><div style="margin:10px 0">${t.technologies.slice(0, 4).map(x => `<span class="ht">${esc(x)}</span>`).join('')}</div><div class="hf"><span>♥ ${t.likes} likes</span><b>View project →</b></div></div>`
  : `<div class="hc" onclick="authBox('register')"><div class="hb">★ BE THE FIRST</div><h3 style="margin-top:12px">No projects yet</h3><div class="hm">Register and submit the first project of the exhibition.</div></div>`}
  <div class="hl"><span>ONE PLATFORM</span><span>MANY UNIVERSITIES</span><span>LIVE SHOWCASE</span></div></div></section>
  <section class="sc"><div class="w"><div class="eb">TOP PROJECTS</div><h2>Most loved this season.</h2><div class="top3">${top.map((p, i) => card(p, i + 1)).join('') || '<p class="mu">Top projects will appear here.</p>'}</div></div></section>
  <div class="stp"><div>${st.universities}<small>Universities</small></div><div>${st.projects}<small>Approved projects</small></div><div>${st.students}<small>Students</small></div><div>${st.supervisors}<small>Supervisors</small></div></div>
  <section class="sc" id="ex"><div class="w"><div class="eb">EXPLORE</div><h2>Find a project worth exploring.</h2><input id="s" placeholder="Search by title, student, university, technology…" value="${esc(q)}"><div class="chips" style="margin:12px 0">${['All', ...CATS].map(c => `<button class="chip ${c === cat ? 'on' : ''}" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div><div id="uf"></div><div class="grid" id="lst"></div></div></section>
  <section class="sc alt"><div class="w"><div class="eb">HOW IT WORKS</div><h2>From idea to showcase.</h2><div class="grid">${[['01', 'Student submits', 'Register with your university and fill the project form.'], ['02', 'Supervisor reviews', 'Your supervisor approves or rejects the project.'], ['03', 'Public showcase', 'Approved projects go live for everyone to explore.']].map(x => `<div class="card" style="cursor:default"><div class="hw">${x[0]}</div><h3 style="margin:6px 0">${x[1]}</h3><div class="mu" style="font-size:13px">${x[2]}</div></div>`).join('')}</div></div></section>
  <section class="sc"><div class="w"><div class="eb">UNIVERSITIES</div><h2>Participating universities.</h2><p class="mu" style="margin:-10px 0 18px">Vehari, Burewala and nearby cities. Click a university to see its projects.</p><div class="grid">${unis.map(u => `<div class="uc" data-u="${esc(u.name)}"><div class="ui">🎓</div><div><b>${esc(u.name)}</b><small>${esc(u.city || 'Other')} · ${u.projects} projects</small></div></div>`).join('')}</div></div></section>
  <section class="cta"><h2>Ready to showcase something<br>worth showing?</h2><p style="margin:0 0 18px;opacity:.85">Register with your university and publish your project today.</p><button onclick="${U ? "location.hash='#student'" : "authBox('register')"}" style="font-weight:700">${U ? 'Go to my panel' : 'Register now'} →</button></section>
  <footer class="ft"><div class="w"><div><img src="/assets/logo.png" height="32" alt="VSpark"></div><div>Explore<br><a href="#explore">Top projects</a></div><div>Participate<br><a onclick="authBox('register')">Create account</a><br><a onclick="authBox('login')">Log in</a></div><div>© 2026 VSpark</div></div></footer>`;
  $('#s').oninput = e => { q = e.target.value; clearTimeout(timer); timer = setTimeout(loadList, 250); };
  document.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { cat = b.dataset.c; document.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); loadList(); });
  document.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { uf = b.dataset.u; loadList(); $('#ex').scrollIntoView({ behavior: 'smooth' }); });
  loadList();
  if (location.hash === '#explore') setTimeout(() => $('#ex').scrollIntoView(), 50);
}
async function loadList() {
  const l = await api(`/projects?q=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}&university=${encodeURIComponent(uf)}`);
  $('#uf').innerHTML = uf ? `<div class="row" style="margin-bottom:12px"><span class="bdg">${esc(uf)}</span><button class="sm" onclick="uf='';loadList()">✕ Clear university filter</button></div>` : '';
  $('#lst').innerHTML = l.map(p => card(p)).join('') || '<p class="mu">No projects found.</p>';
}

// ---------- detail ----------
async function detail(id) {
  let p; try { p = await api('/projects/' + id); } catch (e) { return page(`<p>${esc(e.message)}</p><a href="#">← Home</a>`); }
  const S = (a, b) => `<div class="s2"><h4>${a}</h4>${b}</div>`, B = a => a.map(t => `<span class="bt">${esc(t)}</span>`).join(''), L = a => '<ul>' + a.map(o => `<li>${esc(o)}</li>`).join('') + '</ul>';
  const T = {
    Overview: S('ABSTRACT', esc(p.abstract)) + (p.problem ? S('PROBLEM STATEMENT', esc(p.problem)) : '') + (p.solution ? S('PROPOSED SOLUTION', esc(p.solution)) : '') + (p.objectives.length ? S('OBJECTIVES', L(p.objectives)) : '') + S('TECHNOLOGIES USED', B(p.technologies)) + (p.tools ? S('TOOLS / FRAMEWORKS', esc(p.tools)) : '') + (p.dbase ? S('DATABASE', esc(p.dbase)) : '') + (p.platform ? S('PLATFORM', esc(p.platform)) : '') + (p.methodology ? S('METHODOLOGY', esc(p.methodology)) : '') + (p.keywords.length ? S('KEYWORDS', B(p.keywords)) : ''),
    Requirements: S('OBJECTIVES / REQUIREMENTS', L(p.objectives)) + S('STACK', B(p.technologies)),
    'FYP Opportunity': S('OPEN FOR', 'Extend this work as a final-year project: more data, cloud deployment, or a mobile client.'),
    Ideas: S('FUTURE IDEAS', 'Real-time alerts, an analytics dashboard, and links with other university systems.') };
  page(`<div class="bc"><a href="#">Home</a> / <a href="#explore">Explore</a> / ${esc(p.title)}</div><span class="bdg">${esc(p.category)}</span><span class="bdg">${esc(p.university)}</span><span class="bdg ${p.status}">${p.status}</span>
  <div class="top"><h1 class="ttl">${esc(p.title)}</h1><div class="row">${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener noreferrer"><button>Open Project Link</button></a>` : ''}<button class="p" id="lk">${p.liked ? '♥ Saved' : '♡ Save Project'} (${p.likes})</button></div></div>
  <p class="mu" style="font-size:12px;margin:8px 0 0">By ${esc(p.student)}${p.reg_no ? ' (' + esc(p.reg_no) + ')' : ''} · Supervisor: ${esc(p.supervisor || '-')}</p>
  ${p.status === 'rejected' && p.reject_reason ? `<div class="err" style="margin-top:10px">Rejected: ${esc(p.reject_reason)}</div>` : ''}
  <div class="vw"><div class="pv">${p.hasPdf ? `<div class="tb"><b>📄 Project document</b><span class="sp"></span><a href="/api/projects/${p.id}/pdf" target="_blank">Open ↗</a></div><iframe class="pvf" src="/api/projects/${p.id}/pdf"></iframe>` : '<div class="ld" style="height:400px">No document uploaded for this project</div>'}</div>
  <div class="rp"><div class="sg">${Object.keys(T).map(k => `<button class="${k === tab ? 'on' : ''}" data-t="${k}">${k}</button>`).join('')}</div>${T[tab]}</div></div>`);
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; detail(id); });
  $('#lk').onclick = async () => { if (!U) return authBox('login'); try { await api(`/projects/${id}/like`, { method: 'POST' }); detail(id); } catch (e) { toast(e.message, 1); } };
}
function page(h) { $('#app').className = ''; $('#app').innerHTML = h; scrollTo(0, 0); }

// ---------- student panel ----------
async function student() {
  if (!U || U.role !== 'student') return page(`<p>Please <button class="p" onclick="authBox('login')">log in</button> as a student.</p>`);
  const [mine, sups] = await Promise.all([api('/my/projects'), api('/supervisors')]);
  const f = (id, l, ph = '', full = 0) => `<div class="${full ? 'full' : ''}"><label class="l">${l}</label><input id="${id}" name="${id}" placeholder="${ph}"></div>`;
  const ta = (id, l, ph = '') => `<div class="full"><label class="l">${l}</label><textarea id="${id}" name="${id}" rows="3" placeholder="${ph}"></textarea></div>`;
  page(`<h1>Student Panel</h1><p class="mu">${esc(U.name)} · ${esc(U.university)}</p><h2>Submit a project</h2>
  <form id="pf" class="card fg" style="cursor:default">
  <div id="pe" class="err full" style="display:none"></div>
  ${f('title', 'Project title *', '', 1)}
  <div><label class="l">Category *</label><select name="category">${CATS.map(c => `<option>${esc(c)}</option>`).join('')}</select></div>
  <div><label class="l">Supervisor *</label><select name="supervisor_id">${sups.map(s => `<option value="${s.id}">${esc(s.name)} — ${esc(s.university || '')}</option>`).join('') || '<option value="">No supervisor registered yet</option>'}</select></div>
  ${ta('abstract', 'Abstract *')}${ta('problem', 'Problem statement')}${ta('solution', 'Proposed solution')}${ta('objectives', 'Objectives (one per line)')}
  ${f('technologies', 'Technologies (comma separated)', 'Laravel, MySQL')}${f('tools', 'Tools / frameworks')}${f('dbase', 'Database')}${f('platform', 'Platform')}${f('methodology', 'Methodology', '', 1)}${f('keywords', 'Keywords (comma separated)')}${f('link', 'Website / GitHub link', 'https://')}
  <div class="full"><label class="l">Project document (PDF, max 15 MB)</label><input type="file" name="pdf" accept="application/pdf"></div>
  <div class="full"><button class="p" type="submit">Submit for supervisor approval</button></div></form>
  <h2>My projects</h2><div class="grid">${mine.map(p => `<div class="card" style="cursor:default"><span class="st ${p.status}">${p.status}</span><h3 style="margin:8px 0 4px;font-size:16px">${esc(p.title)}</h3><div class="mu" style="font-size:12px">Supervisor: ${esc(p.supervisor || '-')}</div>${p.reject_reason ? `<div class="err" style="margin-top:8px">${esc(p.reject_reason)}</div>` : ''}<div class="row" style="margin-top:10px"><button class="sm" onclick="location.hash='#p/${p.id}'">View</button><button class="sm" onclick="delP(${p.id})">Delete</button></div></div>`).join('') || '<p class="mu">Nothing submitted yet.</p>'}</div>`);
  $('#pf').onsubmit = async e => {
    e.preventDefault();
    try { await api('/projects', { method: 'POST', body: new FormData(e.target) }); toast('Submitted. Waiting for supervisor'); student(); }
    catch (x) { const el = $('#pe'); el.textContent = x.message; el.style.display = 'block'; el.scrollIntoView({ block: 'center' }); }
  };
}
async function delP(id) { if (!confirm('Delete this project?')) return; try { await api('/projects/' + id, { method: 'DELETE' }); toast('Deleted'); route(); } catch (e) { toast(e.message, 1); } }

// ---------- supervisor / admin panel ----------
async function review() {
  if (!U || !['supervisor', 'admin'].includes(U.role)) return page(`<p>Please <button class="p" onclick="authBox('login')">log in</button> as a supervisor.</p>`);
  const all = await api('/review'), l = all.filter(p => p.status === rtab);
  let users = '';
  if (U.role === 'admin') { const us = await api('/admin/users'); users = `<h2>All users (${us.length})</h2><div style="overflow-x:auto"><table class="tbl"><tr><th>Name</th><th>Email</th><th>Role</th><th>University</th></tr>${us.map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.role}</td><td>${esc(u.university || '-')}</td></tr>`).join('')}</table></div>`; }
  page(`<h1>${U.role === 'admin' ? 'Admin' : 'Supervisor'} Panel</h1><p class="mu">${esc(U.name)}</p>
  <div class="tabs2">${['pending', 'approved', 'rejected'].map(s => `<button class="chip ${s === rtab ? 'on' : ''}" data-r="${s}">${s} (${all.filter(p => p.status === s).length})</button>`).join('')}</div>
  <div class="grid">${l.map(p => `<div class="card" style="cursor:default"><span class="tag">${esc(p.category)}</span><span class="st ${p.status}">${p.status}</span><h3 style="margin:8px 0 4px;font-size:16px">${esc(p.title)}</h3><div class="mu" style="font-size:12px">${esc(p.student)} · ${esc(p.university)}</div><p style="font-size:13px;margin:8px 0">${esc(p.abstract.slice(0, 140))}${p.abstract.length > 140 ? '…' : ''}</p><div class="row"><button class="sm" onclick="location.hash='#p/${p.id}'">View</button>${p.status !== 'approved' ? `<button class="sm p" onclick="rev(${p.id},'approved')">Approve</button>` : ''}${p.status !== 'rejected' ? `<button class="sm" onclick="rev(${p.id},'rejected')">Reject</button>` : ''}${U.role === 'admin' ? `<button class="sm" onclick="delP(${p.id})">Delete</button>` : ''}</div></div>`).join('') || `<p class="mu">No ${rtab} projects.</p>`}</div>${users}`);
  document.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { rtab = b.dataset.r; review(); });
}
async function rev(id, status) {
  let reason = ''; if (status === 'rejected') { reason = prompt('Reason for rejection (student will see this):'); if (!reason) return; }
  try { await api(`/projects/${id}/review`, { method: 'POST', body: { status, reason } }); toast('Project ' + status); review(); } catch (e) { toast(e.message, 1); }
}

// ---------- router ----------
async function route() {
  nav(); const h = location.hash;
  try {
    if (h.startsWith('#p/')) await detail(h.slice(3));
    else if (h === '#student') await student();
    else if (h === '#review') await review();
    else await home();
  } catch (e) { page(`<p class="err">${esc(e.message)}</p>`); }
  if (!h.startsWith('#p/') && h !== '#explore') scrollTo(0, 0);
}
addEventListener('hashchange', route);
(async () => { try { U = await api('/me'); } catch (e) {} CATS = await api('/categories'); route(); })();
