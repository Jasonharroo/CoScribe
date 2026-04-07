const APP = document.getElementById("csApp");
const ED = document.getElementById("noteEditor");
const titleInput = document.getElementById("noteTitle");
const navTitle = document.getElementById("navTitle");
const saveBtn = document.getElementById("saveNoteBtn");
const deleteBtn = document.getElementById("deleteNoteBtn");

/* Theme */
(function initTheme() {
  if (localStorage.getItem("cs-theme") === "dark") {
    APP?.setAttribute("data-theme", "dark");
  }
})();

document.getElementById("themeBtn")?.addEventListener("click", () => {
  const dark = APP?.getAttribute("data-theme") === "dark";
  if (dark) {
    APP?.removeAttribute("data-theme");
    localStorage.setItem("cs-theme", "light");
  } else {
    APP?.setAttribute("data-theme", "dark");
    localStorage.setItem("cs-theme", "dark");
  }
});

/* Panels */
const cPanel = document.getElementById("coursesPanel");
const nPanel = document.getElementById("notesPanel");
let pState = 0;

function setPanels(state) {
  pState = state;
  const W = getComputedStyle(document.documentElement)
    .getPropertyValue("--cs-panel-w")
    .trim();

  if (state === 0) {
    cPanel?.classList.remove("open");
    nPanel?.classList.remove("open");
    if (nPanel) nPanel.style.left = "0";
  } else if (state === 1) {
    cPanel?.classList.add("open");
    nPanel?.classList.add("open");
    if (nPanel) nPanel.style.left = W;
  } else if (state === 2) {
    cPanel?.classList.remove("open");
    nPanel?.classList.add("open");
    if (nPanel) nPanel.style.left = "0";
  }
}

document.getElementById("panelToggle")?.addEventListener("click", () => {
  setPanels(pState === 0 ? 1 : pState === 1 ? 2 : 0);
});

document.getElementById("closeCoursesBtn")?.addEventListener("click", () => {
  cPanel?.classList.remove("open");
  if (nPanel) nPanel.style.left = "0";
  pState = nPanel?.classList.contains("open") ? 2 : 0;
});

document.getElementById("closeNotesBtn")?.addEventListener("click", () => {
  nPanel?.classList.remove("open");
  cPanel?.classList.remove("open");
  if (nPanel) nPanel.style.left = "0";
  pState = 0;
});

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
    e.preventDefault();
    setPanels(pState === 0 ? 1 : pState === 1 ? 2 : 0);
  }
});

/* Toolbar state */
const TB_STATES = {
  "btn-bold": "bold",
  "btn-italic": "italic",
  "btn-underline": "underline",
  "btn-strike": "strikeThrough",
};

function syncToolbar() {
  for (const [id, cmd] of Object.entries(TB_STATES)) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("on", document.queryCommandState(cmd));
  }
}

document.addEventListener("selectionchange", syncToolbar);

function execCmd(command, value = null) {
  ED?.focus();
  document.execCommand(command, false, value);
  syncToolbar();
}

function toggleBlock(tag) {
  ED?.focus();
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const anc = sel.getRangeAt(0).commonAncestorContainer;
  const parent = anc.nodeType === 3 ? anc.parentElement : anc;
  const inside = parent?.closest(tag);
  document.execCommand("formatBlock", false, inside ? "p" : tag);
}

function toggleQuote() {
  ED?.focus();
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const anc = sel.getRangeAt(0).commonAncestorContainer;
  const parent = anc.nodeType === 3 ? anc.parentElement : anc;
  const inQ = parent?.closest("blockquote");
  document.execCommand("formatBlock", false, inQ ? "p" : "blockquote");
}

function toggleCode() {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  const anc = range.commonAncestorContainer;
  const parent = anc.nodeType === 3 ? anc.parentElement : anc;
  const codeEl = parent?.closest("code");

  if (codeEl) {
    const text = document.createTextNode(codeEl.textContent);
    codeEl.replaceWith(text);
    return;
  }

  const text = range.toString();
  if (!text) return;

  const code = document.createElement("code");
  code.textContent = text;
  range.deleteContents();
  range.insertNode(code);
  sel.removeAllRanges();
}

/* Button wiring */
document.getElementById("btn-bold")?.addEventListener("click", () => execCmd("bold"));
document.getElementById("btn-italic")?.addEventListener("click", () => execCmd("italic"));
document.getElementById("btn-underline")?.addEventListener("click", () => execCmd("underline"));
document.getElementById("btn-strike")?.addEventListener("click", () => execCmd("strikeThrough"));
document.getElementById("btn-h1")?.addEventListener("click", () => toggleBlock("h2"));
document.getElementById("btn-h2")?.addEventListener("click", () => toggleBlock("h3"));
document.getElementById("btn-p")?.addEventListener("click", () => execCmd("formatBlock", "p"));
document.getElementById("btn-ul")?.addEventListener("click", () => execCmd("insertUnorderedList"));
document.getElementById("btn-ol")?.addEventListener("click", () => execCmd("insertOrderedList"));
document.getElementById("btn-quote")?.addEventListener("click", toggleQuote);
document.getElementById("btn-code")?.addEventListener("click", toggleCode);
document.getElementById("btn-left")?.addEventListener("click", () => execCmd("justifyLeft"));
document.getElementById("btn-center")?.addEventListener("click", () => execCmd("justifyCenter"));
document.getElementById("btn-right")?.addEventListener("click", () => execCmd("justifyRight"));
document.getElementById("btn-undo")?.addEventListener("click", () => execCmd("undo"));
document.getElementById("btn-redo")?.addEventListener("click", () => execCmd("redo"));

/* Keyboard shortcuts */
ED?.addEventListener("keydown", (e) => {
  const ctrl = e.ctrlKey || e.metaKey;
  if (!ctrl) return;

  const map = {
    e: "justifyCenter",
    l: "justifyLeft",
    r: "justifyRight",
    j: "justifyFull",
  };

  const cmd = map[e.key.toLowerCase()];
  if (cmd) {
    e.preventDefault();
    execCmd(cmd);
  }
});

/* Highlight */
const hlBtn = document.getElementById("hlBtn");
const hlPicker = document.getElementById("hlPicker");
const hlSwatch = document.getElementById("hlSwatch");

hlBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  hlPicker?.classList.toggle("open");
});

document.addEventListener("click", (e) => {
  if (hlBtn && !hlBtn.contains(e.target)) {
    hlPicker?.classList.remove("open");
  }
});

window.applyHL = function (color) {
  ED?.focus();
  if (!color) {
    document.execCommand("removeFormat");
  } else {
    document.execCommand("hiliteColor", false, color);
    if (hlSwatch) hlSwatch.style.background = color;
  }
  hlPicker?.classList.remove("open");
};

/* Font picker */
document.getElementById("fontPicker")?.addEventListener("change", function () {
  if (ED) ED.style.fontFamily = this.value;
});

/* Image insert */
document.getElementById("btn-img")?.addEventListener("click", () => {
  document.getElementById("imgFile")?.click();
});

document.getElementById("imgFile")?.addEventListener("change", function () {
  const file = this.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    ED?.focus();
    const img = document.createElement("img");
    img.src = ev.target.result;
    img.style.maxWidth = "100%";

    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const r = sel.getRangeAt(0);
      r.collapse(false);
      r.insertNode(img);
    } else {
      ED?.appendChild(img);
    }
  };

  reader.readAsDataURL(file);
  this.value = "";
});

/* Title sync */
titleInput?.addEventListener("input", function () {
  if (navTitle) navTitle.textContent = this.value || "Untitled Note";
});

if (navTitle && titleInput) {
  navTitle.textContent = titleInput.value || "Untitled Note";
}

/* Fake autosave label */
let saveTimer = null;
function triggerSaveLabel() {
  const lbl = document.getElementById("savedLbl");
  if (!lbl) return;
  lbl.textContent = "Saving…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    lbl.textContent = "Saved just now";
  }, 1200);
}

ED?.addEventListener("input", triggerSaveLabel);
titleInput?.addEventListener("input", triggerSaveLabel);

/* Recording */
let recOn = false;
let recInterval = null;
let recSecs = 0;
let mRec = null;
let chunks = [];

async function startRec() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mRec = new MediaRecorder(stream);
    chunks = [];

    mRec.ondataavailable = (e) => chunks.push(e.data);
    mRec.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      await uploadClip(blob, recSecs);
      stream.getTracks().forEach((t) => t.stop());
    };

    mRec.start();
    recOn = true;
    document.getElementById("recBtn")?.classList.add("on");
    const recLabel = document.getElementById("recLabel");
    if (recLabel) recLabel.textContent = "Recording…";
    document.getElementById("recOverlay")?.classList.add("open");

    recSecs = 0;
    recInterval = setInterval(() => {
      recSecs++;
      const m = Math.floor(recSecs / 60);
      const s = recSecs % 60;
      const recTime = document.getElementById("recTime");
      if (recTime) recTime.textContent = `${m}:${s.toString().padStart(2, "0")}`;
    }, 1000);
  } catch {
    alert("Microphone access denied.");
  }
}

function stopRec() {
  recOn = false;
  if (mRec) mRec.stop();
  clearInterval(recInterval);
  document.getElementById("recBtn")?.classList.remove("on");
  const recLabel = document.getElementById("recLabel");
  if (recLabel) recLabel.textContent = "Record";
  document.getElementById("recOverlay")?.classList.remove("open");
}

document.getElementById("recBtn")?.addEventListener("click", () => {
  recOn ? stopRec() : startRec();
});

document.getElementById("recStop")?.addEventListener("click", stopRec);

async function uploadClip(blob, dur) {
  const noteId = window.COSCRIBE_NOTE?.noteId;

  if (!noteId) {
    alert("Please save the note before adding a voice recording.");
    return;
  }

  const formData = new FormData();
  formData.append("note_id", String(noteId));
  formData.append("duration_seconds", String(dur));
  formData.append("audio", blob, `voice-note-${Date.now()}.webm`);

  try {
    const res = await fetch("/api/voice-notes/", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Failed to upload voice note");
    }

    const saved = await res.json();
    addClip(saved.file_path, saved.duration_seconds, saved.id);
  } catch (err) {
    console.error(err);
    alert("Could not save voice note.");
  }
}

function renderAudioEmptyState() {
  const audioList = document.getElementById("audioList");
  if (!audioList) return;

  const existingItems = audioList.querySelectorAll(".cs-audio-item");
  const existingEmpty = audioList.querySelector(".cs-nc.active");

  if (existingItems.length === 0 && !existingEmpty) {
    audioList.insertAdjacentHTML(
      "beforeend",
      `
      <div class="cs-nc active">
        <div class="cs-nc-title">No recordings yet</div>
        <div class="cs-nc-excerpt">
          Record audio and it will appear here.
        </div>
      </div>
      `
    );
  }
}

async function deleteVoiceNote(voiceNoteId, item, deleteBtn, audioEl, playBtn) {
  if (!voiceNoteId) {
    alert("This recording cannot be deleted because it has no ID.");
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to delete this recording?"
  );
  if (!confirmed) return;

  try {
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.style.opacity = "0.6";
    }

    const res = await fetch(`/api/voice-notes/${voiceNoteId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete voice note");
    }

    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }

    if (playBtn) {
      playBtn.textContent = "▶";
    }

    item?.remove();
    renderAudioEmptyState();
  } catch (err) {
    console.error("Voice note delete failed:", err);
    alert("Could not delete this recording.");

    if (deleteBtn) {
      deleteBtn.disabled = false;
      deleteBtn.style.opacity = "";
    }
  }
}

function addClip(audioSrc, dur, voiceNoteId = null) {
  const m = Math.floor(dur / 60);
  const s = dur % 60;

  const emptyState = document.querySelector("#audioList .cs-nc.active");
  if (emptyState) emptyState.remove();

  const item = document.createElement("div");
  item.className = "cs-audio-item";
  if (voiceNoteId) item.dataset.voiceNoteId = voiceNoteId;

  const pb = document.createElement("button");
  pb.className = "cs-play";
  pb.type = "button";
  pb.textContent = "▶";

  const wv = document.createElement("div");
  wv.className = "cs-wave";
  genWave(wv);

  const du = document.createElement("span");
  du.className = "cs-dur-label";
  du.textContent = `${m}:${s.toString().padStart(2, "0")}`;

  const del = document.createElement("button");
  del.className = "cs-icon-btn sm cs-audio-delete";
  del.type = "button";
  del.title = "Delete recording";
  del.setAttribute("aria-label", "Delete recording");
  del.innerHTML = `
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  `;

  const au = document.createElement("audio");
  au.preload = "metadata";
  au.src = audioSrc;

  pb.addEventListener("click", async () => {
    try {
      if (au.paused) {
        await au.play();
        pb.textContent = "⏸";
      } else {
        au.pause();
        pb.textContent = "▶";
      }
    } catch (err) {
      console.error("Audio playback failed:", err);
      alert("Could not play this recording.");
    }
  });

  au.addEventListener("ended", () => {
    pb.textContent = "▶";
  });

  au.addEventListener("pause", () => {
    if (au.currentTime < au.duration) {
      pb.textContent = "▶";
    }
  });

  item.append(pb, wv, du, del, au);
  document.getElementById("audioList")?.appendChild(item);
}

function genWave(el, n = 36) {
  el.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const b = document.createElement("div");
    b.className = "cs-wbar";
    b.style.height = `${4 + Math.random() * 20}px`;
    el.appendChild(b);
  }
}

function wireExistingAudioItems() {
  document.querySelectorAll("#audioList .cs-audio-item").forEach((item) => {
    const btn = item.querySelector(".cs-play");
    const audio = item.querySelector("audio");
    const wave = item.querySelector(".cs-wave");

    if (wave) genWave(wave);
    if (!btn || !audio) return;
    if (btn.dataset.bound === "true") return;

    btn.dataset.bound = "true";

    btn.addEventListener("click", async () => {
      try {
        if (audio.paused) {
          await audio.play();
          btn.textContent = "⏸";
        } else {
          audio.pause();
          btn.textContent = "▶";
        }
      } catch (err) {
        console.error("Audio playback failed:", err);
        alert("Could not play this recording.");
      }
    });

    audio.addEventListener("ended", () => {
      btn.textContent = "▶";
    });

    audio.addEventListener("pause", () => {
      if (audio.currentTime < audio.duration) {
        btn.textContent = "▶";
      }
    });
  });
}

wireExistingAudioItems();

const audioListEl = document.getElementById("audioList");

audioListEl?.addEventListener("click", (e) => {
  const deleteBtn = e.target.closest(".cs-audio-delete");
  if (!deleteBtn) return;

  e.preventDefault();
  e.stopPropagation();

  const item = deleteBtn.closest(".cs-audio-item");
  if (!item) return;

  const voiceNoteId = item.dataset.voiceNoteId;
  const audio = item.querySelector("audio");
  const playBtn = item.querySelector(".cs-play");

  deleteVoiceNote(voiceNoteId, item, deleteBtn, audio, playBtn);
});

window.togglePlay = function (btn) {
  btn.textContent = btn.textContent === "▶" ? "⏸" : "▶";
};

/* Course search */
document.getElementById("courseSearch")?.addEventListener("input", function () {
  const q = this.value.toLowerCase();
  document.querySelectorAll(".cs-ci").forEach((i) => {
    i.style.display = i.textContent.toLowerCase().includes(q) ? "" : "none";
  });
});

/* Save */
async function saveNote() {
  const title = titleInput?.value.trim() || "";
  const content = ED?.innerHTML.trim() || "";
  const lbl = document.getElementById("savedLbl");

  if (!title) {
    alert("Please enter a note title.");
    return;
  }

  const plainText = ED?.innerText.trim() || "";
  if (!plainText) {
    alert("Note content cannot be empty.");
    return;
  }

  if (lbl) lbl.textContent = "Saving…";

  const payload = {
    title,
    content,
    course_id: window.COSCRIBE_NOTE?.courseId || 1,
  };

  const isNew = window.COSCRIBE_NOTE?.isNew;
  const noteId = window.COSCRIBE_NOTE?.noteId;
  const url = isNew ? "/api/notes/" : `/api/notes/${noteId}`;
  const method = isNew ? "POST" : "PUT";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to save note");
    }

    const saved = await res.json();
    if (lbl) lbl.textContent = "Saved just now";

    if (isNew) {
      window.location.href = `/notes/${saved.id}`;
    }
  } catch (err) {
    console.error(err);
    if (lbl) lbl.textContent = "Save failed";
    alert("Could not save note.");
  }
}

/* Delete */
async function deleteNote() {
  const isNew = window.COSCRIBE_NOTE?.isNew;
  const noteId = window.COSCRIBE_NOTE?.noteId;

  if (isNew || !noteId) {
    alert("This note has not been created yet.");
    return;
  }

  const confirmed = window.confirm("Are you sure you want to delete this note?");
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete note");
    }

    window.location.href = "/app";
  } catch (err) {
    console.error(err);
    alert("Could not delete note.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  saveBtn?.addEventListener("click", saveNote);
  deleteBtn?.addEventListener("click", deleteNote);
});