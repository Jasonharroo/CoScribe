/* ═══════════════════════════════════════════════════
   COSCRIBE  ·  notes.js  v3
   app/static/js/notes.js
═══════════════════════════════════════════════════ */

const APP = document.getElementById('csApp');
const ED  = document.getElementById('content');

/* ── THEME ── */
(function(){ if(localStorage.getItem('cs-theme')==='dark') APP.setAttribute('data-theme','dark'); })();
document.getElementById('themeBtn').addEventListener('click',()=>{
  const d=APP.getAttribute('data-theme')==='dark';
  d?APP.removeAttribute('data-theme'):APP.setAttribute('data-theme','dark');
  localStorage.setItem('cs-theme',d?'light':'dark');
});

/* ── FONT PRESETS ── */
const FONT_PRESETS = [
  { name:'Montserrat',   font:"'Montserrat',sans-serif" },
  { name:'Poppins',      font:"'Poppins',sans-serif" },
  { name:'Nunito',       font:"'Nunito',sans-serif" },
  { name:'Raleway',      font:"'Raleway',sans-serif" },
  { name:'Space Grotesk',font:"'Space Grotesk',sans-serif" },
  { name:'Lora (serif)', font:"'Lora',serif" },
];
let fontIdx = parseInt(localStorage.getItem('cs-font-idx')||'0');

function applyFontPreset(idx){
  const p = FONT_PRESETS[idx];
  APP.style.setProperty('--font', p.font);
  ED.style.fontFamily = p.font;
  document.getElementById('noteTitle').style.fontFamily = p.font;
  const label = document.getElementById('fontPresetLabel');
  if(label) label.textContent = p.name;
  localStorage.setItem('cs-font-idx', idx);
}
applyFontPreset(fontIdx);

document.getElementById('fontPresetBtn').addEventListener('click',()=>{
  fontIdx = (fontIdx + 1) % FONT_PRESETS.length;
  applyFontPreset(fontIdx);
  showToast(`Font: ${FONT_PRESETS[fontIdx].name}`);
});

function showToast(msg){
  let t=document.getElementById('cs-toast');
  if(!t){
    t=document.createElement('div'); t.id='cs-toast';
    t.style.cssText='position:fixed;top:68px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:7px 18px;border-radius:999px;font-size:.76rem;font-weight:700;z-index:9998;box-shadow:0 4px 20px rgba(0,0,0,.25);transition:opacity .2s;pointer-events:none;font-family:var(--font)';
    document.body.appendChild(t);
  }
  t.textContent=msg; t.style.opacity='1';
  clearTimeout(t._t); t._t=setTimeout(()=>t.style.opacity='0',1800);
}

/* ── PANELS ── */
const cPanel=document.getElementById('coursesPanel');
const nPanel=document.getElementById('notesPanel');
let pState=0;

function setPanels(s){
  pState=s;
  const W=getComputedStyle(document.documentElement).getPropertyValue('--panel-w').trim();
  if(s===0){cPanel.classList.remove('open');nPanel.classList.remove('open');nPanel.style.left='0';}
  else if(s===1){cPanel.classList.add('open');nPanel.classList.add('open');nPanel.style.left=W;}
  else if(s===2){cPanel.classList.remove('open');nPanel.classList.add('open');nPanel.style.left='0';}
}

document.getElementById('panelToggle').addEventListener('click',()=>setPanels(pState===0?1:pState===1?2:0));
document.getElementById('closeCoursesBtn').addEventListener('click',()=>{cPanel.classList.remove('open');nPanel.style.left='0';pState=nPanel.classList.contains('open')?2:0;});
document.getElementById('closeNotesBtn').addEventListener('click',()=>{nPanel.classList.remove('open');cPanel.classList.remove('open');nPanel.style.left='0';pState=0;});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='\\'){e.preventDefault();setPanels(pState===0?1:pState===1?2:0);}});

/* ── FLOAT NAV ── */
const floatNav=document.getElementById('floatNav');
const showNavBtn=document.getElementById('showNavBtn');
if(localStorage.getItem('cs-nav-hidden')==='1'){floatNav.classList.add('hidden');showNavBtn.classList.add('visible');}
document.getElementById('hideNavBtn').addEventListener('click',()=>{floatNav.classList.add('hidden');showNavBtn.classList.add('visible');localStorage.setItem('cs-nav-hidden','1');});
showNavBtn.addEventListener('click',()=>{floatNav.classList.remove('hidden');showNavBtn.classList.remove('visible');localStorage.setItem('cs-nav-hidden','0');});
document.querySelectorAll('.float-nav-item').forEach(item=>{
  item.addEventListener('click',()=>{document.querySelectorAll('.float-nav-item').forEach(i=>i.classList.remove('active'));item.classList.add('active');});
});

/* ── TOOLBAR SYNC ── */
const TB_MAP={'btn-bold':'bold','btn-italic':'italic','btn-underline':'underline','btn-strike':'strikeThrough'};
function syncTB(){for(const[id,c] of Object.entries(TB_MAP)){const el=document.getElementById(id);if(el)el.classList.toggle('on',document.queryCommandState(c));}}
document.addEventListener('selectionchange',syncTB);

function execCmd(c,v=null){ED.focus();document.execCommand(c,false,v);syncTB();}

function toggleBlock(tag){
  ED.focus();
  const sel=window.getSelection();if(!sel.rangeCount)return;
  const anc=sel.getRangeAt(0).commonAncestorContainer;
  const par=anc.nodeType===3?anc.parentElement:anc;
  document.execCommand('formatBlock',false,par.closest(tag)?'p':tag);
}

function toggleQuote(){
  ED.focus();
  const sel=window.getSelection();if(!sel.rangeCount)return;
  const anc=sel.getRangeAt(0).commonAncestorContainer;
  const par=anc.nodeType===3?anc.parentElement:anc;
  document.execCommand('formatBlock',false,par.closest('blockquote')?'p':'blockquote');
}

function toggleCode(){
  const sel=window.getSelection();if(!sel.rangeCount)return;
  const range=sel.getRangeAt(0);
  const anc=range.commonAncestorContainer;
  const par=anc.nodeType===3?anc.parentElement:anc;
  const c=par.closest('code');
  if(c){c.replaceWith(document.createTextNode(c.textContent));return;}
  const t=range.toString();if(!t)return;
  const code=document.createElement('code');code.textContent=t;
  range.deleteContents();range.insertNode(code);sel.removeAllRanges();
}

/* Button wiring */
document.getElementById('btn-bold')     .addEventListener('click',()=>execCmd('bold'));
document.getElementById('btn-italic')   .addEventListener('click',()=>execCmd('italic'));
document.getElementById('btn-underline').addEventListener('click',()=>execCmd('underline'));
document.getElementById('btn-strike')   .addEventListener('click',()=>execCmd('strikeThrough'));
document.getElementById('btn-h1')       .addEventListener('click',()=>toggleBlock('h2'));
document.getElementById('btn-h2')       .addEventListener('click',()=>toggleBlock('h3'));
document.getElementById('btn-p')        .addEventListener('click',()=>execCmd('formatBlock','p'));
document.getElementById('btn-ul')       .addEventListener('click',()=>execCmd('insertUnorderedList'));
document.getElementById('btn-ol')       .addEventListener('click',()=>execCmd('insertOrderedList'));
document.getElementById('btn-quote')    .addEventListener('click',toggleQuote);
document.getElementById('btn-code')     .addEventListener('click',toggleCode);
document.getElementById('btn-left')     .addEventListener('click',()=>execCmd('justifyLeft'));
document.getElementById('btn-center')   .addEventListener('click',()=>execCmd('justifyCenter'));
document.getElementById('btn-right')    .addEventListener('click',()=>execCmd('justifyRight'));
document.getElementById('btn-undo')     .addEventListener('click',()=>execCmd('undo'));
document.getElementById('btn-redo')     .addEventListener('click',()=>execCmd('redo'));

/* Keyboard shortcuts */
ED.addEventListener('keydown',e=>{
  const ctrl=e.ctrlKey||e.metaKey;if(!ctrl)return;
  const m={'e':'justifyCenter','l':'justifyLeft','r':'justifyRight','j':'justifyFull'};
  if(m[e.key.toLowerCase()]){e.preventDefault();execCmd(m[e.key.toLowerCase()]);}
});

/* ── HIGHLIGHT ── */
const hlBtn=document.getElementById('hlBtn'),hlPicker=document.getElementById('hlPicker'),hlSwatch=document.getElementById('hlSwatch');
hlBtn.addEventListener('click',e=>{e.stopPropagation();hlPicker.classList.toggle('open');});
document.addEventListener('click',e=>{if(!hlBtn.contains(e.target))hlPicker.classList.remove('open');});
function applyHL(c){ED.focus();if(!c)document.execCommand('removeFormat');else{document.execCommand('hiliteColor',false,c);hlSwatch.style.background=c;}hlPicker.classList.remove('open');}

/* ── FONT PICKER (per-note override) ── */
document.getElementById('fontPicker').addEventListener('change',function(){
  ED.style.fontFamily=this.value;
  document.getElementById('noteTitle').style.fontFamily=this.value;
});

/* ── IMAGE ── */
document.getElementById('btn-img').addEventListener('click',()=>document.getElementById('imgFile').click());
document.getElementById('imgFile').addEventListener('change',function(){
  const f=this.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{ED.focus();const img=document.createElement('img');img.src=ev.target.result;img.style.maxWidth='100%';const sel=window.getSelection();if(sel.rangeCount){const rr=sel.getRangeAt(0);rr.collapse(false);rr.insertNode(img);}else ED.appendChild(img);};
  r.readAsDataURL(f);this.value='';
});

/* ── TITLE SYNC ── */
const titleInput=document.getElementById('noteTitle'),navTitle=document.getElementById('navTitle');
titleInput.addEventListener('input',function(){navTitle.textContent=this.value||'Untitled Note';});
navTitle.textContent=titleInput.value||'Untitled Note';

/* ── AUTOSAVE ── */
let saveTimer=null;
function triggerSave(){const l=document.getElementById('savedLbl');l.textContent='Saving…';clearTimeout(saveTimer);saveTimer=setTimeout(()=>l.textContent='Saved just now',1200);}
ED.addEventListener('input',triggerSave);
titleInput.addEventListener('input',triggerSave);

/* ── RECORDING ── */
let recOn=false,recInterval=null,recSecs=0,mRec=null,chunks=[];
async function startRec(){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    mRec=new MediaRecorder(stream);chunks=[];
    mRec.ondataavailable=e=>chunks.push(e.data);
    mRec.onstop=()=>{addClip(new Blob(chunks,{type:'audio/webm'}),recSecs);stream.getTracks().forEach(t=>t.stop());};
    mRec.start();recOn=true;
    document.getElementById('recBtn').classList.add('on');
    document.getElementById('recLabel').textContent='Recording…';
    document.getElementById('recOverlay').classList.add('open');
    recSecs=0;
    recInterval=setInterval(()=>{recSecs++;const m=Math.floor(recSecs/60),s=recSecs%60;document.getElementById('recTime').textContent=`${m}:${s.toString().padStart(2,'0')}`;},1000);
  }catch{alert('Microphone access denied.');}
}
function stopRec(){recOn=false;if(mRec)mRec.stop();clearInterval(recInterval);document.getElementById('recBtn').classList.remove('on');document.getElementById('recLabel').textContent='Record';document.getElementById('recOverlay').classList.remove('open');}
document.getElementById('recBtn').addEventListener('click',()=>recOn?stopRec():startRec());
document.getElementById('recStop').addEventListener('click',stopRec);

function addClip(blob,dur){
  const url=URL.createObjectURL(blob);const m=Math.floor(dur/60),s=dur%60;
  const item=document.createElement('div');item.className='cs-audio-item';
  const pb=document.createElement('button');pb.className='cs-play';pb.textContent='▶';
  const wv=document.createElement('div');wv.className='cs-wave';genWave(wv);
  const du=document.createElement('span');du.className='cs-dur-label';du.textContent=`${m}:${s.toString().padStart(2,'0')}`;
  const au=new Audio(url);
  pb.addEventListener('click',()=>{if(au.paused){au.play();pb.textContent='⏸';}else{au.pause();pb.textContent='▶';}au.onended=()=>pb.textContent='▶';});
  item.append(pb,wv,du);document.getElementById('audioList').appendChild(item);
}

/* ── WAVEFORM ── */
function genWave(el,n=36){el.innerHTML='';for(let i=0;i<n;i++){const b=document.createElement('div');b.className='cs-wbar';b.style.height=(4+Math.random()*20)+'px';el.appendChild(b);}}
document.querySelectorAll('.cs-wave').forEach(genWave);
function togglePlay(btn){btn.textContent=btn.textContent==='▶'?'⏸':'▶';}

/* ── COURSE ITEMS ── */
document.querySelectorAll('.cs-ci').forEach(item=>{
  item.addEventListener('click',()=>{
    document.querySelectorAll('.cs-ci').forEach(i=>{i.classList.remove('active');i.querySelector('.cs-badge')?.classList.remove('red');});
    item.classList.add('active');item.querySelector('.cs-badge')?.classList.add('red');
  });
});

/* ── NOTE CARDS ── */
document.querySelectorAll('.cs-nc').forEach(card=>{
  card.addEventListener('click',()=>{
    document.querySelectorAll('.cs-nc').forEach(c=>c.classList.remove('active'));
    card.classList.add('active');
    const t=card.querySelector('.cs-nc-title').textContent;
    titleInput.value=t;navTitle.textContent=t;
    if(window.innerWidth<=768)setPanels(0);
  });
});

/* ── COURSE SEARCH ── */
document.getElementById('courseSearch').addEventListener('input',function(){
  const q=this.value.toLowerCase();
  document.querySelectorAll('.cs-ci').forEach(i=>{i.style.display=i.textContent.toLowerCase().includes(q)?'':'none';});
});
