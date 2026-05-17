// ═══════════════════════════════════════════════════════════════════════
// EXPORT STYLES — All CSS for the exported standalone HTML
// ═══════════════════════════════════════════════════════════════════════

export function getCss(ratioW: number, ratioH: number): string {
  return `
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; -webkit-text-size-adjust: 100%; }
    body {
      font-family: 'Nunito', 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #070d18;
      color: #e8f2ff;
      overflow: hidden;
      min-height: 100vh;
      user-select: none;
      -webkit-user-select: none;
    }
    button { font-family: inherit; cursor: pointer; border: none; outline: none; }
    button:focus-visible { outline: 2px solid #fbbf24; outline-offset: 2px; }

    /* ── App layout ── */
    #app { height: 100vh; display: flex; flex-direction: column; }

    /* ── Canvas container ── */
    #canvas-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }
    #canvas {
      position: relative;
      width: ${ratioW}px;
      height: ${ratioH}px;
      transform-origin: center center;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
      border-radius: 4px;
    }

    /* ── Page ── */
    .page {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
      transition: opacity 0.35s ease, transform 0.35s ease;
      padding: 4%;
    }
    .page.active { opacity: 1; transform: translateX(0); }
    .page.exit-left { opacity: 0; transform: translateX(-30px); pointer-events: none; }
    .page.exit-right { opacity: 0; transform: translateX(30px); pointer-events: none; }
    .page.enter-left { opacity: 0; transform: translateX(-30px); }
    .page.enter-right { opacity: 0; transform: translateX(30px); }
    .page-content { flex: 1; }
    .page-label {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.65rem;
      color: rgba(255,255,255,0.25);
      font-weight: 600;
      white-space: nowrap;
    }
    .section-label {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .empty-page {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: rgba(255,255,255,0.3);
      font-size: 0.85rem;
    }

    /* ── Block base ── */
    .block {
      background: rgba(255,255,255,0.04);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      border: 1px solid rgba(255,255,255,0.06);
      animation: fadeIn 0.4s ease;
      min-width: 0;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .block-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .block-icon { font-size: 1.2rem; }
    .block-header h2 { font-size: 1rem; font-weight: 700; }
    .block-intro { color: #6e90b5; font-size: 0.82rem; margin-bottom: 10px; }
    .highlight { color: #fbbf24; }

    /* ── Cover ── */
    .cover-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 80%;
      position: relative;
      overflow: hidden;
      background: transparent !important;
      border: none;
    }
    .cover-glow {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .cover-icon { font-size: 3rem; margin-bottom: 12px; }
    .cover-title {
      font-size: 1.6rem;
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 6px;
      text-shadow: 0 2px 12px rgba(0,0,0,0.4);
    }
    .cover-subtitle {
      font-size: 0.9rem;
      color: #6e90b5;
      margin-bottom: 16px;
    }
    .cover-badges { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
    .badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    /* ── Step grid ── */
    .step-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; min-width: 0; }
    @media (max-width: 480px) { .step-grid { grid-template-columns: 1fr; } }
    .step-card {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .step-num {
      min-width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: #3ecfcf22;
      color: #3ecfcf;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .step-icon { font-size: 1.1rem; }
    .step-content h3 { font-size: 0.8rem; font-weight: 700; margin-bottom: 2px; }
    .step-content p { font-size: 0.72rem; color: #6e90b5; line-height: 1.4; }
    .tips-box {
      margin-top: 10px;
      padding: 10px 14px;
      background: #fbbf2411;
      border: 1px solid #fbbf2433;
      border-radius: 10px;
      font-size: 0.78rem;
      color: #fbbf24;
    }

    /* ── TP ── */
    .tp-list { display: flex; flex-direction: column; gap: 8px; }
    .tp-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
    }
    .tp-num {
      min-width: 26px; height: 26px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      font-size: 0.7rem;
      font-weight: 800;
      color: #1e293b;
    }
    .tp-verb { font-weight: 700; font-size: 0.82rem; }
    .tp-desc { font-size: 0.78rem; color: #6e90b5; }

    /* ── Timeline ── */
    .timeline { position: relative; padding-left: 20px; }
    .timeline::before {
      content: '';
      position: absolute;
      left: 6px; top: 0; bottom: 0;
      width: 2px;
      background: rgba(255,255,255,0.1);
    }
    .timeline-step { position: relative; margin-bottom: 14px; }
    .timeline-dot {
      position: absolute;
      left: -18px; top: 4px;
      width: 10px; height: 10px;
      border-radius: 50%;
    }
    .timeline-content {
      padding: 8px 12px;
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
    }
    .timeline-durasi { font-size: 0.68rem; font-weight: 600; color: #6e90b5; margin-bottom: 2px; }
    .timeline-content h3 { font-size: 0.82rem; font-weight: 700; margin-bottom: 2px; }
    .timeline-content p { font-size: 0.74rem; color: #6e90b5; }

    /* ── Skenario ── */
    .skenario-chapter {
      padding: 12px;
      margin-bottom: 10px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .skenario-char { font-size: 2rem; margin-bottom: 4px; }
    .skenario-chapter h3 { font-size: 0.9rem; font-weight: 700; margin-bottom: 8px; }
    .dialog { font-size: 0.78rem; margin-bottom: 4px; color: #94a3b8; }
    .choice-card {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      margin: 4px 0;
      background: rgba(255,255,255,0.04);
      border-radius: 8px;
      font-size: 0.78rem;
    }
    .choice-icon { font-size: 1rem; }
    .choice-detail { color: #6e90b5; font-size: 0.7rem; }

    /* ── Def-box ── */
    .def-box { display: flex; align-items: flex-start; gap: 10px; }
    .def-icon { font-size: 1.2rem; }
    .def-box p { font-size: 0.82rem; line-height: 1.5; }

    /* ── NC Grid ── */
    .nc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; min-width: 0; }
    @media (max-width: 480px) { .nc-grid { grid-template-columns: 1fr; } }
    .nc-card {
      padding: 12px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
      min-width: 0;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .nc-icon { font-size: 1.4rem; margin-bottom: 4px; }
    .nc-card h3 { font-size: 0.82rem; font-weight: 700; margin-bottom: 4px; }
    .nc-card p { font-size: 0.74rem; color: #6e90b5; line-height: 1.4; }

    /* ── NK Card ── */
    .nk-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .nk-icon { font-size: 1.8rem; }
    .nk-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6e90b5; }
    .nk-header h3 { font-size: 1rem; font-weight: 800; }
    .nk-def { font-size: 0.82rem; line-height: 1.5; margin-bottom: 8px; }
    .nk-chars { margin-bottom: 8px; }
    .nk-char { font-size: 0.78rem; margin-bottom: 3px; }
    .nk-sanksi h4 { font-size: 0.78rem; font-weight: 700; margin-bottom: 4px; color: #ff6b6b; }
    .nk-sanksi-item { font-size: 0.74rem; margin-bottom: 2px; padding-left: 8px; }
    .nk-contoh {
      margin-top: 8px; padding: 8px 12px;
      background: #34d39911; border-radius: 8px;
      font-size: 0.78rem; color: #34d399;
    }

    /* ── Flashcard ── */
    .flashcard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (max-width: 480px) { .flashcard-grid { grid-template-columns: 1fr; } }
    .flashcard {
      perspective: 600px;
      height: 120px;
      cursor: pointer;
    }
    .flashcard-inner {
      position: relative;
      width: 100%; height: 100%;
      transition: transform 0.5s ease;
      transform-style: preserve-3d;
    }
    .flashcard.flipped .flashcard-inner { transform: rotateY(180deg); }
    .flashcard-front, .flashcard-back {
      position: absolute; inset: 0;
      backface-visibility: hidden;
      border-radius: 10px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 12px;
      text-align: center;
    }
    .flashcard-front { background: #ffffff; border: 1px solid rgba(0,0,0,0.08); }
    .flashcard-back {
      background: #34d39922;
      border: 1px solid #34d39944;
      transform: rotateY(180deg);
    }
    .flashcard-num {
      position: absolute; top: 6px; left: 8px;
      font-size: 0.65rem; font-weight: 700; color: #6e90b5;
    }
    .flashcard-front p, .flashcard-back p { font-size: 0.78rem; line-height: 1.3; }

    /* ── Ftab ── */
    .ftab-tabs { display: flex; gap: 4px; margin-bottom: 10px; flex-wrap: wrap; }
    .ftab-btn {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(255,255,255,0.05);
      color: #6e90b5;
      transition: all 0.2s ease;
    }
    .ftab-btn.active { background: #3ecfcf22; color: #3ecfcf; border-color: #3ecfcf44; }
    .ftab-btn:hover { background: rgba(255,255,255,0.08); }
    .ftab-panel { display: none; }
    .ftab-panel.active { display: block; }

    /* ── Materi Section ── */
    .materi-section-block { border-radius: 14px; }
    .materi-section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
    .materi-section-icon { font-size: 1.5rem; }
    .materi-section-header h2 { font-size: 1.1rem; font-weight: 800; }
    .materi-subtitle { font-size: 0.78rem; color: #6e90b5; }
    .materi-content { margin-bottom: 10px; }
    .bsnp-badge {
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.6rem;
      font-weight: 800;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #1e293b;
      letter-spacing: 0.05em;
    }
    .takeaways {
      margin-top: 10px;
      padding: 12px;
      background: rgba(251,191,36,0.06);
      border-radius: 10px;
      border: 1px solid rgba(251,191,36,0.15);
    }
    .takeaways h3 { font-size: 0.82rem; font-weight: 700; margin-bottom: 6px; color: #fbbf24; }
    .takeaway-item { font-size: 0.78rem; margin-bottom: 3px; color: #e8f2ff; }
    .self-check {
      margin-top: 10px;
      padding: 12px;
      background: rgba(167,139,250,0.08);
      border-radius: 10px;
      border: 1px solid rgba(167,139,250,0.15);
    }
    .self-check h3 { font-size: 0.82rem; font-weight: 700; margin-bottom: 4px; color: #a78bfa; }
    .self-check p { font-size: 0.78rem; color: #94a3b8; }

    /* ── Kuis ── */
    .kuis-question { margin-bottom: 14px; }
    .q-text { font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; }
    .q-options { display: flex; flex-direction: column; gap: 5px; }
    .q-opt {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      font-size: 0.78rem;
      color: #e8f2ff;
      transition: all 0.2s ease;
      text-align: left;
    }
    .q-opt:hover { background: rgba(255,255,255,0.08); }
    .q-opt.correct { background: #34d39922 !important; border-color: #34d39955 !important; color: #34d399 !important; }
    .q-opt.wrong { background: #ff6b6b22 !important; border-color: #ff6b6b55 !important; color: #ff6b6b !important; }
    .q-opt.disabled { pointer-events: none; opacity: 0.6; }
    .q-letter {
      min-width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
      font-size: 0.68rem;
      font-weight: 700;
    }
    .q-feedback {
      margin-top: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      min-height: 1em;
    }

    /* ── Diskusi ── */
    .diskusi-card {
      padding: 10px 14px;
      margin-bottom: 8px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
    }
    .diskusi-label { font-size: 0.72rem; font-weight: 700; margin-bottom: 4px; }
    .diskusi-teks { font-size: 0.82rem; margin-bottom: 4px; }
    .diskusi-petunjuk { font-size: 0.72rem; color: #6e90b5; }

    /* ── Refleksi ── */
    .refleksi-card {
      padding: 10px 14px;
      margin-bottom: 8px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
    }
    .refleksi-card p { font-size: 0.82rem; margin-bottom: 3px; }
    .refleksi-petunjuk { font-size: 0.72rem; color: #6e90b5; }

    /* ── Penutup ── */
    .penutup-preview { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; min-width: 0; }
    @media (max-width: 480px) { .penutup-preview { grid-template-columns: 1fr; } }
    .penutup-item {
      padding: 12px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
      min-width: 0;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .penutup-item span { font-size: 1.4rem; display: block; margin-bottom: 4px; }
    .penutup-item strong { font-size: 0.82rem; display: block; margin-bottom: 2px; }
    .penutup-item p { font-size: 0.72rem; color: #6e90b5; }

    /* ── Accordion ── */
    .accord-row { margin-bottom: 6px; border-radius: 10px; overflow: hidden; }
    .accord-header {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: rgba(255,255,255,0.04);
      cursor: pointer;
      font-size: 0.82rem;
    }
    .accord-arrow { margin-left: auto; transition: transform 0.2s ease; font-size: 0.7rem; color: #6e90b5; }
    .accord-row.open .accord-arrow { transform: rotate(180deg); }
    .accord-body {
      display: none;
      padding: 10px 14px;
      background: rgba(255,255,255,0.02);
      font-size: 0.78rem;
    }
    .accord-row.open .accord-body { display: block; }
    .accord-detail { margin-bottom: 3px; }

    /* ── Sortir ── */
    .sortir-pool { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .sortir-item {
      padding: 5px 12px;
      background: rgba(255,255,255,0.06);
      border-radius: 20px;
      font-size: 0.75rem;
      cursor: grab;
    }
    .sortir-kolom { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .sortir-kolom-box { padding: 12px; border-radius: 10px; min-height: 60px; }
    .sortir-kolom-box h4 { font-size: 0.78rem; font-weight: 700; margin-bottom: 4px; }

    /* ── Roda ── */
    .roda-question { margin-bottom: 14px; }
    .roda-question p { font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; }

    /* ── Hasil ── */
    .hasil-block {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center;
      min-height: 50%;
      background: transparent;
      border: none;
    }
    .hasil-icon { font-size: 3rem; margin-bottom: 10px; }
    .hasil-block h2 { font-size: 1.4rem; font-weight: 900; margin-bottom: 6px; }
    .hasil-block p { color: #6e90b5; }

    /* ── Generic fallback ── */
    .generic-block { font-size: 0.82rem; }
    .text-muted { color: #6e90b5; font-style: italic; }

    /* ── Navigation bar ── */
    #nav-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 10px 16px;
      background: rgba(14,28,47,0.95);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    #nav-bar button {
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #e8f2ff;
      transition: all 0.15s ease;
    }
    #prev-btn { background: rgba(255,255,255,0.08); }
    #prev-btn:hover { background: rgba(255,255,255,0.15); }
    #next-btn { background: #3ecfcf33; color: #3ecfcf; }
    #next-btn:hover { background: #3ecfcf55; }
    #fullscreen-btn {
      padding: 6px 10px;
      background: rgba(255,255,255,0.06);
      font-size: 0.9rem;
    }
    #fullscreen-btn:hover { background: rgba(255,255,255,0.12); }
    #page-counter {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6e90b5;
      min-width: 40px;
      text-align: center;
    }

    /* ── Scrollbar ── */
    .page::-webkit-scrollbar { width: 4px; }
    .page::-webkit-scrollbar-track { background: transparent; }
    .page::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }

    /* ── Game shared ── */
    .game-instruction { font-size: 0.75rem; color: #94a3b8; margin-bottom: 10px; font-style: italic; }
    .game-score { margin-top: 10px; padding: 8px 12px; background: rgba(255,255,255,0.04); border-radius: 8px; font-size: 0.82rem; font-weight: 700; text-align: center; }
    .game-check-btn {
      display: block; width: 100%; margin-top: 12px; padding: 10px;
      background: #3ecfcf22; border: 1px solid #3ecfcf44; border-radius: 10px;
      color: #3ecfcf; font-weight: 700; font-size: 0.85rem; cursor: pointer;
      transition: background 0.2s;
    }
    .game-check-btn:hover { background: #3ecfcf33; }

    /* ── Memory Game ── */
    .memory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }
    .memory-card { perspective: 600px; height: 70px; cursor: pointer; }
    .memory-card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.5s ease; transform-style: preserve-3d; }
    .memory-card.flipped .memory-card-inner { transform: rotateY(180deg); }
    .memory-card-front, .memory-card-back {
      position: absolute; inset: 0; backface-visibility: hidden; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; font-size: 0.78rem;
      text-align: center; padding: 4px; font-weight: 600;
    }
    .memory-card-front { background: #3ecfcf22; border: 1px solid #3ecfcf44; font-size: 1.2rem; }
    .memory-card-back { background: #a78bfa22; border: 1px solid #a78bfa44; color: #e8f2ff; transform: rotateY(180deg); }
    .memory-card.matched .memory-card-inner { transform: rotateY(180deg); }
    .memory-card.matched { opacity: 0.7; pointer-events: none; }
    .memory-card.wrong .memory-card-inner { transform: rotateY(180deg); }
    .memory-card.wrong .memory-card-back { border-color: #ff6b6b88; background: #ff6b6b22; animation: shake 0.4s ease; }
    @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }

    /* ── Matching Game ── */
    .matching-columns { display: flex; gap: 16px; }
    .matching-col { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .match-item {
      padding: 8px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; color: #e8f2ff; font-size: 0.78rem; cursor: pointer; transition: all 0.2s; text-align: left;
    }
    .match-item:hover { background: rgba(255,255,255,0.08); }
    .match-item.selected { border-color: #fbbf2488; background: #fbbf2422; }
    .match-item.matched-correct { border-color: #34d39988; background: #34d39922; opacity: 0.6; pointer-events: none; }
    .match-item.matched-wrong { border-color: #ff6b6b88; background: #ff6b6b22; animation: shake 0.4s ease; }

    /* ── Fill Blank Game ── */
    .fb-question { margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; }
    .fb-input {
      display: inline-block; width: 100px; padding: 4px 8px; margin: 0 4px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);
      border-radius: 6px; color: #fbbf24; font-size: 0.82rem; font-weight: 600;
      text-align: center; outline: none;
    }
    .fb-input:focus { border-color: #fbbf2488; }
    .fb-input.correct { border-color: #34d39988; background: #34d39911; color: #34d399; }
    .fb-input.wrong { border-color: #ff6b6b88; background: #ff6b6b11; color: #ff6b6b; }
    .fb-feedback { margin-top: 6px; font-size: 0.75rem; }

    /* ── Word Search ── */
    .ws-container { display: flex; gap: 12px; }
    .ws-grid { display: grid; gap: 2px; flex: 1; }
    .ws-cell {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; font-size: 0.72rem; font-weight: 700;
      background: rgba(255,255,255,0.04); border-radius: 4px; cursor: pointer;
      transition: all 0.15s; user-select: none; color: #94a3b8;
    }
    .ws-cell:hover { background: rgba(255,255,255,0.1); }
    .ws-cell.selected { background: #fbbf2433; color: #fbbf24; border: 1px solid #fbbf2444; }
    .ws-cell.found { background: #34d39933; color: #34d399; }
    .ws-words { min-width: 120px; }
    .ws-word { font-size: 0.75rem; padding: 3px 8px; margin-bottom: 3px; background: rgba(255,255,255,0.03); border-radius: 6px; }
    .ws-word.found { color: #34d399; text-decoration: line-through; opacity: 0.6; }

    /* ── True/False ── */
    .tf-question { margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; }
    .tf-buttons { display: flex; gap: 8px; margin-top: 8px; }
    .tf-btn {
      flex: 1; padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 0.82rem;
      cursor: pointer; transition: all 0.2s;
    }
    .tf-true { background: #34d39922; border: 1px solid #34d39944; color: #34d399; }
    .tf-false { background: #ff6b6b22; border: 1px solid #ff6b6b44; color: #ff6b6b; }
    .tf-btn:hover { opacity: 0.8; }
    .tf-btn.disabled { pointer-events: none; opacity: 0.5; }
    .tf-btn.correct-answer { background: #34d39944 !important; border-color: #34d399 !important; }
    .tf-btn.wrong-answer { background: #ff6b6b44 !important; border-color: #ff6b6b !important; }
    .tf-feedback { margin-top: 6px; font-size: 0.75rem; }

    /* ── Drag & Drop ── */
    .dd-pool { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; min-height: 40px; padding: 8px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px dashed rgba(255,255,255,0.08); }
    .dd-item {
      padding: 6px 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; font-size: 0.78rem; cursor: grab; transition: all 0.2s; color: #e8f2ff;
    }
    .dd-item:active { cursor: grabbing; }
    .dd-targets { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; }
    .dd-target {
      padding: 10px; border: 2px dashed rgba(255,255,255,0.1); border-radius: 10px; min-height: 60px;
      transition: all 0.2s;
    }
    .dd-target h4 { font-size: 0.78rem; margin-bottom: 6px; }
    .dd-target-items { display: flex; flex-wrap: wrap; gap: 4px; }
    .dd-target .dd-item { font-size: 0.72rem; padding: 4px 8px; }
    .dd-hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.2) !important; }
    .dd-item.correct { border-color: #34d39988; background: #34d39922; }
    .dd-item.wrong { border-color: #ff6b6b88; background: #ff6b6b22; }

    /* ── Crossword ── */
    .cw-container { display: flex; gap: 12px; }
    .cw-grid { display: grid; gap: 1px; flex: 1; }
    .cw-cell {
      position: relative; width: 28px; height: 28px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 3px;
    }
    .cw-blank { background: transparent; border-color: transparent; }
    .cw-num { position: absolute; top: 1px; left: 2px; font-size: 7px; color: #94a3b8; font-weight: 700; z-index: 1; }
    .cw-input {
      width: 100%; height: 100%; background: transparent; border: none; text-align: center;
      font-size: 0.78rem; font-weight: 700; color: #fbbf24; outline: none; text-transform: uppercase;
    }
    .cw-input:focus { background: rgba(251,191,36,0.08); }
    .cw-input.correct { color: #34d399; background: rgba(52,211,153,0.08); }
    .cw-input.wrong { color: #ff6b6b; background: rgba(255,107,107,0.08); }
    .cw-clues { min-width: 140px; }
    .cw-clue { font-size: 0.72rem; padding: 3px 0; color: #94a3b8; line-height: 1.4; }
    .cw-clue-dir { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; color: #6e90b5; margin-right: 4px; }

    /* ── Team Buzzer ── */
    .tb-scoreboard { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 14px; }
    .tb-team { flex: 1; text-align: center; padding: 12px; border-radius: 10px; }
    .tb-team-a { background: #3ecfcf15; border: 1px solid #3ecfcf33; }
    .tb-team-b { background: #ff6b6b15; border: 1px solid #ff6b6b33; }
    .tb-team-name { font-size: 0.75rem; font-weight: 700; margin-bottom: 4px; }
    .tb-team-score { font-size: 1.6rem; font-weight: 900; }
    .tb-team-a .tb-team-score { color: #3ecfcf; }
    .tb-team-b .tb-team-score { color: #ff6b6b; }
    .tb-vs { font-size: 1.2rem; font-weight: 900; color: #6e90b5; }
    .tb-questions { display: flex; flex-direction: column; gap: 8px; }
    .tb-question { padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; }
    .tb-question.answered { opacity: 0.4; pointer-events: none; }
    .tb-actions { display: flex; gap: 6px; margin-top: 8px; }
    .tb-btn {
      flex: 1; padding: 6px 10px; border-radius: 8px; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .tb-btn-a { background: #3ecfcf22; border: 1px solid #3ecfcf44; color: #3ecfcf; }
    .tb-btn-b { background: #ff6b6b22; border: 1px solid #ff6b6b44; color: #ff6b6b; }
    .tb-skip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; }
    .tb-btn:hover { opacity: 0.8; }

    /* ── BSNP Badge ── */
    .bsnp-badge {
      display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 0.6rem;
      font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
      background: #fbbf2422; color: #fbbf24; border: 1px solid #fbbf2444;
    }
    .block-subtitle { color: #6e90b5; font-size: 0.78rem; margin-bottom: 8px; }
    .tujuan-list { display: flex; flex-direction: column; gap: 6px; }
    .tujuan-item { display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: rgba(255,255,255,0.03); border-radius: 8px; }
    .tujuan-num { min-width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #fbbf2422; color: #fbbf24; font-size: 0.65rem; font-weight: 800; }
    .tujuan-icon { font-size: 0.9rem; }
    .tujuan-text { font-size: 0.78rem; }
    .profil-box { margin-top: 8px; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.78rem; }
    .takeaways { margin-top: 10px; padding: 10px; background: #fbbf2411; border: 1px solid #fbbf2433; border-radius: 10px; }
    .takeaways h3 { font-size: 0.85rem; font-weight: 700; margin-bottom: 6px; }
    .takeaway-item { font-size: 0.78rem; color: #34d399; margin-bottom: 2px; }
    .self-check { margin-top: 8px; padding: 10px; background: #a78bfa11; border: 1px solid #a78bfa33; border-radius: 10px; }
    .self-check h3 { font-size: 0.82rem; font-weight: 700; margin-bottom: 4px; }
    .self-check p { font-size: 0.78rem; color: #94a3b8; }

    /* ── Confetti ── */
    .confetti-piece {
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      animation: confettiFall 2s ease-in forwards;
    }
    @keyframes confettiFall {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
  `;
}
