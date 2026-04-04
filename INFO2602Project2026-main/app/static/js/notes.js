/* ═══════════════════════════════════════════════════════
   COSCRIBE  ·  notes.js
   app/static/js/notes.js
═══════════════════════════════════════════════════════ */

const APP  = document.getElementById('csApp');
const ED   = document.getElementById('noteEditor');

/* ── THEME ─────────────────────────── */
(function initTheme() {
  if (localStorage.getItem('cs-theme') === 'dark') APP.setAttribute('data-theme','dark');
})();

document.getElementById('themeBtn').addEventListener('click', () => {
  const dark = APP.getAttribute('data-theme') === 'dark';
  dark ? APP.removeAttribute('data-theme') : APP.setAttribute('data-theme','dark');
  localStorage.setItem('cs-theme', dark ? 'light' : 'dark');
});

/* ── PANELS ─────────────────────────
   State cycle (toggle btn): 0→1→2→0
   0 = both hidden
   1 = both open  (courses behind, notes offset right)
   2 = notes only
   Individual × buttons close their own panel.
──────────────────────────────────── */
const cPanel = document.getElementById('coursesPanel');
const nPanel = document.getElementById('notesPanel');
let pState   = 0;

function setPanels(state) {
  pState = state;
  const W = getComputedStyle(document.documentElement)
              .getPropertyValue('--cs-panel-w').trim(); // e.g. "260px"

  if (state === 0) {
    cPanel.classList.remove('open');
    nPanel.classList.remove('open');
    nPanel.style.left = '0';
  } else if (state === 1) {
    cPanel.classList.add('open');
    nPanel.classList.add('open');
    nPanel.style.left = W;
  } else if (state === 2) {
    cPanel.classList.remove('open');
    nPanel.classList.add('open');
    nPanel.style.left = '0';
  }
}

document.getElementById('panelToggle').addEventListener('click', () => {
  setPanels(pState === 0 ? 1 : pState === 1 ? 2 : 0);
});

document.getElementById('closeCoursesBtn').addEventListener('click', () => {
  cPanel.classList.remove('open');
  nPanel.style.left = '0';
  pState = nPanel.classList.contains('open') ? 2 : 0;
});

document.getElementById('closeNotesBtn').addEventListener('click', () => {
  nPanel.classList.remove('open');
  cPanel.classList.remove('open');
  nPanel.style.left = '0';
  pState = 0;
});

// Keyboard shortcut Ctrl+\
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
    e.preventDefault();
    setPanels(pState === 0 ? 1 : pState === 1 ? 2 : 0);
  }
});

/* ── TOOLBAR STATE SYNC ──────────── */
const TB_STATES = {
  'btn-bold':      'bold',
  'btn-italic':    'italic',
  'btn-underline': 'underline',
  'btn-strike':    'strikeThrough',
};

function syncToolbar() {
  for (const [id, cmd] of Object.entries(TB_STATES)) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('on', document.queryCommandState(cmd));
  }
}
document.addEventListener('selectionchange', syncToolbar);

/* ── EXEC COMMAND ────────────────── */
function execCmd(command, value = null) {
  ED.focus();
  document.execCommand(command, false, value);
  syncToolbar();
}

/* ── FORMAT BLOCK TOGGLE ─────────── */
function toggleBlock(tag) {
  ED.focus();
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const anc    = sel.getRangeAt(0).commonAncestorContainer;
  const parent = anc.nodeType === 3 ? anc.parentElement : anc;
  const inside = parent.closest(tag);
  document.execCommand('formatBlock', false, inside ? 'p' : tag);
}

/* ── BLOCKQUOTE TOGGLE ───────────── */
function toggleQuote() {
  ED.focus();
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const anc    = sel.getRangeAt(0).commonAncestorContainer;
  const parent = anc.nodeType === 3 ? anc.parentElement : anc;
  const inQ    = parent.closest('blockquote');
  document.execCommand('formatBlock', false, inQ ? 'p' : 'blockquote');
}

/* ── INLINE CODE TOGGLE ──────────── */
function toggleCode() {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range  = sel.getRangeAt(0);
  const anc    = range.commonAncestorContainer;
  const parent = anc.nodeType === 3 ? anc.parentElement : anc;
  const codeEl = parent.closest('code');

  if (codeEl) {
    // Unwrap: replace <code> with plain text
    const text = document.createTextNode(codeEl.textContent);
    codeEl.replaceWith(text);
    return;
  }
  const text = range.toString();
  if (!text) return;
  const code = document.createElement('code');
  code.textContent = text;
  range.deleteContents();
  range.insertNode(code);
  sel.removeAllRanges();
}

/* ── BUTTON WIRING ───────────────── */
document.getElementById('btn-bold')     .addEventListener('click', () => execCmd('bold'));
document.getElementById('btn-italic')   .addEventListener('click', () => execCmd('italic'));
document.getElementById('btn-underline').addEventListener('click', () => execCmd('underline'));
document.getElementById('btn-strike')   .addEventListener('click', () => execCmd('strikeThrough'));
document.getElementById('btn-h1')       .addEventListener('click', () => toggleBlock('h2'));
document.getElementById('btn-h2')       .addEventListener('click', () => toggleBlock('h3'));
document.getElementById('btn-p')        .addEventListener('click', () => execCmd('formatBlock','p'));
document.getElementById('btn-ul')       .addEventListener('click', () => execCmd('insertUnorderedList'));
document.getElementById('btn-ol')       .addEventListener('click', () => execCmd('insertOrderedList'));
document.getElementById('btn-quote')    .addEventListener('click', toggleQuote);
document.getElementById('btn-code')     .addEventListener('click', toggleCode);
document.getElementById('btn-left')     .addEventListener('click', () => execCmd('justifyLeft'));
document.getElementById('btn-center')   .addEventListener('click', () => execCmd('justifyCenter'));
document.getElementById('btn-right')    .addEventListener('click', () => execCmd('justifyRight'));
document.getElementById('btn-undo')     .addEventListener('click', () => execCmd('undo'));
document.getElementById('btn-redo')     .addEventListener('click', () => execCmd('redo'));
const deleteBtn = document.getElementById('deleteNoteBtn');

async function deleteNote() {
  const isNew = window.COSCRIBE_NOTE?.isNew;
  const noteId = window.COSCRIBE_NOTE?.noteId;

  if (isNew || !noteId) {
    alert('This note has not been created yet.');
    return;
  }

  const confirmed = window.confirm('Are you sure you want to delete this note?');
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw new Error('Failed to delete note');
    }

    window.location.href = '/app';
  } catch (err) {
    console.error(err);
    alert('Could not delete note.');
  }
}

if (deleteBtn) {
  deleteBtn.addEventListener('click', deleteNote);
}

/* ── KEYBOARD SHORTCUTS ──────────── */
ED.addEventListener('keydown', e => {
  const ctrl = e.ctrlKey || e.metaKey;
  if (!ctrl) return;
  const map = {
    'e': 'justifyCenter',
    'l': 'justifyLeft',
    'r': 'justifyRight',
    'j': 'justifyFull',
  };
  if (map[e.key.toLowerCase()]) {
    e.preventDefault();
    execCmd(map[e.key.toLowerCase()]);
  }
});

/* ── HIGHLIGHT ───────────────────── */
const hlBtn    = document.getElementById('hlBtn');
const hlPicker = document.getElementById('hlPicker');
const hlSwatch = document.getElementById('hlSwatch');

hlBtn.addEventListener('click', e => {
  e.stopPropagation();
  hlPicker.classList.toggle('open');
});
document.addEventListener('click', e => {
  if (!hlBtn.contains(e.target)) hlPicker.classList.remove('open');
});

function applyHL(color) {
  ED.focus();
  if (!color) {
    document.execCommand('removeFormat');
  } else {
    document.execCommand('hiliteColor', false, color);
    hlSwatch.style.background = color;
  }
  hlPicker.classList.remove('open');
}

/* ── FONT PICKER ─────────────────── */
document.getElementById('fontPicker').addEventListener('change', function() {
  ED.style.fontFamily = this.value;
});

/* ── IMAGE INSERT ────────────────── */
document.getElementById('btn-img').addEventListener('click', () => {
  document.getElementById('imgFile').click();
});
document.getElementById('imgFile').addEventListener('change', function() {
  const file = this.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    ED.focus();
    const img = document.createElement('img');
    img.src = ev.target.result; img.style.maxWidth = '100%';
    const sel = window.getSelection();
    if (sel.rangeCount) {
      const r = sel.getRangeAt(0); r.collapse(false); r.insertNode(img);
    } else ED.appendChild(img);
  };
  reader.readAsDataURL(file);
  this.value = '';
});

/* ── NOTE TITLE ──────────────────── */
const titleInput = document.getElementById('noteTitle');
const navTitle   = document.getElementById('navTitle');

titleInput.addEventListener('input', function() {
  navTitle.textContent = this.value || 'Untitled Note';
});
// Sync on load
navTitle.textContent = titleInput.value || 'Untitled Note';

/* ── AUTOSAVE ────────────────────── */
let saveTimer = null;
function triggerSave() {
  const lbl = document.getElementById('savedLbl');
  lbl.textContent = 'Saving…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { lbl.textContent = 'Saved just now'; }, 1200);
}
ED.addEventListener('input', triggerSave);
titleInput.addEventListener('input', triggerSave);

/* ── RECORDING ───────────────────── */
let recOn = false, recInterval = null, recSecs = 0, mRec = null, chunks = [];

async function startRec() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mRec = new MediaRecorder(stream); chunks = [];
    mRec.ondataavailable = e => chunks.push(e.data);
    mRec.onstop = () => {
      addClip(new Blob(chunks, { type: 'audio/webm' }), recSecs);
      stream.getTracks().forEach(t => t.stop());
    };
    mRec.start(); recOn = true;
    document.getElementById('recBtn').classList.add('on');
    document.getElementById('recLabel').textContent = 'Recording…';
    document.getElementById('recOverlay').classList.add('open');
    recSecs = 0;
    recInterval = setInterval(() => {
      recSecs++;
      const m = Math.floor(recSecs / 60), s = recSecs % 60;
      document.getElementById('recTime').textContent = `${m}:${s.toString().padStart(2,'0')}`;
    }, 1000);
  } catch { alert('Microphone access denied.'); }
}

function stopRec() {
  recOn = false;
  if (mRec) mRec.stop();
  clearInterval(recInterval);
  document.getElementById('recBtn').classList.remove('on');
  document.getElementById('recLabel').textContent = 'Record';
  document.getElementById('recOverlay').classList.remove('open');
}

document.getElementById('recBtn') .addEventListener('click', () => recOn ? stopRec() : startRec());
document.getElementById('recStop').addEventListener('click', stopRec);

function addClip(blob, dur) {
  const url = URL.createObjectURL(blob);
  const m = Math.floor(dur / 60), s = dur % 60;
  const item = document.createElement('div'); item.className = 'cs-audio-item';
  const pb = document.createElement('button'); pb.className = 'cs-play'; pb.textContent = '▶';
  const wv = document.createElement('div');   wv.className  = 'cs-wave'; genWave(wv);
  const du = document.createElement('span');  du.className  = 'cs-dur-label';
  du.textContent = `${m}:${s.toString().padStart(2,'0')}`;
  const au = new Audio(url);
  pb.addEventListener('click', () => {
    if (au.paused) { au.play(); pb.textContent = '⏸'; }
    else           { au.pause(); pb.textContent = '▶'; }
    au.onended = () => pb.textContent = '▶';
  });
  item.append(pb, wv, du);
  document.getElementById('audioList').appendChild(item);
}

/* ── WAVEFORM ────────────────────── */
function genWave(el, n = 36) {
  el.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const b = document.createElement('div'); b.className = 'cs-wbar';
    b.style.height = (4 + Math.random() * 20) + 'px'; el.appendChild(b);
  }
}
document.querySelectorAll('.cs-wave').forEach(genWave);

function togglePlay(btn) { btn.textContent = btn.textContent === '▶' ? '⏸' : '▶'; }

/* ── COURSE ITEMS ────────────────── */
document.querySelectorAll('.cs-ci').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.cs-ci').forEach(i => {
      i.classList.remove('active');
      i.querySelector('.cs-badge')?.classList.remove('red');
    });
    item.classList.add('active');
    item.querySelector('.cs-badge')?.classList.add('red');
  });
});

/* ── NOTE CARDS ──────────────────── */
document.querySelectorAll('.cs-nc').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.cs-nc').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    const t = card.querySelector('.cs-nc-title').textContent;
    titleInput.value   = t;
    navTitle.textContent = t;
    if (window.innerWidth <= 768) setPanels(0);
  });
});

/* ── COURSE SEARCH ───────────────── */
document.getElementById('courseSearch').addEventListener('input', function() {
  const q = this.value.toLowerCase();
  document.querySelectorAll('.cs-ci').forEach(i => {
    i.style.display = i.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

/* ── SAVE NOTE ───────────────────── */
const saveBtn = document.getElementById('saveNoteBtn');

async function saveNote() {
  const title = titleInput.value.trim();
  const content = ED.innerHTML.trim();
  const lbl = document.getElementById('savedLbl');

  if (!title) {
    alert('Please enter a note title.');
    return;
  }

  const plainText = ED.innerText.trim();
  if (!plainText) {
    alert('Note content cannot be empty.');
    return;
  }

  lbl.textContent = 'Saving…';

  const payload = {
    title: title,
    content: content,
    course_id: window.COSCRIBE_NOTE?.courseId || 1
  };

  const isNew = window.COSCRIBE_NOTE?.isNew;
  const noteId = window.COSCRIBE_NOTE?.noteId;

  const url = isNew
    ? '/api/notes/'
    : `/api/notes/${noteId}`;

  const method = isNew ? 'POST' : 'PUT';

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error('Failed to save note');
    }

    const saved = await res.json();

    lbl.textContent = 'Saved just now';

    // Redirect ONLY if new note
    if (isNew) {
      window.location.href = `/notes/${saved.id}`;
    }

  } catch (err) {
    console.error(err);
    lbl.textContent = 'Save failed';
    alert('Could not save note.');
  }
}

if (saveBtn) {
  saveBtn.addEventListener('click', saveNote);
}