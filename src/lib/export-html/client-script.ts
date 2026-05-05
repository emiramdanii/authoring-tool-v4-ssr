// ═══════════════════════════════════════════════════════════════
// CLIENT-SCRIPT — Generates the client-side <script> block
// for the student export HTML (skenario, kuis, confetti, etc.)
// ═══════════════════════════════════════════════════════════════

export interface ClientScriptData {
  skJS: string;
  kuisJS: string;
  fungsiJS: string;
  hasSkenario: boolean;
  hasMateri: boolean;
  hasKuis: boolean;
}

export function buildClientScript(data: ClientScriptData): string {
  const { skJS, kuisJS, fungsiJS, hasSkenario, hasMateri, hasKuis } = data;
  return `<script>
// ── DATA ──────────────────────────────────────────
const CHAPTERS = ${skJS};
const KUIS_SOAL = ${kuisJS};
const FUNGSI = ${fungsiJS};
const HAS_SKENARIO = ${hasSkenario};
const HAS_MATERI = ${hasMateri};
const HAS_KUIS = ${hasKuis};
let S = { score:0, skScore:0 };
let kuisAnswers = {};

// ── SCREEN NAV ─────────────────────────────────────
function goScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el = document.getElementById(id);
  if(el){ el.classList.add('active'); window.scrollTo(0,0); }
  if(id==='s-sk')  initSk();
  if(id==='s-materi') initFtab();
  if(id==='s-kuis')   renderKuis();
}

// ── CP TABS ─────────────────────────────────────────
function switchKtab(id, el){
  document.querySelectorAll('.ktab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.ktab-content').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
  const cont = document.getElementById(id);
  if(cont) cont.classList.add('active');
}

// ── SKENARIO ────────────────────────────────────────
let skCh=0, skStep=0;
function initSk(){
  if(!CHAPTERS.length){
    document.getElementById('skBody').innerHTML='<div style="padding:30px;text-align:center;color:var(--muted)">Skenario belum diisi.</div>';
    document.getElementById('btnNextAfterSk').style.display='inline-flex';
    return;
  }
  skCh=0; renderSkProg(); startChapter();
}
function renderSkProg(){
  const el=document.getElementById('skProgress');
  if(!el) return;
  el.innerHTML=CHAPTERS.map((_,i)=>
    '<div style="flex:1;height:4px;border-radius:99px;background:'+(i<skCh?'#34d399':i===skCh?'#f9c12e':'#1e3a5a')+';transition:all .3s'+(i===skCh?';box-shadow:0 0 6px #f9c12e':'')+'">'+'</div>'
  ).join('');
}
function startChapter(){
  const ch=CHAPTERS[skCh];
  if(!ch) return;
  document.getElementById('skTitle').textContent=ch.title||'';
  skStep=0; showSetup();
}
function showSetup(){
  const ch=CHAPTERS[skCh]; const step=ch.setup[skStep];
  if(!step) return showChoices();
  document.getElementById('skBody').innerHTML=
    '<div class="sk-scene '+(ch.bg||'sbg-kampung')+'">'+
      '<div class="sk-char" style="left:50%;transform:translateX(-50%)">'+
        '<div class="sk-head" style="background:#fff2d9">'+(ch.charEmoji||'😊')+'</div>'+
        '<div class="sk-body" style="background:'+(ch.charColor||'#3a7a9a')+'"></div>'+
        '<div class="sk-legs"><div class="sk-leg" style="background:'+(ch.charPants||'#3a5a7a')+'"></div><div class="sk-leg" style="background:'+(ch.charPants||'#3a5a7a')+'"></div></div>'+
      '</div>'+
    '</div>'+
    '<div class="sk-dialogue">'+
      '<div class="sk-speaker">'+step.speaker+'</div>'+
      '<div class="sk-text" id="skTypedText"></div>'+
      '<div class="sk-tap">Ketuk untuk lanjut ▶</div>'+
    '</div>';
  document.getElementById('skBody').onclick = advanceSetup;
  typeText('skTypedText', step.text||'');
}
function typeText(id, text){
  const el=document.getElementById(id); if(!el) return;
  el.textContent=''; let i=0;
  const t=setInterval(()=>{ if(i>=text.length){clearInterval(t);return;} el.textContent+=text[i++]; },22);
}
function advanceSetup(){
  document.getElementById('skBody').onclick=null;
  skStep++;
  if(skStep<CHAPTERS[skCh].setup.length) showSetup();
  else showChoices();
}
function showChoices(){
  const ch=CHAPTERS[skCh];
  document.getElementById('skBody').innerHTML=
    '<div class="sk-choices">'+
      '<div class="sk-choice-prompt">'+(ch.choicePrompt||'Apa yang kamu lakukan?')+'</div>'+
      ch.choices.map((c,i)=>
        '<div class="sk-choice" onclick="pickChoice('+i+')">'+
          '<span style="font-size:1.3rem">'+(c.icon||'')+'</span>'+
          '<div><div>'+(c.label||'')+'</div>'+
          '<div style="font-size:.72rem;color:var(--muted);font-weight:600">'+(c.detail||'')+'</div></div>'+
        '</div>'
      ).join('')+
    '</div>';
}
function pickChoice(i){
  const ch=CHAPTERS[skCh]; const c=ch.choices[i];
  S.skScore+=(c.pts||0);
  const icons={good:'🌟',mid:'🤔',bad:'⚠️'};
  document.getElementById('skBody').innerHTML=
    '<div class="sk-result">'+
      '<div class="sk-result-banner '+(c.level||'mid')+'">'+
        '<div style="font-size:2rem">'+(icons[c.level]||'💡')+'</div>'+
        '<div>'+
          '<div class="sk-result-title">'+(c.resultTitle||'')+'</div>'+
          '<div class="sk-result-body">'+(c.resultBody||'')+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:11px;padding:11px 13px;margin-bottom:10px">'+
        '<div style="font-size:.72rem;font-weight:800;color:var(--muted);text-transform:uppercase;margin-bottom:5px">🔍 Kaitannya dengan Norma</div>'+
        '<div style="font-size:.8rem;font-weight:700;color:var(--c);margin-bottom:6px">'+(c.norma||'')+'</div>'+
        (c.consequences||[]).map(k=>'<div style="display:flex;gap:8px;font-size:.8rem;margin-bottom:4px">'+k.icon+' '+k.text+'</div>').join('')+
      '</div>'+
      '<div style="text-align:center">'+
        (skCh<CHAPTERS.length-1
          ? '<button class="btn btn-y btn-sm" onclick="skCh++;renderSkProg();startChapter()">Skenario Berikutnya →</button>'
          : '<button class="btn btn-g btn-sm" onclick="endSk()">Selesai! 🎉</button>')+
      '</div>'+
    '</div>';
  document.getElementById('skScoreBadge').textContent=S.skScore+' poin';
}
function endSk(){
  document.getElementById('skBody').innerHTML=
    '<div style="padding:20px;text-align:center;background:#060d18;border-top:2px solid #1e3a5a">'+
      '<div style="font-size:3rem;margin-bottom:10px">🎭</div>'+
      '<div style="font-family:Fredoka One,cursive;font-size:1.2rem;margin-bottom:6px">Skenario Selesai!</div>'+
      '<div style="font-family:Fredoka One,cursive;font-size:1.8rem;color:var(--g)">'+S.skScore+' poin</div>'+
    '</div>';
  document.getElementById('btnNextAfterSk').style.display='inline-flex';
}

// ── FUNGSI TABS ──────────────────────────────────────
let curFtab=0;
function initFtab(){ curFtab=0; renderFtabUI(); }
function renderFtabUI(){
  document.getElementById('ftabRow').innerHTML=FUNGSI.map((f,i)=>
    '<div class="ftab'+(i===curFtab?' active':'')+'" onclick="switchFtabF('+i+')" style="'+(i===curFtab?'background:'+f.color+';color:#0e1c2f;border-color:transparent;':'')+'">'
      +f.icon+' '+f.label+'</div>'
  ).join('');
  const f=FUNGSI[curFtab];
  document.getElementById('ftabContent').innerHTML=
    '<div style="background:'+f.bg+';border:1px solid '+f.bc+';border-radius:14px;padding:16px;animation:fadeIn .3s ease">'+
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'+
        '<span style="font-size:2rem">'+f.icon+'</span>'+
        '<div style="font-weight:900;font-size:1rem;color:'+f.color+'">'+f.label+'</div>'+
      '</div>'+
      '<p style="font-size:.84rem;line-height:1.7;margin-bottom:12px">'+f.desc+'</p>'+
      f.contoh.map(c=>'<div style="display:flex;gap:8px;font-size:.8rem;margin-bottom:5px;line-height:1.5"><span style="color:'+f.color+';font-weight:900">→</span><span>'+c+'</span></div>').join('')+
      '<div style="background:rgba(255,255,255,.05);border-radius:9px;padding:10px;margin-top:10px;font-size:.8rem">'+
        '<span style="font-weight:800;color:'+f.color+'">💬 Diskusi:</span> '+f.tanya+
      '</div>'+
    '</div>';
}
function switchFtabF(i){ curFtab=i; renderFtabUI(); }

// ── KUIS ─────────────────────────────────────────────
function renderKuis(){
  kuisAnswers={};
  if(!KUIS_SOAL.length){
    document.getElementById('kuisContainer').innerHTML='<div class="card" style="text-align:center;padding:30px;color:var(--muted)">Kuis belum diisi.</div>';
    return;
  }
  document.getElementById('kuisContainer').innerHTML=KUIS_SOAL.map((s,i)=>
    '<div class="q-card">'+
      '<div class="q-text">'+(i+1)+'. '+s.q+'</div>'+
      '<div class="q-opts">'+
        (s.opts||[]).map((o,j)=>
          '<div class="q-opt" id="qo_'+i+'_'+j+'" onclick="answerQ('+i+','+j+','+s.ans+')">'+
            '<span style="font-weight:900;color:var(--c)">'+'ABCD'[j]+'.</span> '+o+
          '</div>'
        ).join('')+
      '</div>'+
      '<div id="qfb_'+i+'" style="display:none" class="q-fb"></div>'+
    '</div>'
  ).join('');
}
function answerQ(qi,choice,correct){
  if(kuisAnswers[qi]!==undefined) return;
  kuisAnswers[qi]=choice;
  document.querySelectorAll('[id^="qo_'+qi+'_"]').forEach(o=>o.classList.add('dis'));
  document.getElementById('qo_'+qi+'_'+choice).classList.add(choice===correct?'ok':'no');
  if(choice!==correct) document.getElementById('qo_'+qi+'_'+correct).classList.add('shok');
  const fb=document.getElementById('qfb_'+qi);
  fb.style.display='block';
  fb.className='q-fb '+(choice===correct?'ok':'no');
  fb.textContent=(choice===correct?'✅ Benar! ':'❌ Salah. ')+(KUIS_SOAL[qi].ex||'');
  if(Object.keys(kuisAnswers).length===KUIS_SOAL.length)
    document.getElementById('btnKuisSubmit').style.display='inline-flex';
}
function submitKuis(){
  const correct=KUIS_SOAL.filter((_,i)=>kuisAnswers[i]===KUIS_SOAL[i].ans).length;
  const skor=Math.round((correct/KUIS_SOAL.length)*100);
  goScreen('s-hasil');
  const hc=document.getElementById('hasilCircle');
  hc.style.setProperty('--prog',skor+'%');
  document.getElementById('hasilNum').textContent=skor;
  const lv=document.getElementById('hasilLevel');
  if(skor>=85){lv.textContent='🌟 Sangat Baik!';lv.style.cssText='background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);color:var(--g);padding:10px 20px;border-radius:12px;display:inline-block';}
  else if(skor>=70){lv.textContent='👍 Baik';lv.style.cssText='background:rgba(249,193,46,.1);border:1px solid rgba(249,193,46,.3);color:var(--y);padding:10px 20px;border-radius:12px;display:inline-block';}
  else{lv.textContent='💪 Perlu Latihan';lv.style.cssText='background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.3);color:var(--r);padding:10px 20px;border-radius:12px;display:inline-block';}
  if(skor>=70) launchConfetti();
}

// ── CONFETTI ─────────────────────────────────────────
function launchConfetti(){
  const w=document.getElementById('confWrap');
  const cols=['#f9c12e','#3ecfcf','#ff6b6b','#a78bfa','#34d399'];
  for(let i=0;i<80;i++){
    const c=document.createElement('div'); c.className='conf';
    const sz=4+Math.random()*9;
    c.style.cssText='left:'+Math.random()*100+'%;top:'+(-20-Math.random()*30)+'px;width:'+sz+'px;height:'+sz+'px;background:'+cols[Math.floor(Math.random()*cols.length)]+';border-radius:'+(Math.random()>.5?'50%':'2px')+';animation-duration:'+(2+Math.random()*2)+'s;animation-delay:'+(Math.random()*.6)+'s;';
    w.appendChild(c);
  }
  setTimeout(()=>w.innerHTML='',5000);
}

// ── Modules are now pre-rendered server-side via renderModuleToStyledHTML ──
// No client-side renderModules() needed — HTML is already in the DOM.

// Init
document.addEventListener('DOMContentLoaded', function(){});
<\/script>`;
}
