/* ===========================
   CLASSBOARD — APP.JS
   =========================== */

// ─── COLOR PALETTE ─────────────────────────────────────────
const PALETTE = [
  { color: '#1D9E75', bg: 'var(--c1b)', text: 'var(--c1t)', dot: '#1D9E75' },
  { color: '#378ADD', bg: 'var(--c2b)', text: 'var(--c2t)', dot: '#378ADD' },
  { color: '#D85A30', bg: 'var(--c3b)', text: 'var(--c3t)', dot: '#D85A30' },
  { color: '#D4537E', bg: 'var(--c4b)', text: 'var(--c4t)', dot: '#D4537E' },
  { color: '#7F77DD', bg: 'var(--c5b)', text: 'var(--c5t)', dot: '#7F77DD' },
  { color: '#639922', bg: 'var(--c6b)', text: 'var(--c6t)', dot: '#639922' },
  { color: '#BA7517', bg: 'var(--c7b)', text: 'var(--c7t)', dot: '#BA7517' },
  { color: '#185FA5', bg: 'var(--c8b)', text: 'var(--c8t)', dot: '#185FA5' },
];

// ─── STATE ─────────────────────────────────────────────────
let state = { classes: [], currentClassId: null };
let currentView = 'leaderboard';
let pointsFilter = 'all';
let selectedStudentId = null;

// ─── PERSISTENCE ───────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem('classboard_v3');
    if (raw) state = JSON.parse(raw);
  } catch (e) { state = { classes: [], currentClassId: null }; }
}

function saveState() {
  localStorage.setItem('classboard_v3', JSON.stringify(state));
}

// ─── HELPERS ───────────────────────────────────────────────
function getClass() {
  return state.classes.find(c => c.id === state.currentClassId) || null;
}

function getStudent(id) {
  const cls = getClass();
  return cls ? cls.students.find(s => s.id === id) : null;
}

function getPalette(index) {
  return PALETTE[index % PALETTE.length];
}

function getInitials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

function getMonthName() {
  return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function getTodayStr() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStudentPoints(student, monthOnly) {
  if (!monthOnly) return student.points || 0;
  const m = getMonth();
  return (student.history || []).filter(h => h.month === m).reduce((sum, h) => sum + h.pts, 0);
}

function uid() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// ─── DEMO DATA ──────────────────────────────────────────────
function seedDemo() {
  if (state.classes.length > 0) return;
  const m = getMonth();
  const today = getTodayStr();

  const pythonClass = {
    id: uid(),
    name: 'Python Basics',
    desc: 'Morning batch',
    colorIndex: 0,
    students: [
      {
        id: uid(), name: 'Ahmed Mohamed', points: 185,
        history: [
          { pts: 50, reason: 'Best project in the class', date: today, month: m },
          { pts: 75, reason: 'Solved all bonus challenges', date: today, month: m },
          { pts: 60, reason: 'Helped 3 classmates debug', date: today, month: m },
        ]
      },
      {
        id: uid(), name: 'Sara Ali', points: 140,
        history: [
          { pts: 100, reason: 'Perfect quiz score', date: today, month: m },
          { pts: 40, reason: 'Great participation today', date: today, month: m },
        ]
      },
      {
        id: uid(), name: 'Omar Hassan', points: 95,
        history: [
          { pts: 60, reason: 'Clean, well-commented code', date: today, month: m },
          { pts: 35, reason: 'Early submission', date: today, month: m },
        ]
      },
      {
        id: uid(), name: 'Nour Ibrahim', points: 70,
        history: [
          { pts: 70, reason: 'Good homework this week', date: today, month: m },
        ]
      },
      {
        id: uid(), name: 'Youssef Kamal', points: 45,
        history: [
          { pts: 45, reason: 'Attended all sessions', date: today, month: m },
        ]
      },
    ]
  };

  const webClass = {
    id: uid(),
    name: 'Web Dev Bootcamp',
    desc: 'Evening batch',
    colorIndex: 1,
    students: [
      {
        id: uid(), name: 'Layla Mostafa', points: 210,
        history: [
          { pts: 150, reason: 'Outstanding final project UI', date: today, month: m },
          { pts: 60, reason: 'Excellent CSS animations', date: today, month: m },
        ]
      },
      {
        id: uid(), name: 'Khaled Nasser', points: 130,
        history: [
          { pts: 130, reason: 'All assignments on time', date: today, month: m },
        ]
      },
      {
        id: uid(), name: 'Dina Samir', points: 85,
        history: [
          { pts: 85, reason: 'Responsive design done right', date: today, month: m },
        ]
      },
    ]
  };

  state.classes = [pythonClass, webClass];
  state.currentClassId = pythonClass.id;
  saveState();
}

// ─── RENDER ENGINE ──────────────────────────────────────────
function render() {
  renderClasses();
  renderStats();
  renderLeaderboard();
  renderHistory();
  renderMonthly();
  renderPageHeader();
}

function renderPageHeader() {
  const cls = getClass();
  document.getElementById('pageTitle').textContent =
    currentView === 'leaderboard' ? 'Leaderboard' :
    currentView === 'history' ? 'Points History' : 'Monthly Stars';

  document.getElementById('pageSub').textContent = cls
    ? `${cls.name}${cls.desc ? ' · ' + cls.desc : ''} · ${(cls.students || []).length} students`
    : 'No class selected';
}

function renderClasses() {
  const list = document.getElementById('classesList');
  if (!state.classes.length) {
    list.innerHTML = `<div style="font-size:12px;color:var(--text3);padding:6px 8px;">No classes yet</div>`;
    return;
  }
  list.innerHTML = state.classes.map((cls, i) => {
    const pal = getPalette(cls.colorIndex !== undefined ? cls.colorIndex : i);
    const isActive = cls.id === state.currentClassId;
    return `
      <div class="class-item ${isActive ? 'active' : ''}" onclick="switchClass('${cls.id}')">
        <div class="class-dot" style="background:${pal.dot}"></div>
        <span class="class-name-text">${cls.name}</span>
        <span class="class-count">${(cls.students || []).length}</span>
        <button class="delete-class-btn" onclick="event.stopPropagation(); deleteClass('${cls.id}')" title="Delete class">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');
}

function renderStats() {
  const cls = getClass();
  const grid = document.getElementById('statsGrid');
  if (!cls) { grid.innerHTML = ''; return; }

  const students = cls.students || [];
  const totalPts = students.reduce((s, st) => s + (st.points || 0), 0);
  const topAll = students.length ? [...students].sort((a, b) => b.points - a.points)[0] : null;
  const topMonth = students.length
    ? [...students].sort((a, b) => getStudentPoints(b, true) - getStudentPoints(a, true))[0]
    : null;
  const monthPts = students.reduce((s, st) => s + getStudentPoints(st, true), 0);

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Students</div>
      <div class="stat-value">${students.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Points</div>
      <div class="stat-value">${totalPts.toLocaleString()}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">This Month</div>
      <div class="stat-value">${monthPts.toLocaleString()}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Leader</div>
      <div class="stat-value sm">${topAll ? topAll.name.split(' ')[0] : '—'}</div>
    </div>
  `;
}

function renderLeaderboard() {
  const container = document.getElementById('leaderboardContainer');
  const cls = getClass();

  if (!cls) {
    container.innerHTML = `
      <div class="no-class-state">
        <div class="no-class-logo">CB</div>
        <div class="empty-title">No class selected</div>
        <div class="empty-sub" style="margin-bottom:20px">Create a class to get started</div>
        <button class="btn btn-primary" onclick="openModal('modal-addClass')">Create First Class</button>
      </div>`;
    return;
  }

  const students = cls.students || [];
  if (!students.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🎓</span>
        <div class="empty-title">No students yet</div>
        <div class="empty-sub" style="margin-bottom:20px">Add your first student to start tracking</div>
        <button class="btn btn-primary" onclick="openAddStudentModal()">Add Student</button>
      </div>`;
    return;
  }

  const monthOnly = pointsFilter === 'month';
  const sorted = [...students].sort((a, b) => getStudentPoints(b, monthOnly) - getStudentPoints(a, monthOnly));
  const maxPts = getStudentPoints(sorted[0], monthOnly) || 1;

  const RANK_CLASSES = ['rank-gold', 'rank-silver', 'rank-bronze'];
  const RANK_LABELS = ['🥇', '🥈', '🥉'];
  const RANK_CSS = ['gold', 'silver', 'bronze'];

  const html = sorted.map((st, i) => {
    const pts = getStudentPoints(st, monthOnly);
    const pct = Math.round((pts / maxPts) * 100);
    const palIdx = students.indexOf(st) % PALETTE.length;
    const pal = getPalette(palIdx);
    const initials = getInitials(st.name);
    const rankClass = i < 3 ? RANK_CLASSES[i] : '';
    const rankLabel = i < 3 ? RANK_LABELS[i] : String(i + 1);
    const rankCss = i < 3 ? RANK_CSS[i] : 'other';
    const histCount = (st.history || []).length;

    return `
      <div class="student-card ${rankClass}" onclick="openStudentDetail('${st.id}')" style="animation-delay:${i * 0.04}s">
        <div class="rank-badge ${rankCss}">${rankLabel}</div>
        <div class="avatar" style="background:${pal.bg};color:${pal.color}">${initials}</div>
        <div class="student-info">
          <div class="student-name">${st.name}</div>
          <div class="student-sub">${histCount} award${histCount !== 1 ? 's' : ''}</div>
        </div>
        <div class="progress-wrap">
          <div class="progress-fill" style="width:${pct}%;background:${pal.color}"></div>
        </div>
        <span class="points-pill" style="background:${pal.bg};color:${pal.color}">${pts.toLocaleString()} pts</span>
        <button class="quick-add-btn" onclick="event.stopPropagation(); quickGivePoints('${st.id}')" title="Give points">+</button>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="leaderboard-list">${html}</div>`;
}

function renderHistory() {
  const container = document.getElementById('historyContainer');
  const cls = getClass();
  if (!cls) { container.innerHTML = ''; return; }

  const search = (document.getElementById('historySearch')?.value || '').toLowerCase().trim();

  const all = [];
  cls.students.forEach(st => {
    (st.history || []).forEach(h => {
      all.push({ ...h, studentName: st.name, studentId: st.id });
    });
  });

  all.sort((a, b) => {
    const da = new Date(a.date);
    const db = new Date(b.date);
    if (isNaN(da) || isNaN(db)) return 0;
    return db - da;
  });

  const filtered = search
    ? all.filter(h =>
        h.studentName.toLowerCase().includes(search) ||
        (h.reason || '').toLowerCase().includes(search)
      )
    : all;

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📋</span>
        <div class="empty-title">${search ? 'No results found' : 'No history yet'}</div>
        <div class="empty-sub">${search ? 'Try a different search term' : 'Give points to start tracking history'}</div>
      </div>`;
    return;
  }

  const rows = filtered.slice(0, 100).map(h => `
    <div class="history-row">
      <span class="pts-badge ${h.pts >= 0 ? 'pos' : 'neg'}">${h.pts > 0 ? '+' : ''}${h.pts}</span>
      <span style="font-size:14px;font-weight:500;color:var(--text)">${h.studentName}</span>
      <span style="font-size:13px;color:var(--text2)">${h.reason || '—'}</span>
      <span style="font-size:12px;color:var(--text3);white-space:nowrap">${h.date}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="history-table">
      <div class="history-row header">
        <span>Pts</span>
        <span>Student</span>
        <span>Reason</span>
        <span>Date</span>
      </div>
      ${rows}
    </div>
    ${filtered.length > 100 ? `<p style="font-size:12px;color:var(--text3);text-align:center;margin-top:12px">Showing 100 of ${filtered.length} entries</p>` : ''}
  `;
}

function renderMonthly() {
  const container = document.getElementById('monthlyContainer');
  const cls = getClass();
  if (!cls) { container.innerHTML = ''; return; }

  const students = cls.students || [];
  if (!students.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🏆</span>
        <div class="empty-title">No data yet</div>
        <div class="empty-sub">Add students and give points to see monthly rankings</div>
      </div>`;
    return;
  }

  const sorted = [...students].sort((a, b) => getStudentPoints(b, true) - getStudentPoints(a, true));
  const top3 = sorted.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];

  const podiumCards = top3.map((st, i) => {
    const palIdx = students.indexOf(st) % PALETTE.length;
    const pal = getPalette(palIdx);
    const initials = getInitials(st.name);
    const pts = getStudentPoints(st, true);
    return `
      <div class="podium-card ${i === 0 ? 'first' : ''}">
        <span class="podium-medal">${medals[i]}</span>
        <div class="avatar" style="background:${pal.bg};color:${pal.color};margin:0 auto 10px;width:42px;height:42px;font-size:14px">${initials}</div>
        <div class="podium-name">${st.name}</div>
        <div class="podium-pts">${pts.toLocaleString()} pts this month</div>
      </div>
    `;
  });

  while (podiumCards.length < 3) podiumCards.push(`<div class="podium-card"><div style="height:130px;display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:13px">—</div></div>`);

  const tableRows = sorted.map((st, i) => {
    const palIdx = students.indexOf(st) % PALETTE.length;
    const pal = getPalette(palIdx);
    const pts = getStudentPoints(st, true);
    const initials = getInitials(st.name);
    return `
      <div class="monthly-row">
        <span class="monthly-rank">${i + 1}</span>
        <div class="avatar" style="background:${pal.bg};color:${pal.color};width:32px;height:32px;font-size:11px">${initials}</div>
        <span style="font-size:14px;font-weight:500;color:var(--text);flex:1">${st.name}</span>
        <span style="font-size:13px;font-weight:700;color:${pal.color};font-family:'Syne',sans-serif">${pts.toLocaleString()} pts</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <div style="font-size:14px;font-weight:500;color:var(--text2)">Monthly rankings</div>
      <span class="month-label">${getMonthName()}</span>
    </div>
    <div class="podium-row">${podiumCards.join('')}</div>
    <div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.07em;color:var(--text3);margin-bottom:10px">All students</div>
    <div class="monthly-table">${tableRows}</div>
  `;
}

// ─── ACTIONS ────────────────────────────────────────────────
function addClass() {
  const name = document.getElementById('newClassName').value.trim();
  if (!name) { showToast('Please enter a class name'); return; }
  const desc = document.getElementById('newClassDesc').value.trim();
  const colorIndex = state.classes.length % PALETTE.length;
  const cls = { id: uid(), name, desc, colorIndex, students: [] };
  state.classes.push(cls);
  state.currentClassId = cls.id;
  saveState();
  closeModal('modal-addClass');
  document.getElementById('newClassName').value = '';
  document.getElementById('newClassDesc').value = '';
  render();
  showToast(`Class "${name}" created!`);
}

function switchClass(id) {
  state.currentClassId = id;
  saveState();
  render();
}

function deleteClass(id) {
  const cls = state.classes.find(c => c.id === id);
  if (!cls) return;
  if (!confirm(`Delete "${cls.name}"? This will remove all students and points. This cannot be undone.`)) return;
  state.classes = state.classes.filter(c => c.id !== id);
  if (state.currentClassId === id) {
    state.currentClassId = state.classes.length ? state.classes[0].id : null;
  }
  saveState();
  render();
  showToast('Class deleted');
}

function addStudent() {
  const name = document.getElementById('newStudentName').value.trim();
  if (!name) { showToast('Please enter a student name'); return; }
  const cls = getClass();
  if (!cls) return;
  cls.students.push({ id: uid(), name, points: 0, history: [] });
  saveState();
  closeModal('modal-addStudent');
  document.getElementById('newStudentName').value = '';
  render();
  showToast(`${name} added to class!`);
}

function givePoints() {
  const studentId = document.getElementById('pointsStudent').value;
  const pts = parseInt(document.getElementById('pointsAmount').value, 10);
  const reason = document.getElementById('pointsReason').value.trim();

  if (isNaN(pts) || pts === 0) { showToast('Enter a valid point amount'); return; }

  const cls = getClass();
  const st = cls ? cls.students.find(s => s.id === studentId) : null;
  if (!st) return;

  st.points = (st.points || 0) + pts;
  st.history = st.history || [];
  st.history.push({ pts, reason, date: getTodayStr(), month: getMonth() });
  saveState();
  closeModal('modal-givePoints');

  document.getElementById('pointsAmount').value = '10';
  document.getElementById('pointsReason').value = '';

  render();
  showToast(`${pts > 0 ? '+' : ''}${pts} pts → ${st.name}`);
}

function removeStudent() {
  if (!selectedStudentId) return;
  const cls = getClass();
  const st = cls ? cls.students.find(s => s.id === selectedStudentId) : null;
  if (!st) return;
  if (!confirm(`Remove "${st.name}" from class?`)) return;
  cls.students = cls.students.filter(s => s.id !== selectedStudentId);
  saveState();
  closeModal('modal-studentDetail');
  selectedStudentId = null;
  render();
  showToast('Student removed');
}

// ─── MODAL HELPERS ──────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
  setTimeout(() => {
    const first = document.getElementById(id).querySelector('input:not([type=number]), textarea');
    if (first) first.focus();
  }, 120);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function overlayClose(event, id) {
  if (event.target.id === id) closeModal(id);
}

function openAddStudentModal() {
  if (!state.currentClassId) {
    showToast('Create a class first!');
    openModal('modal-addClass');
    return;
  }
  openModal('modal-addStudent');
}

function openGivePointsModal(preSelectedId) {
  const cls = getClass();
  if (!cls || !cls.students.length) {
    showToast('Add students first!');
    return;
  }
  const sel = document.getElementById('pointsStudent');
  sel.innerHTML = cls.students.map(s =>
    `<option value="${s.id}" ${s.id === preSelectedId ? 'selected' : ''}>${s.name}</option>`
  ).join('');
  document.getElementById('pointsAmount').value = '10';
  document.getElementById('pointsReason').value = '';
  openModal('modal-givePoints');
}

function quickGivePoints(studentId) {
  selectedStudentId = studentId || selectedStudentId;
  closeModal('modal-studentDetail');
  openGivePointsModal(selectedStudentId);
}

function openStudentDetail(id) {
  const cls = getClass();
  const st = cls ? cls.students.find(s => s.id === id) : null;
  if (!st) return;
  selectedStudentId = id;

  const palIdx = cls.students.indexOf(st) % PALETTE.length;
  const pal = getPalette(palIdx);
  const initials = getInitials(st.name);
  const monthPts = getStudentPoints(st, true);
  const hist = [...(st.history || [])].reverse();

  document.getElementById('studentDetailContent').innerHTML = `
    <div class="detail-header">
      <div class="detail-avatar" style="background:${pal.bg};color:${pal.color}">${initials}</div>
      <div>
        <div style="font-family:'Syne',sans-serif;font-size:19px;font-weight:700;color:var(--text);letter-spacing:-0.02em">${st.name}</div>
        <div style="font-size:13px;color:var(--text3);margin-top:2px">${cls.name}</div>
      </div>
    </div>
    <div class="detail-stats">
      <div class="detail-stat">
        <div class="detail-stat-label">Total Points</div>
        <div class="detail-stat-value">${(st.points || 0).toLocaleString()}</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">This Month</div>
        <div class="detail-stat-value">${monthPts.toLocaleString()}</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Awards</div>
        <div class="detail-stat-value">${hist.length}</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Rank</div>
        <div class="detail-stat-value">#${getRank(cls, id)}</div>
      </div>
    </div>
    <div class="detail-history-title">Points History</div>
    ${hist.length ? hist.slice(0, 20).map(h => `
      <div class="detail-history-item">
        <span class="pts-badge ${h.pts >= 0 ? 'pos' : 'neg'}">${h.pts > 0 ? '+' : ''}${h.pts}</span>
        <span style="flex:1;color:var(--text2)">${h.reason || '—'}</span>
        <span style="color:var(--text3);font-size:11px;white-space:nowrap">${h.date}</span>
      </div>
    `).join('') : `<div style="font-size:13px;color:var(--text3)">No history yet.</div>`}
  `;

  openModal('modal-studentDetail');
}

function getRank(cls, studentId) {
  const sorted = [...(cls.students || [])].sort((a, b) => (b.points || 0) - (a.points || 0));
  const idx = sorted.findIndex(s => s.id === studentId);
  return idx + 1;
}

// ─── FILTER & VIEWS ─────────────────────────────────────────
function setFilter(f, btn) {
  pointsFilter = f;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderLeaderboard();
}

function switchView(view, el) {
  currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  renderPageHeader();
}

// ─── DARK MODE ──────────────────────────────────────────────
function toggleDark() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? '' : 'dark');
  localStorage.setItem('classboard_theme', isDark ? 'light' : 'dark');
}

function applyTheme() {
  const saved = localStorage.getItem('classboard_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// ─── EXPORT CSV ─────────────────────────────────────────────
function exportCSV() {
  const cls = getClass();
  if (!cls) { showToast('No class selected'); return; }

  const rows = [['Name', 'Total Points', 'This Month Points', 'Awards Count']];
  const sorted = [...cls.students].sort((a, b) => (b.points || 0) - (a.points || 0));

  sorted.forEach(st => {
    rows.push([
      `"${st.name}"`,
      st.points || 0,
      getStudentPoints(st, true),
      (st.history || []).length,
    ]);
  });

  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cls.name.replace(/\s+/g, '_')}_leaderboard_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported!');
}

// ─── QUICK POINTS HELPER ────────────────────────────────────
function setQuickPts(val) {
  document.getElementById('pointsAmount').value = val;
}

// ─── SIDEBAR TOGGLE ─────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ─── TOAST ──────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── KEYBOARD SHORTCUTS ─────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openGivePointsModal(null);
  }
});

// Close sidebar on outside click (mobile)
document.addEventListener('click', e => {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  if (window.innerWidth < 768 && sidebar.classList.contains('open')) {
    if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  }
});

// ─── INIT ────────────────────────────────────────────────────
applyTheme();
loadState();
seedDemo();
render();
