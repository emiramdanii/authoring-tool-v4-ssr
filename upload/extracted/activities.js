/**
 * activities.js — HOTSPOT, DND (Drag & Drop), PILGAN (Studi Kasus)
 * Misi Penjelajah Pancasila
 */

/* ══════════════════════════════════════════════
   HOTSPOT — Pilih gambar/perilaku yang benar
   (Misi 1 & Misi 3)
══════════════════════════════════════════════ */
const HOTSPOT = {
  init(silaNo) {
    const sila = DATA.sila[silaNo - 1];
    if (sila.tantangan.tipe !== 'hotspot') return;

    const gridId = `s${silaNo}-grid`;
    const grid = document.getElementById(gridId);
    if (!grid) return;

    const t = sila.tantangan;
    const key = `sila${silaNo}Found`;
    S[key] = 0;

    grid.innerHTML = '';
    t.pilihan.forEach((p, i) => {
      const btn = document.createElement('button');
      btn.className = 'hs-btn';
      btn.innerHTML = `<span class="hs-emoji">${p.emoji}</span><span>${p.teks}</span>`;
      btn.onclick = () => this._click(silaNo, i, btn);
      grid.appendChild(btn);
    });

    this._updateCounter(silaNo);
  },

  _click(silaNo, idx, btn) {
    if (btn.classList.contains('correct') || btn.classList.contains('wrong')) return;

    const sila = DATA.sila[silaNo - 1];
    const p = sila.tantangan.pilihan[idx];
    const key = `sila${silaNo}Found`;

    if (p.benar) {
      btn.classList.add('correct');
      S[key]++;
      addScore(20);
      MODAL.show('Benar! 🎉', p.feedback, null, { type: 'ok' });
    } else {
      btn.classList.add('wrong');
      MODAL.show('Kurang Tepat ❌', p.feedback, null, { type: 'wrong' });
    }

    this._updateCounter(silaNo);
  },

  _updateCounter(silaNo) {
    const sila = DATA.sila[silaNo - 1];
    const key = `sila${silaNo}Found`;
    const target = sila.tantangan.target;
    const ctr = document.getElementById(`ctr-s${silaNo}`);
    if (ctr) ctr.textContent = `${S[key]}/${target}`;

    const doneBtn = document.getElementById(`btn-done-${silaNo}`);
    if (doneBtn) doneBtn.disabled = S[key] < target;
  }
};

/* ══════════════════════════════════════════════
   DND — Drag & Drop Sortir Kartu
   (Misi 2 & Misi 5)
══════════════════════════════════════════════ */
const DND = {
  _state: {},
  _dragEl: null,
  _dragData: null,

  init(silaNo) {
    const sila = DATA.sila[silaNo - 1];
    if (sila.tantangan.tipe !== 'dragdrop') return;

    const poolId = `pool-s${silaNo}`;
    const pool = document.getElementById(poolId);
    if (!pool) return;

    const key = `dnd${silaNo}`;
    this._state[key] = { correct: 0, total: sila.tantangan.target };

    pool.innerHTML = '';

    // Shuffle kartu
    const kartu = [...sila.tantangan.kartu];
    for (let i = kartu.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [kartu[i], kartu[j]] = [kartu[j], kartu[i]];
    }

    kartu.forEach((k, i) => {
      const card = document.createElement('div');
      card.className = 'drag-card';
      card.setAttribute('data-benar', k.benar ? 'true' : 'false');
      card.setAttribute('data-hint', k.hint || '');
      card.setAttribute('data-idx', i);
      card.innerHTML = `<span class="dc-emoji">${k.emoji}</span><span>${k.teks}</span>`;
      card.setAttribute('draggable', 'true');

      // Drag events (desktop)
      card.addEventListener('dragstart', (e) => this._onDragStart(e, card, k, silaNo));
      card.addEventListener('dragend', (e) => this._onDragEnd(e));

      // Touch events (mobile)
      card.addEventListener('touchstart', (e) => this._onTouchStart(e, card, k, silaNo), { passive: false });
      card.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
      card.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });

      pool.appendChild(card);
    });

    // Setup dropzones
    ['ok', 'no'].forEach(type => {
      const dz = document.getElementById(`dz-${type}-${silaNo}`);
      if (!dz) return;

      const area = dz.querySelector('.dz-area');
      area.innerHTML = '';

      dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('lit'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('lit'));
      dz.addEventListener('drop', (e) => {
        e.preventDefault();
        dz.classList.remove('lit');
        if (this._dragEl && this._dragData) {
          this._processDrop(silaNo, type, this._dragEl, this._dragData);
        }
      });
    });

    this._updateCounter(silaNo);
  },

  _onDragStart(e, card, data, silaNo) {
    this._dragEl = card;
    this._dragData = { ...data, silaNo };
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  },

  _onDragEnd(e) {
    if (this._dragEl) this._dragEl.classList.remove('dragging');
    this._dragEl = null;
    this._dragData = null;
  },

  // Touch-based drag support
  _touchClone: null,
  _touchCard: null,
  _touchData: null,

  _onTouchStart(e, card, data, silaNo) {
    if (card.classList.contains('placed')) return;
    e.preventDefault();
    this._touchCard = card;
    this._touchData = { ...data, silaNo };

    const clone = card.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.zIndex = '10000';
    clone.style.width = card.offsetWidth + 'px';
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.85';
    document.body.appendChild(clone);
    this._touchClone = clone;

    const touch = e.touches[0];
    clone.style.left = (touch.clientX - card.offsetWidth / 2) + 'px';
    clone.style.top = (touch.clientY - card.offsetHeight / 2) + 'px';

    card.style.opacity = '0.3';
  },

  _onTouchMove(e) {
    if (!this._touchClone) return;
    e.preventDefault();
    const touch = e.touches[0];
    const w = this._touchClone.offsetWidth;
    const h = this._touchClone.offsetHeight;
    this._touchClone.style.left = (touch.clientX - w / 2) + 'px';
    this._touchClone.style.top = (touch.clientY - h / 2) + 'px';
  },

  _onTouchEnd(e) {
    if (!this._touchClone || !this._touchCard || !this._touchData) return;
    e.preventDefault();

    const touch = e.changedTouches[0];
    this._touchClone.remove();
    this._touchClone = null;

    // Find dropzone under touch
    const elUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    const dz = elUnder?.closest('.dropzone');
    if (dz) {
      const silaNo = this._touchData.silaNo;
      const type = dz.getAttribute('data-type');
      this._processDrop(silaNo, type, this._touchCard, this._touchData);
    } else {
      this._touchCard.style.opacity = '1';
    }

    this._touchCard = null;
    this._touchData = null;
  },

  _processDrop(silaNo, zoneType, card, data) {
    const isOk = zoneType === 'ok';
    const isCorrect = (data.benar && isOk) || (!data.benar && !isOk);

    const sila = DATA.sila[silaNo - 1];
    const key = `dnd${silaNo}`;

    // Move card to the zone
    const dz = document.getElementById(`dz-${zoneType}-${silaNo}`);
    const area = dz.querySelector('.dz-area');

    card.classList.remove('dragging');
    card.classList.add('placed');
    card.style.opacity = '1';
    card.setAttribute('draggable', 'false');
    card.style.cursor = 'default';

    if (isCorrect) {
      card.style.borderColor = 'var(--g)';
      card.style.background = 'rgba(42,157,143,.06)';
      this._state[key].correct++;
      addScore(15);
      MODAL.show('Tepat! 🎉', data.hint, null, { type: 'ok' });
    } else {
      card.style.borderColor = 'var(--r)';
      card.style.background = 'rgba(230,57,70,.06)';
      MODAL.show('Kurang Tepat ❌', data.hint, null, { type: 'wrong' });
    }

    area.appendChild(card);
    this._updateCounter(silaNo);
  },

  _updateCounter(silaNo) {
    const key = `dnd${silaNo}`;
    const st = this._state[key];
    if (!st) return;

    const ctr = document.getElementById(`ctr-s${silaNo}`);
    if (ctr) ctr.textContent = `${st.correct}/${st.total}`;

    const doneBtn = document.getElementById(`btn-done-${silaNo}`);
    if (doneBtn) doneBtn.disabled = st.correct < st.total;
  }
};

/* ══════════════════════════════════════════════
   PILGAN — Pilihan Ganda Studi Kasus
   (Misi 4)
══════════════════════════════════════════════ */
const PILGAN = {
  _idx: 0,

  init(silaNo) {
    const sila = DATA.sila[silaNo - 1];
    if (sila.tantangan.tipe !== 'pilgan') return;

    this._idx = 0;
    S.sila4Answered = 0;
    this._render(silaNo);
  },

  _render(silaNo) {
    const sila = DATA.sila[silaNo - 1];
    const soal = sila.tantangan.soal;
    const q = soal[this._idx];
    const total = soal.length;
    const letters = ['A', 'B', 'C', 'D'];

    // Update header
    const numEl = document.getElementById('s4-soal-num');
    if (numEl) numEl.textContent = `Studi Kasus ${this._idx + 1} dari ${total}`;

    // Progress dots
    const prog = document.getElementById('s4-soal-prog');
    if (prog) {
      prog.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot' + (i === this._idx ? ' active' : i < this._idx ? ' done' : '');
        prog.appendChild(dot);
      }
    }

    // Question
    const qEl = document.getElementById('s4-soal-q');
    if (qEl) qEl.textContent = q.situasi;

    // Options
    const optsEl = document.getElementById('s4-soal-opts');
    if (optsEl) {
      optsEl.innerHTML = '';
      q.pilihan.forEach((p, i) => {
        const opt = document.createElement('button');
        opt.className = 'quiz-opt';
        opt.innerHTML = `<span class="quiz-opt-letter">${letters[i]}</span><span>${p}</span>`;
        opt.onclick = () => this._answer(silaNo, i, opt);
        optsEl.appendChild(opt);
      });
    }

    // Counter
    const ctr = document.getElementById('ctr-s4');
    if (ctr) ctr.textContent = `${S.sila4Answered}/${total}`;

    // Done button
    const doneBtn = document.getElementById('btn-done-4');
    if (doneBtn) doneBtn.disabled = S.sila4Answered < total;
  },

  _answer(silaNo, chosen, optEl) {
    const sila = DATA.sila[silaNo - 1];
    const q = sila.tantangan.soal[this._idx];
    const isCorrect = chosen === q.jawaban;

    // Disable all options
    const opts = document.querySelectorAll('#s4-soal-opts .quiz-opt');
    opts.forEach((o, i) => {
      o.disabled = true;
      if (i === q.jawaban) o.classList.add('correct');
      if (i === chosen && !isCorrect) o.classList.add('wrong');
    });

    // Count ALL answered questions (not just correct) so mission can always complete
    S.sila4Answered++;

    if (isCorrect) {
      addScore(30);
      MODAL.show('Benar! 🎉', q.penjelasan, () => {
        this._next(silaNo);
      }, { type: 'ok' });
    } else {
      MODAL.show('Kurang Tepat ❌', q.penjelasan, () => {
        this._next(silaNo);
      }, { type: 'wrong' });
    }

    // Counter
    const ctr = document.getElementById('ctr-s4');
    if (ctr) ctr.textContent = `${S.sila4Answered}/${sila.tantangan.target}`;

    const doneBtn = document.getElementById('btn-done-4');
    if (doneBtn) doneBtn.disabled = S.sila4Answered < sila.tantangan.target;
  },

  _next(silaNo) {
    const sila = DATA.sila[silaNo - 1];
    const total = sila.tantangan.soal.length;
    this._idx++;
    if (this._idx < total) {
      this._render(silaNo);
    }
  }
};
