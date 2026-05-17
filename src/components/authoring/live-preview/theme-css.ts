// ═══════════════════════════════════════════════════════════════
// CSS THEME OVERRIDES for Template mode
// ═══════════════════════════════════════════════════════════════

import type { LayoutTheme } from './types';

export const THEME_CSS: Record<LayoutTheme, string> = {
  colorful: `<style>
:root{--bg:#1a1030;--bg2:#251845;--card:#301f58;--border:rgba(255,255,255,.1);
  --y:#ffd166;--c:#06d6a0;--r:#ef476f;--p:#9b5de5;--g:#06d6a0;--o:#ff9f1c;
  --text:#f0e6ff;--muted:#9b8ab8;}
.screen,.navbar{background:transparent!important;}
.screen>div,.main{background:transparent!important;}
.card{background:rgba(255,255,255,.08)!important;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12)!important;}
.btn-y{background:linear-gradient(135deg,#ffd166,#ff9f1c)!important;box-shadow:0 4px 15px rgba(255,209,102,.3)!important;}
.btn-c{background:linear-gradient(135deg,#06d6a0,#0cb88e)!important;}
.btn-g{background:linear-gradient(135deg,#06d6a0,#34d399)!important;}
.chip{box-shadow:0 2px 8px rgba(0,0,0,.2)!important;}
.cover-icon{filter:drop-shadow(0 0 20px rgba(255,209,102,.4));}
.def-box{background:linear-gradient(135deg,rgba(255,209,102,.1),rgba(6,214,160,.05))!important;border-left-color:#ffd166!important;}
.sk-shell{border-color:rgba(155,93,229,.3)!important;}
</style>`,
  neon: `<style>
:root{--bg:#0a0a1a;--bg2:#0d0d24;--card:#12122e;--border:rgba(139,92,246,.15);
  --y:#c084fc;--c:#22d3ee;--r:#f472b6;--p:#8b5cf6;--g:#34d399;--o:#fb923c;
  --text:#e0e7ff;--muted:#6366f1;}
.card{background:rgba(139,92,246,.06)!important;border:1px solid rgba(139,92,246,.2)!important;box-shadow:0 0 20px rgba(139,92,246,.08)!important;}
.btn-y{background:#8b5cf6!important;box-shadow:0 0 20px rgba(139,92,246,.4),0 0 40px rgba(139,92,246,.15)!important;text-shadow:0 0 10px rgba(255,255,255,.3)!important;}
.btn-c{background:#22d3ee!important;box-shadow:0 0 20px rgba(34,211,238,.4)!important;}
.btn-g{background:#34d399!important;box-shadow:0 0 20px rgba(52,211,153,.4)!important;}
.chip{box-shadow:0 0 10px rgba(139,92,246,.2)!important;}
.cover-icon{filter:drop-shadow(0 0 25px rgba(139,92,246,.6));}
.navbar{border-bottom-color:rgba(139,92,246,.2)!important;}
.nav-prog-fill{background:linear-gradient(90deg,#8b5cf6,#22d3ee)!important;box-shadow:0 0 10px rgba(139,92,246,.4)!important;}
.q-opt:hover:not(.dis){border-color:#8b5cf6!important;box-shadow:0 0 15px rgba(139,92,246,.2)!important;}
.sk-shell{border-color:rgba(139,92,246,.3)!important;box-shadow:0 0 30px rgba(139,92,246,.1)!important;}
</style>`,
  glass: `<style>
:root{--bg:#ffffff;--bg2:#f8fafc;--card:rgba(0,0,0,.04);--border:rgba(0,0,0,.08);
  --y:#fbbf24;--c:#22d3ee;--r:#f87171;--p:#a78bfa;--g:#34d399;--o:#fb923c;
  --text:#f1f5f9;--muted:#94a3b8;}
body{background:linear-gradient(135deg,#ffffff,#f8fafc)!important;}
.card{background:rgba(255,255,255,.05)!important;backdrop-filter:blur(16px)!important;-webkit-backdrop-filter:blur(16px)!important;border:1px solid rgba(255,255,255,.1)!important;box-shadow:0 8px 32px rgba(0,0,0,.2)!important;}
.btn-y{background:rgba(251,191,36,.9)!important;backdrop-filter:blur(8px)!important;box-shadow:0 4px 20px rgba(251,191,36,.2)!important;}
.btn-c{background:rgba(34,211,238,.9)!important;backdrop-filter:blur(8px)!important;}
.btn-g{background:rgba(52,211,153,.9)!important;backdrop-filter:blur(8px)!important;}
.chip{backdrop-filter:blur(8px)!important;}
.navbar{backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important;background:rgba(30,41,59,.7)!important;}
.sk-shell{backdrop-filter:blur(12px)!important;background:rgba(255,255,255,.03)!important;border-color:rgba(255,255,255,.1)!important;}
</style>`,
  default: ``, // Uses original CSS as-is (dark classic theme)
  minimal: `<style>
:root{--bg:#fafafa;--bg2:#f5f5f5;--card:#ffffff;--border:rgba(0,0,0,.08);
  --y:#eab308;--c:#0891b2;--r:#dc2626;--p:#7c3aed;--g:#16a34a;--o:#ea580c;
  --text:#1a1a1a;--muted:#737373;}
body{color:#1a1a1a!important;}
.screen{background:var(--bg)!important;}
.card{background:var(--card)!important;border:1px solid var(--border)!important;box-shadow:none!important;backdrop-filter:none!important;}
.btn{box-shadow:none!important;transform:none!important;border-radius:8px!important;}
.btn:hover{transform:none!important;}
.cover-icon{animation:none!important;filter:none!important;}
.chip{box-shadow:none!important;}
.navbar{background:var(--bg2)!important;backdrop-filter:none!important;border-bottom-color:var(--border)!important;}
.q-opt{border:1px solid var(--border)!important;background:var(--card)!important;}
.sk-shell{border:1px solid var(--border)!important;box-shadow:none!important;}
.def-box{background:rgba(234,179,8,.06)!important;border-left-color:var(--y)!important;}
.hasil-circle{background:conic-gradient(var(--g) 0%,var(--g) var(--prog,0%),#e5e5e5 var(--prog,0%) 100%)!important;}
.hasil-circle::before{background:var(--bg2)!important;}
</style>`,
};
