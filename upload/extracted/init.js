/**
 * init.js — Initialization, EVAL, HASIL, FLASH, REFLEKSI, PERKEMAHAN, PENUTUP, kredit
 * Misi Penjelajah Pancasila
 */

/* ══════════════════════════════════════════════
   DOMContentLoaded INIT
══════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  // Render CP/TP/ATP content
  INIT_CP.render();

  // Render pemantik
  INIT_PEMANTIK.render();

  // Init all tab groups
  ['s1m','s2m','s3m','s4m','s5m'].forEach(g => TABS.init(g));

  // Populate materi content for all sila
  for (let i = 1; i <= 5; i++) {
    INIT_MATERI.render(i);
  }

  // Start at cover
  goto('s-cover');
});

/* ══════════════════════════════════════════════
   INIT_CP — Capaian & Tujuan Pembelajaran
══════════════════════════════════════════════ */
const INIT_CP = {
  render() {
    // CP text
    const cpText = document.getElementById('cp-text-render');
    if (cpText) cpText.innerHTML = DATA.cp;

    // PPL chips
    const pplChips = document.getElementById('ppl-chips');
    if (pplChips) {
      pplChips.innerHTML = '';
      DATA.meta.ppl.forEach(p => {
        const chip = document.createElement('span');
        chip.className = 'cover-chip';
        chip.style.background = 'rgba(244,197,66,.12)';
        chip.style.border = '1px solid rgba(244,197,66,.25)';
        chip.textContent = p;
        pplChips.appendChild(chip);
      });
    }

    // TP list
    const tpList = document.getElementById('tp-list');
    if (tpList) {
      tpList.innerHTML = '';
      DATA.tp.forEach(t => {
        const item = document.createElement('div');
        item.className = 'card card-p mb-xs flex-row gap-sm items-center';
        item.style.background = t.fokus ? 'rgba(244,197,66,.07)' : 'rgba(255,255,255,.04)';
        item.style.borderColor = t.fokus ? 'rgba(244,197,66,.2)' : 'rgba(255,255,255,.08)';
        item.innerHTML = `
          <div style="flex-shrink:0;text-align:center;min-width:60px;">
            <div style="font-family:var(--font-head);font-size:clamp(.58rem,1vw,.72rem);color:var(--y);">${t.id}</div>
            <div style="font-size:clamp(.48rem,.82vw,.6rem);background:rgba(255,255,255,.1);border-radius:6px;padding:2px 6px;color:rgba(255,255,255,.6);margin-top:2px;">${t.level}</div>
          </div>
          <div>
            <div style="font-weight:900;color:#fff;font-size:clamp(.64rem,1.1vw,.8rem);">${t.kata}</div>
            <div style="font-size:clamp(.58rem,1vw,.72rem);color:rgba(255,255,255,.7);line-height:1.5;">${t.desc}</div>
          </div>
          ${t.fokus ? '<div style="flex-shrink:0;background:var(--y);color:var(--dk);border-radius:99px;padding:2px 8px;font-size:.55rem;font-weight:900;">FOKUS</div>' : ''}
        `;
        tpList.appendChild(item);
      });
    }

    // ATP list
    const atpList = document.getElementById('atp-list');
    if (atpList) {
      atpList.innerHTML = '';
      DATA.atp.forEach(a => {
        const item = document.createElement('div');
        item.className = 'atp-item' + (a.status === 'active' ? ' atp-active' : '');
        const dotColor = a.status === 'done' ? 'var(--g)' : a.status === 'active' ? 'var(--c)' : 'rgba(255,255,255,.3)';
        item.innerHTML = `
          <div class="atp-dot" style="background:${dotColor};"></div>
          <div style="flex:1;">
            <div style="font-weight:900;">${a.no}. ${a.judul}</div>
            <div class="small-text muted">TP: ${a.tp.join(', ')} · ${a.waktu}</div>
          </div>
          <div style="font-size:.6rem;font-weight:900;color:${a.status === 'done' ? 'var(--g)' : a.status === 'active' ? 'var(--c)' : 'var(--muted)'};">
            ${a.status === 'done' ? '✅' : a.status === 'active' ? '📍 Aktif' : '⏳'}
          </div>
        `;
        atpList.appendChild(item);
      });
    }

    // Alur kegiatan
    const alurRender = document.getElementById('alur-render');
    if (alurRender) {
      alurRender.innerHTML = '';
      DATA.alurKegiatan.forEach(a => {
        const col = document.createElement('div');
        col.style.cssText = 'text-align:center;background:rgba(42,157,143,.08);border-radius:10px;padding:8px 4px;border:1px solid rgba(42,157,143,.15);';
        col.innerHTML = `
          <div style="font-size:clamp(.8rem,1.8vw,1.3rem);">${a.emoji}</div>
          <div style="font-weight:900;font-size:clamp(.5rem,.9vw,.65rem);color:var(--g);margin-top:3px;">${a.label}</div>
          <div style="font-size:clamp(.45rem,.78vw,.58rem);color:var(--muted);">${a.waktu}</div>
        `;
        alurRender.appendChild(col);
      });
    }
  }
};

/* ══════════════════════════════════════════════
   INIT_PEMANTIK — Pertanyaan Pemantik
══════════════════════════════════════════════ */
const INIT_PEMANTIK = {
  render() {
    // Populate question text for Tab 1 and Tab 2
    if (DATA.pemantik.length >= 1) {
      const q1 = document.getElementById('tm-q1');
      if (q1) q1.innerHTML = DATA.pemantik[0].q + `<div class="small-text muted" style="margin-top:6px;padding:6px 10px;background:rgba(244,197,66,.06);border-radius:10px;border:1px solid rgba(244,197,66,.15);">💡 ${DATA.pemantik[0].petunjuk}</div>`;
    }
    if (DATA.pemantik.length >= 2) {
      const q2 = document.getElementById('tm-q2');
      if (q2) q2.innerHTML = DATA.pemantik[1].q + `<div class="small-text muted" style="margin-top:6px;padding:6px 10px;background:rgba(244,197,66,.06);border-radius:10px;border:1px solid rgba(244,197,66,.15);">💡 ${DATA.pemantik[1].petunjuk}</div>`;
    }

    // Set placeholders from data
    const ans1 = document.getElementById('tm-ans1');
    if (ans1 && DATA.pemantik[0]) ans1.placeholder = DATA.pemantik[0].petunjuk || 'Tuliskan jawabanmu di sini...';
    const ans2 = document.getElementById('tm-ans2');
    if (ans2 && DATA.pemantik[1]) ans2.placeholder = DATA.pemantik[1].petunjuk || 'Tuliskan jawabanmu di sini...';
  }
};

/* ══════════════════════════════════════════════
   INIT_PENGANTAR — Pengantar: Apa Itu Nilai Pancasila
══════════════════════════════════════════════ */
const INIT_PENGANTAR = {
  render() {
    const pg = DATA.pengantar;
    if (!pg) return;

    // Recap
    const recapEl = document.getElementById('pg-recap');
    if (recapEl) recapEl.innerHTML = pg.recap;

    // Jembatan question
    const jembatanEl = document.getElementById('pg-jembatan');
    if (jembatanEl) jembatanEl.innerHTML = pg.jembatan;

    // Definisi
    const defEl = document.getElementById('pg-definisi');
    if (defEl) defEl.innerHTML = pg.definisi;

    // 3 Dimensi
    const dimEl = document.getElementById('pg-dimensi');
    if (dimEl) {
      dimEl.innerHTML = '';
      pg.tigaDimensi.forEach(d => {
        const col = document.createElement('div');
        col.style.cssText = `text-align:center;background:rgba(255,255,255,.06);border-radius:12px;padding:10px 6px;border:1.5px solid rgba(255,255,255,.1);`;
        col.innerHTML = `
          <div style="font-size:clamp(1.2rem,2.5vw,1.8rem);">${d.emoji}</div>
          <div style="font-weight:900;font-size:clamp(.56rem,1vw,.7rem);color:${d.warna};margin-top:3px;">${d.zona}</div>
          <div style="font-size:clamp(.48rem,.82vw,.6rem);color:rgba(255,255,255,.6);margin-top:2px;">${d.desc}</div>
        `;
        dimEl.appendChild(col);
      });
    }

    // Jembatan Sila
    const jsEl = document.getElementById('pg-jembatanSila');
    if (jsEl) {
      jsEl.innerHTML = '';
      pg.jembatanSila.forEach(j => {
        const silaColors = { 1:'#1a5276', 2:'#922b21', 3:'#1e8449', 4:'#784212', 5:'#b7950b' };
        const silaEmojis = { 1:'⭐', 2:'⛓️', 3:'🌳', 4:'🐂', 5:'🌾' };
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border-radius:10px;padding:8px 10px;border:1px solid rgba(255,255,255,.08);';
        row.innerHTML = `
          <span style="font-size:clamp(.8rem,1.6vw,1.2rem);">${silaEmojis[j.dari]}</span>
          <span style="color:var(--p);font-size:clamp(.7rem,1.3vw,.9rem);">→</span>
          <span style="font-size:clamp(.8rem,1.6vw,1.2rem);">${silaEmojis[j.ke]}</span>
          <span style="font-size:clamp(.58rem,1vw,.72rem);color:rgba(255,255,255,.8);line-height:1.4;">${j.teks}</span>
        `;
        jsEl.appendChild(row);
      });
    }
  }
};

/* ══════════════════════════════════════════════
   INIT_MATERI — Isi konten materi per sila
══════════════════════════════════════════════ */
const INIT_MATERI = {
  render(silaNo) {
    const sila = DATA.sila[silaNo - 1];
    if (!sila || !sila.tabs) return;

    sila.tabs.forEach((tab, i) => {
      const contentEl = document.getElementById(`s${silaNo}-tab${i + 1}-content`);
      if (contentEl) contentEl.innerHTML = tab.isi;
    });
  }
};

/* ══════════════════════════════════════════════
   EVAL — Pendakian Akhir (5 soal acak dari bank 10)
══════════════════════════════════════════════ */
const EVAL = {
  _idx: 0,
  _score: 0,
  _session: [],

  start() {
    // Check if all missions done
    if (S.missions.size < 5) {
      MODAL.show('🔒 Belum Bisa Pendakian', `Selesaikan semua 5 pulau terlebih dahulu! Progress: ${S.missions.size}/5`, null, { type: 'lock' });
      return;
    }

    // Pick 5 random from bank
    const bank = [...DATA.evaluasi];
    const picked = [];
    while (picked.length < 5 && bank.length > 0) {
      const idx = Math.floor(Math.random() * bank.length);
      picked.push(bank.splice(idx, 1)[0]);
    }

    this._session = picked;
    this._idx = 0;
    this._score = 0;

    goto('s-eval');
    this._render();
  },

  _render() {
    if (this._idx >= this._session.length) {
      // Done — go to hasil
      S.evalScore = this._score;
      S.evalSession = this._session;
      goto('s-hasil');
      return;
    }

    const q = this._session[this._idx];
    const total = this._session.length;
    const letters = ['A', 'B', 'C', 'D'];
    const silaColors = ['#1a5276','#922b21','#1e8449','#784212','#b7950b'];

    // Sila badge
    const badge = document.getElementById('eval-sila-badge');
    if (badge) {
      badge.textContent = `Sila ke-${q.sila}`;
      badge.style.background = silaColors[q.sila - 1] || 'var(--c)';
      badge.style.color = '#fff';
    }

    // Question number — "Rintangan X dari Y"
    const qnum = document.getElementById('eval-qnum');
    if (qnum) qnum.textContent = `Rintangan ${this._idx + 1} dari ${total}`;

    // Progress dots
    const prog = document.getElementById('eval-prog');
    if (prog) {
      prog.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot' + (i === this._idx ? ' active' : i < this._idx ? ' done' : '');
        prog.appendChild(dot);
      }
    }

    // Question text
    const qEl = document.getElementById('eval-q');
    if (qEl) qEl.textContent = q.soal;

    // Options
    const optsEl = document.getElementById('eval-opts');
    if (optsEl) {
      optsEl.innerHTML = '';
      q.pilihan.forEach((p, i) => {
        const opt = document.createElement('button');
        opt.className = 'quiz-opt';
        opt.style.background = 'rgba(255,255,255,.06)';
        opt.style.borderColor = 'rgba(255,255,255,.12)';
        opt.style.color = '#fff';
        opt.innerHTML = `<span class="quiz-opt-letter" style="color:var(--y);">${letters[i]}</span><span>${p}</span>`;
        opt.onclick = () => this._answer(i, opt);
        optsEl.appendChild(opt);
      });
    }
  },

  _answer(chosen, optEl) {
    const q = this._session[this._idx];
    const isCorrect = chosen === q.jawaban;

    // Disable all options
    const opts = document.querySelectorAll('#eval-opts .quiz-opt');
    opts.forEach((o, i) => {
      o.disabled = true;
      if (i === q.jawaban) {
        o.classList.add('correct');
        o.style.background = 'rgba(42,157,143,.15)';
        o.style.borderColor = 'var(--g)';
      }
      if (i === chosen && !isCorrect) {
        o.classList.add('wrong');
        o.style.background = 'rgba(230,57,70,.12)';
        o.style.borderColor = 'var(--r)';
      }
    });

    if (isCorrect) {
      this._score++;
      addScore(50);
      MODAL.show('Benar! 🎉', q.penjelasan, () => {
        this._idx++;
        this._render();
      }, { type: 'ok' });
    } else {
      MODAL.show('Kurang Tepat ❌', q.penjelasan, () => {
        this._idx++;
        this._render();
      }, { type: 'wrong' });
    }
  }
};

/* ══════════════════════════════════════════════
   HASIL — Puncak Pencapaian
══════════════════════════════════════════════ */
const HASIL = {
  render() {
    const total = S.evalSession.length || 5;
    const correct = S.evalScore || 0;
    const pct = Math.round((correct / total) * 100);

    // Score ring animation
    const ringFill = document.getElementById('ring-fill');
    if (ringFill) {
      const circumference = 327;
      const offset = circumference - (pct / 100) * circumference;
      setTimeout(() => {
        ringFill.style.strokeDashoffset = offset;
        if (pct >= 80) ringFill.style.stroke = 'var(--g)';
        else if (pct >= 60) ringFill.style.stroke = 'var(--y)';
        else ringFill.style.stroke = 'var(--r)';
      }, 300);
    }

    // Score text
    const scoreEl = document.getElementById('hasil-score');
    if (scoreEl) scoreEl.textContent = S.score;

    // Stars
    const starsEl = document.getElementById('hasil-stars');
    if (starsEl) {
      starsEl.innerHTML = '';
      const starCount = pct >= 80 ? 5 : pct >= 60 ? 4 : pct >= 40 ? 3 : pct >= 20 ? 2 : 1;
      for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.className = 'star-item' + (i < starCount ? ' lit' : '');
        star.textContent = '⭐';
        star.style.animationDelay = (i * 0.15) + 's';
        starsEl.appendChild(star);
      }
    }

    // Badge
    const badgeEl = document.getElementById('hasil-badge');
    if (badgeEl) {
      const labels = ['Perlu Belajar Lagi 📖','Cukup Baik 👍','Baik Sekali 🌟','Luar Biasa 🏆','Sempurna 🎉'];
      const idx = pct >= 100 ? 4 : pct >= 80 ? 3 : pct >= 60 ? 2 : pct >= 40 ? 1 : 0;
      badgeEl.textContent = labels[idx];
    }

    // Rincian
    const rincian = document.getElementById('hasil-rincian');
    if (rincian) {
      rincian.innerHTML = '';
      const items = [
        { label: 'Pendakian Akhir', val: `${correct}/${total} benar`, color: 'var(--c)' },
        { label: 'Pulau Selesai', val: `${S.missions.size}/5`, color: 'var(--g)' },
        { label: 'Diskusi', val: `${Object.keys(S.diskusi).length} terisi`, color: 'var(--p)' },
      ];
      items.forEach(it => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;font-size:clamp(.56rem,.95vw,.68rem);padding:3px 0;';
        row.innerHTML = `<span style="color:var(--muted);font-weight:800;">${it.label}</span><span style="color:${it.color};font-weight:900;">${it.val}</span>`;
        rincian.appendChild(row);
      });
    }

    // Init flashcard
    FLASH.init();
  }
};

/* ══════════════════════════════════════════════
   FLASH — Flashcard Review
══════════════════════════════════════════════ */
const FLASH = {
  _idx: 0,

  init() {
    this._idx = 0;
    this._render();
    this._renderDots();
  },

  _render() {
    const cards = DATA.flashcard;
    if (!cards.length) return;

    const c = cards[this._idx];
    const silaColors = { 1:'#1a5276', 2:'#922b21', 3:'#1e8449', 4:'#784212', 5:'#b7950b' };

    // Reset flip
    const inner = document.getElementById('flash-inner');
    if (inner) inner.classList.remove('flipped');

    const badge = document.getElementById('flash-sila-badge');
    if (badge) {
      badge.textContent = `Sila ke-${c.sila}`;
      badge.style.background = silaColors[c.sila] || 'var(--c)';
      badge.style.color = '#fff';
    }

    const emojiEl = document.getElementById('flash-emoji');
    if (emojiEl) emojiEl.textContent = c.emoji;

    const qEl = document.getElementById('flash-q');
    if (qEl) qEl.textContent = c.depan;

    const aEl = document.getElementById('flash-a');
    if (aEl) aEl.textContent = c.belakang;
  },

  _renderDots() {
    const dots = document.getElementById('flash-dots');
    if (!dots) return;

    dots.innerHTML = '';
    DATA.flashcard.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i === this._idx ? ' active' : '');
      dots.appendChild(dot);
    });
  },

  flip() {
    const inner = document.getElementById('flash-inner');
    if (inner) inner.classList.toggle('flipped');
  },

  prev() {
    if (this._idx > 0) {
      this._idx--;
      this._render();
      this._renderDots();
    }
  },

  next() {
    if (this._idx < DATA.flashcard.length - 1) {
      this._idx++;
      this._render();
      this._renderDots();
    }
  }
};

/* ══════════════════════════════════════════════
   REFLEKSI — Refleksi Individu
══════════════════════════════════════════════ */
const REFLEKSI = {
  render() {
    // Portofolio diskusi
    const portoEl = document.getElementById('porto-render');
    if (portoEl) {
      const keys = Object.keys(PORTO);
      if (keys.length === 0) {
        portoEl.innerHTML = '<p class="small-text muted italic" style="color:rgba(255,255,255,.5);">Belum ada diskusi yang disimpan. Isi kotak di tab Api Unggun!</p>';
      } else {
        portoEl.innerHTML = '';
        keys.forEach(k => {
          const p = PORTO[k];
          const item = document.createElement('div');
          item.className = 'porto-item';
          item.style.borderLeftColor = DATA.sila[p.sila - 1]?.warna || 'var(--c)';
          item.innerHTML = `
            <div class="porto-label" style="color:${DATA.sila[p.sila - 1]?.warna || 'var(--c)'};">${p.label}</div>
            <div class="porto-text">${p.text}</div>
          `;
          portoEl.appendChild(item);
        });
      }
    }

    // Refleksi individu
    const refEl = document.getElementById('refleksi-render');
    if (refEl) {
      refEl.innerHTML = '';
      DATA.refleksi.forEach(r => {
        const card = document.createElement('div');
        card.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
        card.innerHTML = `
          <div class="bold small-text" style="color:var(--p);">${r.label}</div>
          <div class="body-text" style="color:rgba(255,255,255,.85);">${r.pertanyaan}</div>
          <textarea id="ref-${r.id}" rows="3" placeholder="${r.placeholder}" style="max-height:80px;"></textarea>
          <div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;">
            <span class="saved-badge" id="badge-ref-${r.id}">✅ Tersimpan</span>
            <button class="btn btn-primary" style="font-size:.6rem;padding:4px 12px;" onclick="saveRefleksi('ref-${r.id}','ref-${r.id}','${r.label}',0)">Simpan</button>
          </div>
        `;
        refEl.appendChild(card);
      });
    }
  }
};

function saveRefleksi(tid, key, label, sila) {
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
   PENGANTAR TAB SWITCHER
══════════════════════════════════════════════ */
function switchPengantarTab(idx) {
  [1, 2, 3].forEach(i => {
    const btn = document.getElementById(`pg-btn-${i}`);
    const pane = document.getElementById(`pg-pane-${i}`);
    if (!btn || !pane) return;
    if (i === idx) {
      btn.classList.add('active');
      btn.style.background = 'rgba(255,255,255,.12)';
      btn.style.color = '#fff';
      pane.classList.add('active');
      pane.style.display = '';
    } else {
      btn.classList.remove('active');
      btn.style.background = 'rgba(255,255,255,.06)';
      btn.style.color = 'rgba(255,255,255,.65)';
      pane.classList.remove('active');
      pane.style.display = 'none';
    }
  });
}

/* ══════════════════════════════════════════════
   PENUTUP — Surat Pulang
══════════════════════════════════════════════ */
const PENUTUP = {
  render() {
    const scoreEl = document.getElementById('penutup-score');
    if (scoreEl) scoreEl.textContent = S.score + ' Poin';

    const levelEl = document.getElementById('penutup-level');
    if (levelEl) {
      const s = S.score;
      if (s >= 400) levelEl.textContent = '🏆 Penjelajah Pancasila Sejati!';
      else if (s >= 300) levelEl.textContent = '🌟 Penjelajah Hebat!';
      else if (s >= 200) levelEl.textContent = '👍 Penjelajah Yang Cukup Baik!';
      else levelEl.textContent = '📖 Terus Belajar Ya!';
    }

    const misiEl = document.getElementById('penutup-misi');
    if (misiEl) misiEl.textContent = `Pulau selesai: ${S.missions.size}/5 · Diskusi: ${Object.keys(S.diskusi).length} · Refleksi: ${Object.keys(PORTO).length}`;

    // Launch confetti!
    launchConfetti(100);
  }
};

/* ══════════════════════════════════════════════
   DISKUSI — Override dengan rendering lengkap
══════════════════════════════════════════════ */
const DISKUSI_FULL = {
  _activeTab: 1,

  renderPertanyaan() {
    const tabBar = document.getElementById('diskusi-tab-bar');
    const panesContainer = document.getElementById('diskusi-panes');
    if (!tabBar || !panesContainer) return;

    // Clear
    tabBar.innerHTML = '';
    panesContainer.innerHTML = '';

    // Render tab buttons
    DATA.diskusi.forEach((d, i) => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (i === 0 ? ' active' : '');
      btn.id = `dk-btn-${i + 1}`;
      btn.style.background = i === 0 ? d.warna : 'rgba(44,24,16,.06)';
      btn.style.color = i === 0 ? '#fff' : 'var(--muted)';
      if (i === 0) btn.style.boxShadow = `0 3px 10px ${d.warna}55`;
      btn.textContent = `💬 Topik ${i + 1}`;
      btn.onclick = () => switchDiskusiTab(i + 1);
      tabBar.appendChild(btn);
    });

    // Render tab panes
    DATA.diskusi.forEach((d, i) => {
      const pane = document.createElement('div');
      pane.id = `dk-pane-${i + 1}`;
      pane.className = 'tab-pane' + (i === 0 ? ' active' : '');
      pane.style.cssText = 'flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:clamp(6px,1vw,10px);' + (i !== 0 ? 'display:none;' : '');

      pane.innerHTML = `
        <div class="card card-p" style="border-left:4px solid ${d.warna};background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.1);border-left:4px solid ${d.warna};">
          <div class="bold mb-xs" style="color:${d.warna};font-size:clamp(.65rem,1.2vw,.82rem);">💬 ${d.judul}</div>
          <div class="body-text" style="color:rgba(255,255,255,.85);line-height:1.7;">${d.pertanyaan}</div>
          <div class="small-text muted" style="margin-top:6px;padding:6px 10px;background:rgba(255,255,255,.05);border-radius:10px;border:1px solid rgba(255,255,255,.08);">💡 ${d.petunjuk}</div>
        </div>
        <div class="flex-col gap-xs" style="flex:1;">
          <div class="bold small-text" style="color:${d.warna};">✏️ Tuliskan jawaban kelompokmu:</div>
          <textarea id="diskusi-${i}" rows="4" placeholder="${d.placeholder}" style="flex:1;min-height:60px;max-height:100px;"></textarea>
          <div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;">
            <span class="saved-badge" id="badge-diskusi-${i}">✅ Tersimpan</span>
            <button class="btn btn-primary" style="font-size:.6rem;padding:4px 12px;" onclick="saveDiskusi('diskusi-${i}','diskusi-${i}','${d.judul}',${d.sila})">Simpan</button>
          </div>
          <div id="t-diskusi-${i}"></div>
        </div>
      `;

      panesContainer.appendChild(pane);
    });

    // Init timers for each topic
    DATA.diskusi.forEach((d, i) => {
      TIMER.init(`t-diskusi-${i}`, 300);
    });

    this._activeTab = 1;
  }
};

// Override DISKUSI with full version
DISKUSI.renderPertanyaan = DISKUSI_FULL.renderPertanyaan;

/* ══════════════════════════════════════════════
   PERKEMAHAN — Combined Diskusi + Refleksi
══════════════════════════════════════════════ */
const PERKEMAHAN = {
  render() {
    // Render diskusi sub-tabs (Api Unggun)
    DISKUSI_FULL.renderPertanyaan();
    // Render refleksi (Jurnal Malam)
    REFLEKSI.render();
  }
};

/* ══════════════════════════════════════════════
   KREDIT — Halaman Kredit
══════════════════════════════════════════════ */
const KREDIT = {
  render() {
    const sumber = document.getElementById('kredit-sumber');
    if (sumber) sumber.textContent = DATA.kredit.sumber.join(' · ');

    const visual = document.getElementById('kredit-visual');
    if (visual) visual.textContent = DATA.kredit.visual.join(' · ');

    const dev = document.getElementById('kredit-dev');
    if (dev) dev.textContent = DATA.kredit.pengembang;
  }
};

// Auto-render kredit on load
window.addEventListener('DOMContentLoaded', () => {
  KREDIT.render();
});
