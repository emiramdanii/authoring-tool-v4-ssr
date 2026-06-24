const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PAGE_LABELS = ['01-cover','02-petunjuk','03-tujuan','04-motivasi','05-skenario','06-materi-1','07-materi-2','08-materi-3','09-diskusi','10-kuis-1','11-kuis-2','12-kuis-3','13-kuis-4','14-kuis-5','15-refleksi','16-rangkuman','17-penutup'];
const mode = process.argv[2] || 'editor';
const proofDir = process.argv[3] || '/home/z/my-project/download/v5-release-candidate-01/audit-' + mode;
fs.mkdirSync(proofDir, { recursive: true });

function run(cmd) { try { return execSync(cmd, { encoding: 'utf-8', timeout: 30000 }); } catch(e) { return e.stdout || ''; } }
function evalJs(js) { return run(`agent-browser eval '${js.replace(/'/g, "'\\''")}' --json 2>&1`); }

const clickNav = mode === 'editor'
  ? (i) => run(`agent-browser eval "(function(){var nav = document.querySelector('nav[aria-label=\\\"Alur Media\\\"]'); var btns = nav ? nav.querySelectorAll('button') : []; if (btns[${i}]) { btns[${i}].click(); return 'ok'; } return 'nf';})()" 2>&1`)
  : (i) => run(`agent-browser eval "(function(){var btns = Array.from(document.querySelectorAll('button')).filter(function(b){return b.getAttribute('aria-label') && b.getAttribute('aria-label').indexOf('Halaman') >= 0;}); if (btns[${i}]) { btns[${i}].click(); return 'ok'; } return 'nf';})()" 2>&1`);

const auditJs = `(function(){var cands = Array.from(document.querySelectorAll('[style*=scale]')); var scene = cands.find(function(el){var r = el.getBoundingClientRect(); return r.width > 800 && r.height > 400;}); if (!scene) return {error:'no scene'}; var sr = scene.getBoundingClientRect(); var scale = sr.width/1280; var SCENE_H = 720; var all = scene.querySelectorAll('*'); var overflowing = []; for (var i=0;i<all.length;i++){var el=all[i]; var r=el.getBoundingClientRect(); if(r.height<5) continue; var nb=(r.bottom-sr.top)/scale; if(nb>SCENE_H+2){overflowing.push({tag:el.tagName,cls:(el.className||'').slice(0,40),top:Math.round((r.top-sr.top)/scale),bottom:Math.round(nb),overflowBy:Math.round(nb-SCENE_H)});}} return {overflowCount:overflowing.length, maxOverflow:overflowing.length>0?overflowing[0].overflowBy:0};})()`;

const results = [];
console.log(`=== V5-RC ${mode.toUpperCase()} Audit ===`);
for (let i = 0; i < PAGE_LABELS.length; i++) {
  process.stdout.write(`[${i+1}/17] ${PAGE_LABELS[i]}... `);
  clickNav(i);
  run('agent-browser wait 1800 2>&1');
  run(`agent-browser screenshot ${path.join(proofDir, PAGE_LABELS[i] + '.png')} 2>&1`);
  const out = evalJs(auditJs);
  let audit;
  try { const s = out.indexOf('{'); const o = JSON.parse(out.slice(s)); audit = o.data?.result || o.result || o; } catch { audit = {raw: out.slice(0,100)}; }
  const cnt = audit.overflowCount || 0;
  const max = audit.maxOverflow || 0;
  console.log(cnt > 0 ? `OVERFLOW (${cnt} els, max ${max}px)` : 'OK');
  results.push({page: PAGE_LABELS[i], audit});
}
const overflowing = results.filter(r => (r.audit.overflowCount||0) > 0);
console.log(`\nTotal: ${results.length} | Overflow: ${overflowing.length} | OK: ${results.length - overflowing.length}`);
if (overflowing.length > 0) overflowing.forEach(r => console.log(`  ${r.page}: ${r.audit.overflowCount} els, max ${r.audit.maxOverflow}px`));
