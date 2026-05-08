// ═══════════════════════════════════════════════════════════════
// STYLES — CSS string for the student export HTML
// ═══════════════════════════════════════════════════════════════

export const EXPORT_CSS = `:root{--bg:#0e1c2f;--bg2:#13243a;--card:#182d45;--border:rgba(255,255,255,.09);
  --y:#f9c12e;--c:#3ecfcf;--r:#ff6b6b;--p:#a78bfa;--g:#34d399;--o:#fb923c;
  --text:#e8f2ff;--muted:#6e90b5;--rad:16px;}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;}
.screen{display:none;min-height:100vh;animation:fadeIn .4s ease;}
.screen.active{display:flex;flex-direction:column;}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
.navbar{background:rgba(14,28,47,.96);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);
  padding:10px 18px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:200;}
.nav-logo{font-family:'Fredoka One',cursive;font-size:.95rem;color:var(--y);white-space:nowrap;}
.nav-prog{flex:1;height:6px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden;margin:0 8px;}
.nav-prog-fill{height:100%;background:linear-gradient(90deg,var(--y),var(--c));border-radius:99px;transition:width .5s;}
.nav-score{font-size:.8rem;font-weight:800;color:var(--y);white-space:nowrap;}
.main{flex:1;padding:22px 16px;max-width:860px;width:100%;margin:0 auto;}
.btn{display:inline-flex;align-items:center;gap:6px;padding:10px 24px;border-radius:99px;
  font-family:'Nunito',sans-serif;font-weight:800;font-size:.9rem;border:none;cursor:pointer;transition:all .18s;}
.btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.3);}
.btn-y{background:var(--y);color:#0e1c2f;}.btn-c{background:var(--c);color:#0e1c2f;}
.btn-g{background:var(--g);color:#0e1c2f;}.btn-ghost{background:rgba(255,255,255,.08);color:var(--text);border:1px solid var(--border);}
.btn-sm{padding:7px 15px;font-size:.78rem;}
.btn-row{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px;}
.btn-center{justify-content:center;}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--rad);padding:20px;}
.h2{font-family:'Fredoka One',cursive;font-size:1.6rem;line-height:1.2;}
.sub{color:var(--muted);font-size:.86rem;line-height:1.6;}
.chip{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:99px;font-size:.74rem;font-weight:800;}
.hl{color:var(--y);}
.mt8{margin-top:8px;}.mt14{margin-top:14px;}.mt20{margin-top:20px;}
.def-box{border-left:4px solid var(--y);background:rgba(249,193,46,.07);border-radius:0 11px 11px 0;padding:13px 15px;margin:13px 0;font-size:.91rem;line-height:1.7;}
#s-cover{background:radial-gradient(ellipse 90% 60% at 50% 0%,rgba(249,193,46,.18),transparent 60%),linear-gradient(180deg,#0e1c2f,#09121f);}
.cover-wrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:36px 18px;}
.cover-icon{font-size:4.5rem;animation:float 3s ease-in-out infinite;}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}
.cover-title{font-family:'Fredoka One',cursive;font-size:clamp(1.7rem,5.5vw,2.8rem);line-height:1.1;margin:10px 0 6px;}
.cover-chips{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:14px 0 26px;}
.tp-list{display:flex;flex-direction:column;gap:9px;margin-top:10px;}
.tp-item{display:flex;align-items:flex-start;gap:12px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;padding:12px 14px;}
.tp-num{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:900;flex-shrink:0;}
.tp-verb{font-weight:900;font-size:.86rem;margin-bottom:2px;}
.tp-desc{color:var(--muted);font-size:.79rem;line-height:1.5;}
.atp-pertemuan-grid{display:flex;flex-direction:column;gap:10px;margin:12px 0;}
.atp-p-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px;}
.atp-p-card.active-p{border-color:rgba(249,193,46,.3);background:rgba(249,193,46,.04);}
.atp-p-head{display:flex;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap;}
.atp-p-badge{padding:3px 10px;border-radius:99px;font-size:.7rem;font-weight:900;}
.atp-p-title{font-weight:900;font-size:.95rem;margin-bottom:4px;}
.atp-p-tp{font-size:.78rem;color:var(--c);margin-bottom:5px;font-weight:700;}
.atp-p-kegiatan{font-size:.76rem;color:var(--muted);line-height:1.5;margin-bottom:7px;}
.atp-p-penilaian{font-size:.7rem;font-weight:800;color:var(--g);}
.alur-steps{display:flex;flex-direction:column;gap:8px;margin:14px 0;}
.alur-step{display:flex;gap:12px;align-items:flex-start;padding:11px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);}
.alur-jp{font-size:.68rem;font-weight:900;padding:3px 9px;border-radius:99px;white-space:nowrap;flex-shrink:0;margin-top:2px;}
.alur-dur{font-size:.75rem;font-weight:900;color:var(--y);min-width:52px;flex-shrink:0;margin-top:2px;}
.alur-txt{font-size:.82rem;line-height:1.5;}
.alur-txt strong{color:var(--text);}
.ktab-row{display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:16px;}
.ktab{padding:9px 16px;font-size:.78rem;font-weight:800;cursor:pointer;color:var(--muted);border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .2s;}
.ktab.active{color:var(--y);border-bottom-color:var(--y);}
.ktab-content{display:none;animation:fadeIn .3s ease;}
.ktab-content.active{display:block;}
.tp-full-item{display:flex;gap:12px;padding:11px 13px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;margin-bottom:8px;}
.tp-full-num{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:900;flex-shrink:0;margin-top:2px;}
.tp-full-verb{font-weight:900;font-size:.84rem;margin-bottom:2px;}
.tp-full-desc{font-size:.78rem;color:var(--muted);line-height:1.5;}
.sk-shell{background:#0a0f1a;border:3px solid #1e3a5a;border-radius:16px;overflow:hidden;margin:12px 0;}
.sk-hud{background:linear-gradient(90deg,#0d1b2f,#0f2340);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #1e3a5a;gap:12px;}
.sk-hud-title{font-family:'Fredoka One',cursive;font-size:.9rem;color:var(--y);}
.sk-badge{padding:3px 10px;border-radius:99px;font-size:.7rem;font-weight:800;}
.sk-scene{position:relative;width:100%;height:180px;overflow:hidden;}
.sbg-pasar{background:linear-gradient(180deg,#87CEEB 0%,#b0d4f0 45%,#999 60%,#a08050 100%);}
.sbg-masjid{background:linear-gradient(180deg,#fce4ec 0%,#f8d7e3 45%,#81c784 100%);}
.sbg-kelas{background:linear-gradient(180deg,#e8f4fd,#d0eaf8 100%);}
.sbg-kampung{background:linear-gradient(180deg,#c8e6c9 0%,#81c784 48%,#b09060 100%);}
.sbg-hutan{background:linear-gradient(180deg,#a8d5ba 0%,#2d6a4f 48%,#1a3a2a 100%);}
.sbg-pantai{background:linear-gradient(180deg,#87ceeb 0%,#4ea8de 40%,#f2cc8f 75%,#deb887 100%);}
.sk-char{position:absolute;bottom:28%;display:flex;flex-direction:column;align-items:center;}
.sk-head{width:32px;height:32px;border-radius:50%;border:2px solid rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;font-size:1.1rem;}
.sk-body{width:24px;height:26px;border-radius:5px 5px 3px 3px;border:2px solid rgba(0,0,0,.1);margin-top:-2px;}
.sk-legs{display:flex;gap:3px;margin-top:1px;}
.sk-leg{width:8px;height:16px;border-radius:0 0 4px 4px;border:1px solid rgba(0,0,0,.1);}
.sk-dialogue{position:absolute;bottom:0;left:0;right:0;background:rgba(8,16,30,.92);border-top:2px solid #1e3a5a;padding:12px 14px;min-height:76px;}
.sk-speaker{font-size:.7rem;font-weight:800;color:var(--c);margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em;}
.sk-text{font-size:.85rem;font-weight:700;line-height:1.5;color:#e8f2ff;}
.sk-tap{font-size:.68rem;color:var(--muted);margin-top:5px;animation:tapP 1.4s ease-in-out infinite;}
@keyframes tapP{0%,100%{opacity:1;}50%{opacity:.3;}}
.sk-choices{padding:14px;}
.sk-choice-prompt{font-size:.83rem;font-weight:800;color:var(--y);margin-bottom:10px;text-align:center;}
.sk-choice{background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.1);border-radius:12px;padding:11px 14px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:10px;font-size:.83rem;font-weight:700;margin-bottom:8px;}
.sk-choice:hover{background:rgba(255,255,255,.1);border-color:var(--c);}
.sk-result{padding:14px;}
.sk-result-banner{border-radius:12px;padding:12px 14px;display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;}
.sk-result-banner.good{background:rgba(52,211,153,.1);border:2px solid rgba(52,211,153,.3);}
.sk-result-banner.bad{background:rgba(255,107,107,.1);border:2px solid rgba(255,107,107,.3);}
.sk-result-banner.mid{background:rgba(249,193,46,.1);border:2px solid rgba(249,193,46,.3);}
.sk-result-title{font-weight:900;font-size:.92rem;margin-bottom:3px;}
.sk-result-body{font-size:.8rem;line-height:1.5;color:var(--muted);}
.sk-result-banner.good .sk-result-title{color:var(--g);}
.sk-result-banner.bad .sk-result-title{color:var(--r);}
.sk-result-banner.mid .sk-result-title{color:var(--y);}
.q-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:12px;}
.q-text{font-weight:700;font-size:.9rem;line-height:1.5;margin-bottom:12px;}
.q-opts{display:flex;flex-direction:column;gap:7px;}
.q-opt{display:flex;align-items:flex-start;gap:10px;padding:10px 13px;border-radius:10px;background:rgba(255,255,255,.04);border:2px solid rgba(255,255,255,.07);cursor:pointer;font-size:.83rem;font-weight:700;transition:all .18s;line-height:1.4;}
.q-opt:hover:not(.dis){border-color:var(--c);background:rgba(62,207,207,.06);}
.q-opt.ok{border-color:var(--g);background:rgba(52,211,153,.1);color:var(--g);}
.q-opt.no{border-color:var(--r);background:rgba(255,107,107,.1);color:var(--r);}
.q-opt.shok{border-color:var(--g);background:rgba(52,211,153,.05);}
.q-opt.dis{cursor:default;pointer-events:none;}
.q-fb{padding:9px 12px;border-radius:9px;margin-top:8px;font-size:.79rem;font-weight:700;line-height:1.5;}
.q-fb.ok{background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);color:var(--g);}
.q-fb.no{background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.3);color:var(--r);}
.ftab-row{display:flex;gap:6px;margin:12px 0;flex-wrap:wrap;}
.ftab{padding:6px 12px;border-radius:99px;font-size:.76rem;font-weight:800;cursor:pointer;border:1px solid var(--border);background:rgba(255,255,255,.04);color:var(--muted);transition:all .2s;}
.hasil-circle{width:140px;height:140px;border-radius:50%;background:conic-gradient(var(--g) 0%,var(--g) var(--prog,0%),rgba(255,255,255,.06) var(--prog,0%) 100%);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;position:relative;}
.hasil-circle::before{content:'';position:absolute;inset:10px;border-radius:50%;background:var(--bg2);}
.hasil-score{position:relative;z-index:1;text-align:center;}
.refl-item{border-radius:12px;padding:12px;border:1px solid rgba(255,255,255,.08);margin-bottom:10px;}
.refl-item label{font-size:.78rem;font-weight:800;display:block;margin-bottom:5px;}
.refl-item textarea{width:100%;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-family:'Nunito',sans-serif;font-size:.8rem;resize:vertical;min-height:58px;}
.conf{position:fixed;border-radius:2px;animation:confFall linear both;pointer-events:none;z-index:9999;}
@keyframes confFall{to{transform:translateY(110vh) rotate(720deg);opacity:0;}}
#confWrap{position:fixed;inset:0;pointer-events:none;z-index:9998;}
.bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:300;background:rgba(14,28,47,.96);backdrop-filter:blur(12px);border-top:1px solid var(--border);}
.bottom-nav-progress{height:4px;background:rgba(255,255,255,.06);}
.bottom-nav-progress-fill{height:100%;background:linear-gradient(90deg,var(--g),var(--c));border-radius:99px;transition:width .5s ease-out;}
.bottom-nav-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 14px;}
.bottom-nav-btn{display:flex;align-items:center;gap:4px;padding:6px 14px;border-radius:8px;font-family:'Nunito',sans-serif;font-weight:800;font-size:.78rem;border:none;cursor:pointer;transition:all .18s;}
.bottom-nav-btn:hover:not(:disabled){background:rgba(255,255,255,.1);}
.bottom-nav-btn:disabled{opacity:.3;cursor:not-allowed;}
.bottom-nav-btn.prev{background:rgba(255,255,255,.06);color:var(--text);border:1px solid var(--border);}
.bottom-nav-btn.next{background:var(--y);color:#0e1c2f;}
.bottom-nav-dots{display:flex;align-items:center;gap:4px;flex-wrap:nowrap;overflow-x:auto;max-width:50vw;padding:2px 0;}
.bottom-nav-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;border:2px solid transparent;transition:all .2s;flex-shrink:0;background:rgba(255,255,255,.04);}
.bottom-nav-dot:hover{background:rgba(255,255,255,.1);}
.bottom-nav-dot.active{border-color:var(--g);background:rgba(52,211,153,.15);box-shadow:0 0 8px rgba(52,211,153,.3);}
.bottom-nav-dot.completed{border-color:var(--c);}
.bottom-nav-info{display:flex;align-items:center;gap:6px;}
.bottom-nav-score{display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:99px;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.2);font-size:.7rem;font-weight:800;color:var(--g);}
.bottom-nav-counter{font-size:.68rem;color:var(--muted);font-weight:700;}
.bottom-nav-reset{display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;font-size:.65rem;font-weight:700;color:var(--muted);background:transparent;border:none;cursor:pointer;transition:color .2s;margin:0 auto;}
.bottom-nav-reset:hover{color:var(--text);}
.screen{padding-bottom:72px;}`;
