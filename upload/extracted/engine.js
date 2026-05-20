/**
 * engine.js — Core engine: navigasi, skor, modal, timer, confetti, diskusi
 * Misi Penjelajah Pancasila
 */

/* ══════════════════════════════════════════════
   STATE GLOBAL
══════════════════════════════════════════════ */
const S = {
  score: 0,
  missions: new Set(),       // completed mission numbers
  diskusi: {},               // key → true/false
  evalIdx: 0,
  evalScore: 0,
  evalSession: [],
  sila1Found: 0,
  sila3Found: 0,
  sila4Answered: 0,
  activeScene: 's-cover',
};

const PORTO = {}; // key → { label, text, sila }

/* ══════════════════════════════════════════════
   SCENE ORDER (untuk progress bar)
══════════════════════════════════════════════ */
const SCENE_ORDER = [
  's-cover','s-surat','s-tp','s-pengantar','s-pemantik',
  's-map',
  's-sila1','s-sila2','s-sila3','s-sila4','s-sila5',
  's-eval','s-hasil',
  's-perkemahan','s-penutup','s-kredit'
];

const SCENE_LABELS = {
  's-cover':     '📚 Pembelajaran',
  's-surat':     '📜 Surat Misi',
  's-tp':        '🎒 Bekal',
  's-pengantar': '📖 Pengantar',
  's-pemantik':  '🔥 Pemanasan',
  's-map':       '🗺️ Peta Pelayaran',
  's-sila1':     '⭐ Pulau 1',
  's-sila2':     '⛓️ Pulau 2',
  's-sila3':     '🌳 Pulau 3',
  's-sila4':     '🐂 Pulau 4',
  's-sila5':     '🌾 Pulau 5',
  's-eval':      '⛰️ Pendakian',
  's-hasil':     '🏔️ Puncak',
  's-perkemahan':'🏕️ Perkemahan',
  's-penutup':   '📜 Pulang',
  's-kredit':    '📚 Kredit',
};

/* ══════════════════════════════════════════════
   NAVIGASI
══════════════════════════════════════════════ */
function goto(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (!target) { console.warn('Screen tidak ditemukan:', id); return; }
  target.classList.add('active');
  S.activeScene = id;

  // Navbar
  const navbar = document.getElementById('navbar');
  if (navbar) navbar.style.display = id === 's-cover' ? 'none' : 'flex';

  // Progress bar
  const idx = SCENE_ORDER.indexOf(id);
  const pct = idx >= 0 ? Math.round((idx / (SCENE_ORDER.length - 1)) * 100) : 0;
  const bar = document.getElementById('nav-progress-bar');
  if (bar) bar.style.width = pct + '%';
  const lbl = document.getElementById('nav-scene-label');
  if (lbl) lbl.textContent = SCENE_LABELS[id] || '';

  // Reset materi overlay jika ada
  const overlay = target.querySelector('.materi-overlay');
  if (overlay) overlay.classList.remove('slide-up');

  // Scene-specific inits
  if (id === 's-map')      MAP.render();
  if (id === 's-sila1')    HOTSPOT.init(1);
  if (id === 's-sila2')    DND.init(2);
  if (id === 's-sila3')    HOTSPOT.init(3);
  if (id === 's-sila4')    PILGAN.init(4);
  if (id === 's-sila5')    DND.init(5);
  if (id === 's-pemantik') INIT_PEMANTIK.render();
  if (id === 's-pengantar') INIT_PENGANTAR.render();
  if (id === 's-perkemahan') PERKEMAHAN.render();
  if (id === 's-hasil')    HASIL.render();
  if (id === 's-penutup')  PENUTUP.render();
  if (id === 's-kredit')   KREDIT.render();
}

/* ══════════════════════════════════════════════
   SKOR
══════════════════════════════════════════════ */
function addScore(n) {
  S.score += n;
  const el = document.getElementById('navScore');
  if (el) el.textContent = S.score;
  // popup
  const pop = document.createElement('div');
  pop.className = 'score-pop';
  pop.textContent = '+' + n + '!';
  document.getElementById('app').appendChild(pop);
  setTimeout(() => pop.remove(), 1300);
}

/* ══════════════════════════════════════════════
   MODAL FEEDBACK
══════════════════════════════════════════════ */
const MODAL = {
  _cb: null,

  show(title, msg, cb, opts = {}) {
    this._cb = cb || null;
    const icons = {
      ok:    '⭐',
      wrong: '❌',
      info:  '💡',
      done:  '🎉',
      lock:  '🔒',
    };
    const isOk    = opts.type === 'ok'    || /bagus|tepat|benar|hebat|selesai|keren/i.test(title);
    const isWrong = opts.type === 'wrong' || /kurang|salah|oops/i.test(title);
    const isDone  = opts.type === 'done';
    const isLock  = opts.type === 'lock';

    document.getElementById('mf-icon').textContent  = isDone ? icons.done : isWrong ? icons.wrong : isLock ? icons.lock : isOk ? icons.ok : icons.info;
    document.getElementById('mf-title').textContent = title;
    document.getElementById('mf-msg').textContent   = msg;

    const closeBtn = document.getElementById('mf-close');
    closeBtn.textContent = opts.closeLabel || 'Lanjutkan';

    const m = document.getElementById('modal-feedback');
    m.classList.add('open');
    document.getElementById('mf-close').onclick = () => {
      m.classList.remove('open');
      if (this._cb) this._cb();
    };
  },

  close() {
    document.getElementById('modal-feedback')?.classList.remove('open');
  }
};

/* ══════════════════════════════════════════════
   MODAL MISI START
══════════════════════════════════════════════ */
const MISI_MODAL = {
  show(silaNo, cb) {
    const sila = DATA.sila[silaNo - 1];
    document.getElementById('mm-icon').textContent  = sila.emoji;
    document.getElementById('mm-title').textContent = `📍 Pulau Sila ke-${silaNo}`;
    document.getElementById('mm-desc').textContent  = `Kamu tiba di pulau ${sila.nama}. Siap menjelajah?`;

    const m = document.getElementById('modal-misi');
    m.classList.add('open');
    document.getElementById('mm-tunda').onclick = () => m.classList.remove('open');
    document.getElementById('mm-mulai').onclick = () => {
      m.classList.remove('open');
      if (cb) cb();
    };
  }
};

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

/* ══════════════════════════════════════════════
   CONFETTI
══════════════════════════════════════════════ */
function launchConfetti(count = 70) {
  const colors = ['#f4c542','#e63946','#2a9d8f','#457b9d','#6b48ff','#f4762a','#fff','#a8d4e6'];
  const wrap = document.getElementById('confWrap');
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'conf-bit';
    p.style.left   = Math.random() * 100 + '%';
    p.style.width  = (7 + Math.random() * 9) + 'px';
    p.style.height = (9 + Math.random() * 9) + 'px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.borderRadius = Math.random() > .4 ? '50%' : '2px';
    p.style.animationDelay    = Math.random() * 1.8 + 's';
    p.style.animationDuration = (1.8 + Math.random() * .8) + 's';
    wrap.appendChild(p);
    setTimeout(() => p.remove(), 4000);
  }
}

/* ══════════════════════════════════════════════
   TIMER DISKUSI
══════════════════════════════════════════════ */
const TIMER = {
  _intervals: {},

  init(containerId, detik) {
    const c = document.getElementById(containerId);
    if (!c) return;
    c.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost" style="font-size:.65rem;padding:4px 12px;"
          onclick="TIMER.start('${containerId}',${detik})">▶ Timer ${Math.floor(detik/60)} menit</button>
        <span id="${containerId}-disp" style="font-family:var(--font-head);font-size:1.1rem;color:var(--dk);"></span>
      </div>
      <div class="timer-bar-bg" style="margin-top:5px;">
        <div id="${containerId}-bar" class="timer-bar-fill" style="width:100%;background:var(--g);"></div>
      </div>
      <div id="${containerId}-msg" class="small-text muted" style="margin-top:3px;"></div>
    `;
  },

  start(id, total) {
    if (this._intervals[id]) clearInterval(this._intervals[id]);
    let rem = total;
    const tick = () => {
      const disp = document.getElementById(id + '-disp');
      const bar  = document.getElementById(id + '-bar');
      const msg  = document.getElementById(id + '-msg');
      if (!disp) { clearInterval(this._intervals[id]); return; }
      const m = String(Math.floor(rem/60)).padStart(2,'0');
      const s = String(rem % 60).padStart(2,'0');
      disp.textContent = `⏱️ ${m}:${s}`;
      const pct = (rem / total) * 100;
      if (bar) {
        bar.style.width = pct + '%';
        bar.style.background = pct > 60 ? 'var(--g)' : pct > 30 ? 'var(--y)' : 'var(--r)';
      }
      if (rem === 0) {
        clearInterval(this._intervals[id]);
        if (disp) disp.textContent = '✅ Waktu habis!';
        if (msg)  msg.textContent  = 'Simpulkan dan lanjutkan.';
      }
      rem--;
    };
    tick();
    this._intervals[id] = setInterval(tick, 1000);
  }
};

/* ══════════════════════════════════════════════
   DISKUSI & PORTOFOLIO
══════════════════════════════════════════════ */
const DISKUSI = {
  renderPertanyaan() {
    // Render timer untuk diskusi pasca-jelajah
    DATA.diskusi.forEach((d, i) => {
      TIMER.init(`t-diskusi-${i}`, 300); // 5 menit
    });
  }
};

function saveDiskusi(tid, key, label, sila) {
  const val = document.getElementById(tid)?.value?.trim();
  if (!val) {
    MODAL.show('⚠️ Kosong!', 'Tuliskan jawabanmu terlebih dahulu ya!', null, { type: 'info' });
    return;
  }
  const isNew = !S.diskusi[key];
  S.diskusi[key] = true;
  PORTO[key] = { label, text: val, sila: sila || 0 };
  if (isNew) addScore(10);
  const badge = document.getElementById('badge-' + key);
  if (badge) badge.classList.add('show');
}

/* ══════════════════════════════════════════════
   MATERI OVERLAY
══════════════════════════════════════════════ */
function showMateri(silaNo) {
  const overlay = document.getElementById(`mo-sila${silaNo}`);
  if (overlay) overlay.classList.remove('slide-up');
}
function hideMateri(silaNo) {
  const overlay = document.getElementById(`mo-sila${silaNo}`);
  if (overlay) overlay.classList.add('slide-up');
}

/* ══════════════════════════════════════════════
   TAB SWITCHER (generic)
══════════════════════════════════════════════ */
const TABS = {
  _active: {},

  switch(group, idx) {
    this._active[group] = idx;
    // hide/show panes — EXPLICIT style.display untuk override inline display:none
    document.querySelectorAll(`[data-tab-group="${group}"]`).forEach(el => {
      const i = parseInt(el.dataset.tabIdx);
      const isActive = (i === idx);
      el.classList.toggle('active', isActive);
      el.style.display = isActive ? '' : 'none';
    });
    // update buttons
    document.querySelectorAll(`[data-tab-btn="${group}"]`).forEach(el => {
      const i = parseInt(el.dataset.tabBtnIdx);
      el.classList.toggle('active', i === idx);
    });
    // next/prev/finish
    const total = document.querySelectorAll(`[data-tab-group="${group}"]`).length;
    const prev = document.getElementById(`${group}-prev`);
    const next = document.getElementById(`${group}-next`);
    const fin  = document.getElementById(`${group}-fin`);
    if (prev) prev.style.display = idx > 1 ? 'inline-flex' : 'none';
    if (next) next.style.display = idx < total ? 'inline-flex' : 'none';
    if (fin)  fin.style.display  = idx >= total ? 'inline-flex' : 'none';
  },

  next(group) {
    const total = document.querySelectorAll(`[data-tab-group="${group}"]`).length;
    const curr  = this._active[group] || 1;
    if (curr < total) this.switch(group, curr + 1);
  },

  prev(group) {
    const curr = this._active[group] || 1;
    if (curr > 1) this.switch(group, curr - 1);
  },

  init(group) {
    this._active[group] = 1;
    const total = document.querySelectorAll(`[data-tab-group="${group}"]`).length;
    this.switch(group, 1);
  }
};

/* ══════════════════════════════════════════════
   MISSION COMPLETE (with stamp animation)
══════════════════════════════════════════════ */
function finishMission(n) {
  // Show "Jelaskan Alasanmu" box first (TP-4)
  showAlasanPrompt(n);
}

function showAlasanPrompt(silaNo) {
  const sila = DATA.sila[silaNo - 1];
  const app = document.getElementById('app');
  
  // Check if already answered
  const key = `alasan-${silaNo}`;
  if (S.diskusi[key]) {
    // Already answered, go straight to stamp
    doFinishMission(silaNo);
    return;
  }
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.id = 'alasan-modal-' + silaNo;
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:min(92%,560px);">
      <div class="modal-icon">${sila.emoji}</div>
      <div class="modal-title">Jelaskan Alasanmu 💬</div>
      <div class="modal-msg" style="text-align:left;margin-bottom:10px;">${sila.tantangan.alasan || 'Pilih 1 perilaku dari tantangan tadi dan jelaskan mengapa itu sesuai/tidak sesuai dengan nilai Pancasila!'}</div>
      <textarea id="alasan-${silaNo}" rows="3" placeholder="Tuliskan alasanmu di sini..." style="width:100%;border-radius:12px;padding:10px;border:1.5px solid var(--border);font-family:var(--font-body);font-size:.82rem;resize:none;"></textarea>
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:8px;">
        <span class="saved-badge" id="badge-alasan-${silaNo}">✅ Tersimpan</span>
        <button class="btn btn-primary" style="font-size:.7rem;padding:5px 16px;" onclick="doSaveAlasan(${silaNo})">Simpan & Selesai</button>
      </div>
    </div>
  `;
  app.appendChild(overlay);
}

function doSaveAlasan(silaNo) {
  saveAlasan(silaNo);
  // Remove modal
  const modal = document.getElementById('alasan-modal-' + silaNo);
  if (modal) modal.remove();
  // Proceed to stamp
  doFinishMission(silaNo);
}

function doFinishMission(n) {
  S.missions.add(n);
  const sila = DATA.sila[n - 1];

  // Show stamp animation
  showStampAnimation(n, sila, () => {
    MODAL.show(`Pulau ${n} Selesai! 🎉`, `Kamu telah menyelesaikan Pulau Sila ke-${n}: "${sila.nama}". Lanjutkan pelayaranmu!`, () => {
      MAP.render();
      goto('s-map');
    }, { type: 'done' });
  });
}

function showStampAnimation(silaNo, sila, callback) {
  const app = document.getElementById('app');
  const overlay = document.createElement('div');
  overlay.className = 'stamp-overlay';
  const mark = document.createElement('div');
  mark.className = 'stamp-mark';
  mark.style.borderColor = sila.warna;
  mark.style.color = sila.warna;
  mark.innerHTML = `<span style="font-size:clamp(1.4rem,3vw,2.4rem);">${sila.emoji}</span><span style="font-size:clamp(.6rem,1.2vw,.9rem);">SILA ${silaNo} ✓</span>`;
  overlay.appendChild(mark);

  // Add sparkle particles burst
  const sparkColors = ['#f4c542','#fff','#2a9d8f','#e63946','#457b9d', sila.warna];
  for (let i = 0; i < 18; i++) {
    const sp = document.createElement('div');
    sp.className = 'stamp-sparkle';
    const angle = (Math.PI * 2 / 18) * i + Math.random() * 0.3;
    const dist = 40 + Math.random() * 60;
    sp.style.setProperty('--sx', `${Math.cos(angle) * dist}px`);
    sp.style.setProperty('--sy', `${Math.sin(angle) * dist}px`);
    sp.style.left = '50%';
    sp.style.top = '50%';
    sp.style.background = sparkColors[Math.floor(Math.random() * sparkColors.length)];
    sp.style.width = (4 + Math.random() * 5) + 'px';
    sp.style.height = sp.style.width;
    sp.style.animationDelay = (Math.random() * .2) + 's';
    overlay.appendChild(sp);
  }

  app.appendChild(overlay);
  launchConfetti(50);

  setTimeout(() => {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.remove();
      if (callback) callback();
    }, 500);
  }, 1500);
}

/* ══════════════════════════════════════════════
   RESET SEMUA
══════════════════════════════════════════════ */
function resetAll() {
  S.score = 0;
  S.missions.clear();
  S.diskusi = {};
  S.evalIdx = 0;
  S.evalScore = 0;
  S.evalSession = [];
  S.sila1Found = 0;
  S.sila3Found = 0;
  S.sila4Answered = 0;

  for (const k in PORTO) delete PORTO[k];

  // Reset navScore
  const ns = document.getElementById('navScore');
  if (ns) ns.textContent = '0';

  // Reset hotspot buttons
  document.querySelectorAll('.hs-btn').forEach(b => {
    b.classList.remove('correct','wrong');
    b.disabled = false;
    b.style.pointerEvents = '';
  });
  // Reset counters
  ['s1','s2','s3','s5'].forEach(s => {
    const el = document.getElementById(`ctr-${s}`);
    if (el) el.textContent = s==='s2'||s==='s5' ? '0/6' : '0/3';
  });
  const c4 = document.getElementById('ctr-s4');
  if (c4) c4.textContent = '0/4';

  // Reset done buttons
  [1,2,3,4,5].forEach(n => {
    const b = document.getElementById(`btn-done-${n}`);
    if (b) { b.disabled = true; }
  });

  // Reset quiz options
  document.querySelectorAll('.quiz-opt').forEach(b => {
    b.classList.remove('correct','wrong');
    b.disabled = false;
    b.style.background = '';
    b.style.borderColor = '';
  });

  // Reset textareas & badges
  document.querySelectorAll('textarea').forEach(t => t.value = '');
  document.querySelectorAll('.saved-badge').forEach(b => b.classList.remove('show'));

  // Re-init DnD
  DND.init(2);
  DND.init(5);

  goto('s-cover');
}

/* ══════════════════════════════════════════════
   CP TAB SWITCHER (simple, for s-cp screen)
══════════════════════════════════════════════ */
function switchCPTab(id) {
  ['cp','tp','atp'].forEach(t => {
    const btn = document.getElementById(`cp-btn-${t}`);
    const pane = document.getElementById(`cp-pane-${t}`);
    if (btn) {
      btn.classList.toggle('active', t === id);
      if (t === id) {
        btn.style.background = 'rgba(255,255,255,.12)';
        btn.style.color = '#fff';
      } else {
        btn.style.background = 'rgba(255,255,255,.06)';
        btn.style.color = 'rgba(255,255,255,.65)';
      }
    }
    if (pane) {
      if (t === id) {
        pane.classList.add('active');
        pane.style.display = '';
      } else {
        pane.classList.remove('active');
        pane.style.display = 'none';
      }
    }
  });
}

/* ══════════════════════════════════════════════
   DISKUSI TAB SWITCHER
══════════════════════════════════════════════ */
function switchDiskusiTab(idx) {
  const total = DATA.diskusi.length;
  for (let i = 1; i <= total; i++) {
    const btn = document.getElementById(`dk-btn-${i}`);
    const pane = document.getElementById(`dk-pane-${i}`);
    if (!btn || !pane) continue;

    const d = DATA.diskusi[i - 1];
    if (i === idx) {
      btn.classList.add('active');
      btn.style.background = d.warna;
      btn.style.color = '#fff';
      btn.style.boxShadow = `0 3px 10px ${d.warna}55`;
      pane.classList.add('active');
      pane.style.display = '';
    } else {
      btn.classList.remove('active');
      btn.style.background = 'rgba(44,24,16,.06)';
      btn.style.color = 'var(--muted)';
      btn.style.boxShadow = 'none';
      pane.classList.remove('active');
      pane.style.display = 'none';
    }
  }
  DISKUSI_FULL._activeTab = idx;
}

/* ══════════════════════════════════════════════
   TUGAS MANDIRI TAB SWITCHER
══════════════════════════════════════════════ */
function switchTugasTab(idx) {
  [1, 2, 3].forEach(i => {
    const btn = document.getElementById(`tm-btn-${i}`);
    const pane = document.getElementById(`tm-pane-${i}`);
    if (!btn || !pane) return;

    if (i === idx) {
      btn.classList.add('active');
      btn.style.background = i === 3 ? 'var(--g)' : 'var(--r)';
      btn.style.color = '#fff';
      btn.style.boxShadow = i === 3
        ? '0 3px 10px rgba(42,157,143,.35)'
        : '0 3px 10px rgba(230,57,70,.35)';
      pane.classList.add('active');
      pane.style.display = '';
    } else {
      btn.classList.remove('active');
      btn.style.background = 'rgba(44,24,16,.06)';
      btn.style.color = 'var(--muted)';
      btn.style.boxShadow = 'none';
      pane.classList.remove('active');
      pane.style.display = 'none';
    }
  });
}

/* ══════════════════════════════════════════════
   SAVE TUGAS MANDIRI
══════════════════════════════════════════════ */
function saveTugasMandiri(tid, key, label, sila) {
  const val = document.getElementById(tid)?.value?.trim();
  if (!val) {
    MODAL.show('⚠️ Kosong!', 'Tuliskan jawabanmu terlebih dahulu ya!', null, { type: 'info' });
    return;
  }
  const isNew = !S.diskusi[key];
  S.diskusi[key] = true;
  PORTO[key] = { label, text: val, sila: sila || 0 };
  if (isNew) addScore(10);
  const badge = document.getElementById('badge-' + key);
  if (badge) badge.classList.add('show');
}

/* ══════════════════════════════════════════════
   SAVE URAIAN (TP-2: Menguraikan)
══════════════════════════════════════════════ */
function saveUraian(silaNo) {
  const tid = `uraian-${silaNo}`;
  const val = document.getElementById(tid)?.value?.trim();
  if (!val || val.length < 20) {
    MODAL.show('⚠️ Terlalu Singkat!', 'Tuliskan uraian minimal 20 kata ya! Gunakan kata-katamu sendiri.', null, { type: 'info' });
    return;
  }
  const sila = DATA.sila[silaNo - 1];
  const key = `uraian-${silaNo}`;
  const isNew = !S.diskusi[key];
  S.diskusi[key] = true;
  PORTO[key] = { label: `Uraian Sila ${silaNo}: ${sila.nilai}`, text: val, sila: silaNo };
  if (isNew) addScore(15);
  const badge = document.getElementById(`badge-uraian-${silaNo}`);
  if (badge) badge.classList.add('show');
}

/* ══════════════════════════════════════════════
   SAVE IDENTIFIKASI (TP-3: Mengidentifikasi dari Kehidupan)
══════════════════════════════════════════════ */
function saveIdentifikasi(silaNo) {
  const tid = `identifikasi-${silaNo}`;
  const val = document.getElementById(tid)?.value?.trim();
  if (!val) {
    MODAL.show('⚠️ Kosong!', 'Ceritakan 1 contoh penerapan dari kehidupanmu!', null, { type: 'info' });
    return;
  }
  const sila = DATA.sila[silaNo - 1];
  const key = `identifikasi-${silaNo}`;
  const isNew = !S.diskusi[key];
  S.diskusi[key] = true;
  PORTO[key] = { label: `Identifikasi Sila ${silaNo}: ${sila.nilai}`, text: val, sila: silaNo };
  if (isNew) addScore(15);
  const badge = document.getElementById(`badge-identifikasi-${silaNo}`);
  if (badge) badge.classList.add('show');
}

/* ══════════════════════════════════════════════
   SAVE ALASAN (TP-4: Membedakan + Memberi Alasan)
══════════════════════════════════════════════ */
function saveAlasan(silaNo) {
  const tid = `alasan-${silaNo}`;
  const val = document.getElementById(tid)?.value?.trim();
  if (!val) {
    MODAL.show('⚠️ Kosong!', 'Jelaskan alasanmu terlebih dahulu!', null, { type: 'info' });
    return;
  }
  const sila = DATA.sila[silaNo - 1];
  const key = `alasan-${silaNo}`;
  const isNew = !S.diskusi[key];
  S.diskusi[key] = true;
  PORTO[key] = { label: `Alasan Sila ${silaNo}: ${sila.nilai}`, text: val, sila: silaNo };
  if (isNew) addScore(10);
  const badge = document.getElementById(`badge-alasan-${silaNo}`);
  if (badge) badge.classList.add('show');
}

/* ══════════════════════════════════════════════
   PERKEMAHAN TAB SWITCHER
══════════════════════════════════════════════ */
function switchPerkemahanTab(tab) {
  const btnApi = document.getElementById('pk-btn-api');
  const btnJurnal = document.getElementById('pk-btn-jurnal');
  const paneApi = document.getElementById('pk-pane-api');
  const paneJurnal = document.getElementById('pk-pane-jurnal');
  if (tab === 'api') {
    btnApi.classList.add('active'); btnApi.style.background='var(--o)'; btnApi.style.color='#fff'; btnApi.style.boxShadow='0 3px 10px rgba(244,118,42,.35)';
    btnJurnal.classList.remove('active'); btnJurnal.style.background='rgba(255,255,255,.06)'; btnJurnal.style.color='rgba(255,255,255,.65)'; btnJurnal.style.boxShadow='none';
    paneApi.classList.add('active'); paneApi.style.display='';
    paneJurnal.classList.remove('active'); paneJurnal.style.display='none';
  } else {
    btnJurnal.classList.add('active'); btnJurnal.style.background='var(--p)'; btnJurnal.style.color='#fff'; btnJurnal.style.boxShadow='0 3px 10px rgba(107,72,255,.35)';
    btnApi.classList.remove('active'); btnApi.style.background='rgba(255,255,255,.06)'; btnApi.style.color='rgba(255,255,255,.65)'; btnApi.style.boxShadow='none';
    paneJurnal.classList.add('active'); paneJurnal.style.display='';
    paneApi.classList.remove('active'); paneApi.style.display='none';
  }
}

/* ══════════════════════════════════════════════
   INIT ON LOAD — moved to init.js
══════════════════════════════════════════════ */
