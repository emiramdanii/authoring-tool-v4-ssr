// ═══════════════════════════════════════════════════════════════
// GAME ENGINE JS BUILDER — Vanilla JS for all interactive game
// engines in exported HTML slideshow (1-file self-contained)
// ═══════════════════════════════════════════════════════════════

// GAMEDATA structure:
//   quizzes: { "pageIdx": [...] }           — keyed by pageIdx only
//   truefalse/memory/...: { "pageIdx-gameIdx": {...} } — keyed by composite
// reportScore(pageIdx, score, max) is already defined in the export.

export function buildGameEngineJS(gamedataJSON: string): string {
  return `
var GAMEDATA = ${gamedataJSON};

/* Helper: extract pageIdx from composite key "pageIdx-gameIdx" or plain "pageIdx" */
function gPageIdx(key){return parseInt(String(key).split('-')[0])}

/* ── QUIZ ENGINE ────────────────────────────────────────── */
function initQuizzes(){
  if(!GAMEDATA.quizzes) return;
  Object.keys(GAMEDATA.quizzes).forEach(function(key){
    var el = document.getElementById('quiz-engine-'+key);
    if(!el) return;
    var qs = GAMEDATA.quizzes[key];
    if(!qs||!qs.length) return;
    var pgIdx=gPageIdx(key);
    var s = {cur:0,score:0,answered:false,sel:-1,phase:'play'};
    function render(){
      if(s.phase==='result'){
        var pct=Math.round(s.score/qs.length*100);
        var col=pct>=85?'#34d399':pct>=70?'#f9c12e':'#f87171';
        var lvl=pct>=85?'Sangat Baik':pct>=70?'Baik':'Perlu Latihan';
        el.innerHTML='<div class="qe-result"><div class="score" style="color:'+col+'">'+pct+'%</div><div class="level" style="color:'+col+'">'+lvl+'</div><div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:4px">Skor: '+s.score+'/'+qs.length+' soal benar</div><button class="qe-btn" data-action="restart">Ulangi Kuis</button></div>';
        reportScore(pgIdx,s.score,qs.length);
        return;
      }
      var q=qs[s.cur], prog=((s.cur+1)/qs.length*100);
      var L=['A','B','C','D'];
      var h='<div class="qe-wrap"><div class="qe-bar"><div class="qe-bar-fill" style="width:'+prog+'%"></div></div>';
      h+='<div class="qe-head"><span>Soal '+(s.cur+1)+'/'+qs.length+'</span><span>Skor: '+s.score+'</span></div>';
      h+='<div class="qe-q">'+q.q+'</div>';
      q.opts.forEach(function(opt,i){
        if(!opt||!opt.trim()) return;
        var cls='qe-opt';
        if(s.answered){
          if(i===q.ans) cls+=' correct';
          else if(i===s.sel) cls+=' wrong';
          else cls+=' dim';
        }
        h+='<button class="'+cls+'" data-qi="'+i+'">'+L[i]+'. '+opt+'</button>';
      });
      if(s.answered&&q.ex) h+='<div class="qe-ex">💡 '+q.ex+'</div>';
      h+='</div>';
      el.innerHTML=h;
    }
    el.addEventListener('click',function(e){
      var btn=e.target.closest('[data-qi]');
      if(btn&&!s.answered){
        var idx=parseInt(btn.getAttribute('data-qi'));
        s.sel=idx; s.answered=true;
        if(idx===qs[s.cur].ans) s.score++;
        render();
        setTimeout(function(){
          if(s.cur+1<qs.length){s.cur++;s.answered=false;s.sel=-1;render();}
          else{s.phase='result';render();}
        },1200);
      }
      var rb=e.target.closest('[data-action="restart"]');
      if(rb){s.cur=0;s.score=0;s.answered=false;s.sel=-1;s.phase='play';render();}
    });
    render();
  });
}

/* ── TRUE/FALSE ENGINE ──────────────────────────────────── */
function initTrueFalse(){
  if(!GAMEDATA.truefalse) return;
  Object.keys(GAMEDATA.truefalse).forEach(function(key){
    var el=document.getElementById('tf-engine-'+key);
    if(!el) return;
    var soal=GAMEDATA.truefalse[key];
    if(!soal||!soal.soal||!soal.soal.length) return;
    var items=soal.soal.filter(function(s){return s.teks});
    if(!items.length) return;
    var pgIdx=gPageIdx(key);
    var s={cur:0,score:0,answered:false,sel:null,phase:'play'};
    function render(){
      if(s.phase==='result'){
        var pct=Math.round(s.score/items.length*100);
        var col=pct>=85?'#34d399':pct>=70?'#f9c12e':'#f87171';
        el.innerHTML='<div class="game-result"><div class="game-result-icon">🎉</div><div class="game-result-text" style="color:'+col+'">'+pct+'%</div><div class="game-result-sub">'+s.score+'/'+items.length+' benar</div><button class="qe-btn" data-action="restart">Ulangi</button></div>';
        reportScore(pgIdx,s.score,items.length);
        return;
      }
      var q=items[s.cur], correct=q.benar;
      var h='<div class="tf-wrap"><div class="tf-head"><span>Soal '+(s.cur+1)+'/'+items.length+'</span><span>Skor: '+s.score+'</span></div>';
      h+='<div class="tf-q">'+q.teks+'</div><div class="tf-btns">';
      var ycls='tf-btn tf-yes', ncls='tf-btn tf-no';
      if(s.answered){
        if(correct===true) ycls+=' show-correct'; else ycls+=' dim';
        if(correct===false) ncls+=' show-correct'; else ncls+=' dim';
        if(s.sel===true&&correct!==true) ycls=ycls.replace(' dim','').replace(' show-correct','')+' picked-wrong';
        else if(s.sel===true&&correct===true) ycls=ycls.replace(' dim','')+' picked-correct';
        if(s.sel===false&&correct!==false) ncls=ncls.replace(' dim','').replace(' show-correct','')+' picked-wrong';
        else if(s.sel===false&&correct===false) ncls=ncls.replace(' dim','')+' picked-correct';
      }
      h+='<button class="'+ycls+'" data-ans="true"'+(s.answered?' disabled':'')+'>✅ Benar</button>';
      h+='<button class="'+ncls+'" data-ans="false"'+(s.answered?' disabled':'')+'>❌ Salah</button>';
      h+='</div></div>';
      el.innerHTML=h;
    }
    el.addEventListener('click',function(e){
      var btn=e.target.closest('[data-ans]');
      if(btn&&!s.answered){
        var val=btn.getAttribute('data-ans')==='true';
        s.sel=val; s.answered=true;
        if(val===items[s.cur].benar) s.score++;
        render();
        setTimeout(function(){
          if(s.cur+1<items.length){s.cur++;s.answered=false;s.sel=null;render();}
          else{s.phase='result';render();}
        },1200);
      }
      var rb=e.target.closest('[data-action="restart"]');
      if(rb){s.cur=0;s.score=0;s.answered=false;s.sel=null;s.phase='play';render();}
    });
    render();
  });
}

/* ── MEMORY MATCH ENGINE ────────────────────────────────── */
function initMemory(){
  if(!GAMEDATA.memory) return;
  Object.keys(GAMEDATA.memory).forEach(function(key){
    var el=document.getElementById('mem-engine-'+key);
    if(!el) return;
    var data=GAMEDATA.memory[key];
    var pairs=(data.pasangan||[]).filter(function(p){return p.kiri||p.kanan});
    if(!pairs.length) return;
    var pgIdx=gPageIdx(key);
    var cards=[];
    pairs.forEach(function(p,i){
      cards.push({id:i*2,text:p.kiri||'?'+(i+1),pairId:i,type:'L'});
      cards.push({id:i*2+1,text:p.kanan||'?'+(i+1),pairId:i,type:'R'});
    });
    cards.sort(function(){return Math.random()-.5});
    var cols=cards.length<=4?2:cards.length<=8?3:4;
    var flipped=[],matched=new Set(),moves=0,phase='play';
    function render(){
      if(phase==='done'){
        el.innerHTML='<div class="game-result"><div class="game-result-icon">🎉</div><div class="game-result-text">Selesai!</div><div class="game-result-sub">'+moves+' langkah</div><button class="qe-btn" data-action="restart">Ulangi</button></div>';
        reportScore(pgIdx,pairs.length,pairs.length);
        return;
      }
      var h='<div class="mem-wrap"><div class="mem-head"><span>🧠 Memory</span><span>Langkah: '+moves+' | '+matched.size/2+'/'+pairs.length+'</span></div>';
      h+='<div class="mem-grid" style="grid-template-columns:repeat('+cols+',1fr)">';
      cards.forEach(function(c){
        var isF=flipped.indexOf(c.id)>=0, isM=matched.has(c.id);
        var cls='mem-card '+(isM?'matched':isF?'face-up':'face-down');
        h+='<div class="'+cls+'" data-cid="'+c.id+'">'+(isF||isM?c.text:'❓')+'</div>';
      });
      h+='</div></div>';
      el.innerHTML=h;
    }
    el.addEventListener('click',function(e){
      var card=e.target.closest('[data-cid]');
      if(!card||phase==='done') return;
      var cid=parseInt(card.getAttribute('data-cid'));
      if(flipped.length===2||flipped.indexOf(cid)>=0||matched.has(cid)) return;
      flipped.push(cid);
      if(flipped.length===2){
        moves++;
        var c1=cards.find(function(c){return c.id===flipped[0]});
        var c2=cards.find(function(c){return c.id===flipped[1]});
        if(c1&&c2&&c1.pairId===c2.pairId&&c1.type!==c2.type){
          matched.add(flipped[0]);matched.add(flipped[1]);
          flipped=[];
          if(matched.size===cards.length) phase='done';
          render();
        } else {
          render();
          setTimeout(function(){flipped=[];render();},800);
        }
      } else { render(); }
      var rb=e.target.closest('[data-action="restart"]');
      if(rb){flipped=[];matched=new Set();moves=0;phase='play';cards.sort(function(){return Math.random()-.5});render();}
    });
    render();
  });
}

/* ── MATCHING ENGINE ────────────────────────────────────── */
function initMatching(){
  if(!GAMEDATA.matching) return;
  Object.keys(GAMEDATA.matching).forEach(function(key){
    var el=document.getElementById('match-engine-'+key);
    if(!el) return;
    var data=GAMEDATA.matching[key];
    var pairs=(data.pasangan||[]).filter(function(p){return p.kiri||p.kanan});
    if(!pairs.length) return;
    var pgIdx=gPageIdx(key);
    var shuffledR=pairs.map(function(p,i){return{idx:i,text:p.kanan||''}}).sort(function(){return Math.random()-.5});
    var selLeft=null,matchedL=new Set(),matchedR=new Set(),wrongKey=null,phase='play';
    function render(){
      if(phase==='done'){
        el.innerHTML='<div class="game-result"><div class="game-result-icon">🎉</div><div class="game-result-text">Semua Cocok!</div><button class="qe-btn" data-action="restart">Ulangi</button></div>';
        reportScore(pgIdx,pairs.length,pairs.length);
        return;
      }
      var h='<div class="match-wrap"><div class="match-head">🔀 Pasangkan</div><div class="match-cols"><div class="match-col">';
      pairs.forEach(function(p,i){
        var cls='match-item'+(matchedL.has(i)?' matched':selLeft===i?' selected':'');
        h+='<div class="'+cls+'" data-left="'+i+'">'+p.kiri+'</div>';
      });
      h+='</div><div class="match-col">';
      shuffledR.forEach(function(r){
        var cls='match-item'+(matchedR.has(r.idx)?' matched':wrongKey===selLeft+'-'+r.idx?' wrong':'');
        h+='<div class="'+cls+'" data-right="'+r.idx+'">'+r.text+'</div>';
      });
      h+='</div></div></div>';
      el.innerHTML=h;
    }
    el.addEventListener('click',function(e){
      var lb=e.target.closest('[data-left]');
      if(lb&&!matchedL.has(parseInt(lb.getAttribute('data-left')))){selLeft=parseInt(lb.getAttribute('data-left'));render();return;}
      var rb=e.target.closest('[data-right]');
      if(rb&&selLeft!==null){
        var rIdx=parseInt(rb.getAttribute('data-right'));
        if(matchedR.has(rIdx)) return;
        if(selLeft===rIdx){
          matchedL.add(selLeft);matchedR.add(rIdx);
          if(matchedL.size===pairs.length) phase='done';
          selLeft=null;render();
        } else {
          wrongKey=selLeft+'-'+rIdx;render();
          var wk=wrongKey;setTimeout(function(){if(wrongKey===wk){wrongKey=null;render();}},600);
          selLeft=null;
        }
      }
      var rbtn=e.target.closest('[data-action="restart"]');
      if(rbtn){selLeft=null;matchedL=new Set();matchedR=new Set();wrongKey=null;phase='play';render();}
    });
    render();
  });
}

/* ── SORTING ENGINE ─────────────────────────────────────── */
function initSorting(){
  if(!GAMEDATA.sorting) return;
  Object.keys(GAMEDATA.sorting).forEach(function(key){
    var el=document.getElementById('sort-engine-'+key);
    if(!el) return;
    var d=GAMEDATA.sorting[key];
    var cats=d.kategori||[],items=d.items||[];
    var valid=items.filter(function(i){return i.teks});
    if(!valid.length) return;
    var pgIdx=gPageIdx(key);
    var sorted={},wrongCat=null,phase='play';
    function getUnsorted(){return valid.filter(function(i){return !Object.values(sorted).flat().includes(i.teks)})}
    function render(){
      if(phase==='done'){
        el.innerHTML='<div class="game-result"><div class="game-result-icon">🎉</div><div class="game-result-text">Semua Tersortir!</div><button class="qe-btn" data-action="restart">Ulangi</button></div>';
        reportScore(pgIdx,valid.length,valid.length);
        return;
      }
      var unsorted=getUnsorted();
      var h='<div class="sort-wrap"><div class="sort-head">🔢 Klasifikasi</div><div class="sort-items">';
      unsorted.forEach(function(it){h+='<span class="sort-tag">'+it.teks+'</span>'});
      h+='</div><div class="sort-cats">';
      cats.forEach(function(cat){
        var cItems=sorted[cat.id]||[];
        var cls='sort-cat'+(wrongCat===cat.id?' wrong':'');
        h+='<div class="'+cls+'" style="border-left:3px solid '+(cat.color||'#3ecfcf')+'">';
        h+='<div class="sort-cat-label" style="color:'+(cat.color||'#3ecfcf')+'">'+cat.label+'</div>';
        h+='<div class="sort-cat-items">';
        cItems.forEach(function(t){h+='<span class="sort-cat-item">'+t+'</span>'});
        h+='</div><div class="sort-cat-btns">';
        unsorted.forEach(function(it){h+='<button class="sort-cat-btn" data-drop-item="'+it.teks+'" data-drop-cat="'+cat.id+'">+ '+it.teks+'</button>'});
        h+='</div></div>';
      });
      h+='</div></div>';
      el.innerHTML=h;
    }
    el.addEventListener('click',function(e){
      var btn=e.target.closest('[data-drop-item]');
      if(btn&&phase==='play'){
        var itemText=btn.getAttribute('data-drop-item'),catId=btn.getAttribute('data-drop-cat');
        var correctCat=valid.find(function(i){return i.teks===itemText});
        if(correctCat&&correctCat.kategori===catId){
          if(!sorted[catId]) sorted[catId]=[];
          sorted[catId].push(itemText);
          if(Object.values(sorted).flat().length===valid.length) phase='done';
          render();
        } else {
          wrongCat=catId;render();
          var wc=wrongCat;setTimeout(function(){if(wrongCat===wc){wrongCat=null;render();}},500);
        }
      }
      var rb=e.target.closest('[data-action="restart"]');
      if(rb){sorted={};wrongCat=null;phase='play';render();}
    });
    render();
  });
}

/* ── RODA PUTAR ENGINE ──────────────────────────────────── */
function initRoda(){
  if(!GAMEDATA.roda) return;
  Object.keys(GAMEDATA.roda).forEach(function(key){
    var el=document.getElementById('roda-engine-'+key);
    if(!el) return;
    var opsi=GAMEDATA.roda[key].opsi||[];
    if(opsi.length<2) return;
    var rot=0,spinning=false,result=null;
    var colors=['#f9c82e','#3ecfcf','#a78bfa','#34d399','#ff6b6b','#fb923c','#60a5fa','#f472b6'];
    function makeSlices(){
      var h='';
      opsi.forEach(function(o,i){
        var sa=(i*360)/opsi.length,ea=((i+1)*360)/opsi.length;
        var sr=(sa-90)*Math.PI/180,er=(ea-90)*Math.PI/180;
        var x1=70+65*Math.cos(sr),y1=70+65*Math.sin(sr);
        var x2=70+65*Math.cos(er),y2=70+65*Math.sin(er);
        var la=ea-sa>180?1:0;
        h+='<path d="M70,70 L'+x1+','+y1+' A65,65 0 '+la+',1 '+x2+','+y2+' Z" fill="'+colors[i%colors.length]+'" opacity=".8"/>';
      });
      return h+'<circle cx="70" cy="70" r="10" fill="#1a1a2e"/>';
    }
    function render(){
      var h='<div class="roda-wrap"><div style="position:relative"><svg width="140" height="140" viewBox="0 0 140 140" class="roda-svg" style="transform:rotate('+rot+'deg)">'+makeSlices()+'</svg><div style="position:absolute;top:0;left:50%;transform:translateX(-50%) translateY(-4px);font-size:16px">▼</div></div>';
      if(result) h+='<div class="roda-result">'+result+'</div>';
      h+='<button class="roda-spin" data-action="spin"'+(spinning?' disabled':'')+'>'+(spinning?'Berputar...':'Putar!')+'</button></div>';
      el.innerHTML=h;
    }
    el.addEventListener('click',function(e){
      var btn=e.target.closest('[data-action="spin"]');
      if(btn&&!spinning){
        spinning=true;result=null;
        var extra=Math.floor(Math.random()*360)+360*3;
        rot+=extra;render();
        setTimeout(function(){
          spinning=false;
          var n=rot%360,sa=360/opsi.length;
          var idx=Math.floor(((360-n+sa/2)%360)/sa);
          result=opsi[Math.min(idx,opsi.length-1)];
          render();
        },2500);
      }
    });
    render();
  });
}

/* ── SPINWHEEL (Roda Pertanyaan) ENGINE ─────────────────── */
function initSpinWheel(){
  if(!GAMEDATA.spinwheel) return;
  Object.keys(GAMEDATA.spinwheel).forEach(function(key){
    var el=document.getElementById('sw-engine-'+key);
    if(!el) return;
    var soal=(GAMEDATA.spinwheel[key].soal||[]).filter(function(s){return s.teks});
    if(soal.length<2) return;
    var rot=0,spinning=false,result=null;
    var colors=['#f9c82e','#3ecfcf','#a78bfa','#34d399','#ff6b6b','#fb923c','#60a5fa','#f472b6'];
    function makeSlices(){
      var h='';
      soal.forEach(function(s,i){
        var sa=(i*360)/soal.length,ea=((i+1)*360)/soal.length;
        var sr=(sa-90)*Math.PI/180,er=(ea-90)*Math.PI/180;
        var x1=70+65*Math.cos(sr),y1=70+65*Math.sin(sr);
        var x2=70+65*Math.cos(er),y2=70+65*Math.sin(er);
        var mr=((sa+ea)/2-90)*Math.PI/180;
        var tx=70+38*Math.cos(mr),ty=70+38*Math.sin(mr);
        var la=ea-sa>180?1:0;
        h+='<path d="M70,70 L'+x1+','+y1+' A65,65 0 '+la+',1 '+x2+','+y2+' Z" fill="'+colors[i%colors.length]+'" opacity=".8"/>';
        h+='<text x="'+tx+'" y="'+ty+'" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="8" font-weight="bold">'+(i+1)+'</text>';
      });
      return h+'<circle cx="70" cy="70" r="10" fill="#1a1a2e"/>';
    }
    function render(){
      var h='<div class="roda-wrap"><div style="position:relative"><svg width="140" height="140" viewBox="0 0 140 140" class="roda-svg" style="transform:rotate('+rot+'deg)">'+makeSlices()+'</svg><div style="position:absolute;top:0;left:50%;transform:translateX(-50%) translateY(-4px);font-size:16px">▼</div></div>';
      if(result){
        h+='<div style="text-align:center"><div style="font-size:9px;color:rgba(62,207,207,.5)">'+(result.kategori||'Soal')+'</div>';
        h+='<div class="roda-result">'+result.teks+'</div></div>';
      }
      h+='<button class="roda-spin" data-action="spin"'+(spinning?' disabled':'')+'>'+(spinning?'Berputar...':'Putar!')+'</button></div>';
      el.innerHTML=h;
    }
    el.addEventListener('click',function(e){
      var btn=e.target.closest('[data-action="spin"]');
      if(btn&&!spinning){
        spinning=true;result=null;
        var extra=Math.floor(Math.random()*360)+360*3;
        rot+=extra;render();
        setTimeout(function(){
          spinning=false;
          var n=rot%360,sa=360/soal.length;
          var idx=Math.floor(((360-n+sa/2)%360)/sa);
          result=soal[Math.min(idx,soal.length-1)];
          render();
        },2500);
      }
    });
    render();
  });
}

/* ── TEAM BUZZER ENGINE ─────────────────────────────────── */
function initTeamBuzzer(){
  if(!GAMEDATA.teambuzzer) return;
  Object.keys(GAMEDATA.teambuzzer).forEach(function(key){
    var el=document.getElementById('tb-engine-'+key);
    if(!el) return;
    var d=GAMEDATA.teambuzzer[key];
    var soal=(d.soal||[]).filter(function(s){return s.teks});
    var timA=d.timA||'Tim A',timB=d.timB||'Tim B';
    if(!soal.length) return;
    var pgIdx=gPageIdx(key);
    var s={cur:0,sA:0,sB:0,buzzed:null,correct:null,phase:'play'};
    function render(){
      if(s.phase==='result'){
        var w=s.sA>s.sB?timA:s.sB>s.sA?timB:'Seri';
        el.innerHTML='<div class="game-result"><div class="game-result-icon">🏆</div><div class="game-result-text">'+w+' Menang!</div><div class="game-result-sub">'+timA+': '+s.sA+' | '+timB+': '+s.sB+'</div><button class="qe-btn" data-action="restart">Ulangi</button></div>';
        var total=soal.reduce(function(a,q){return a+(q.poin||10)},0);
        reportScore(pgIdx,s.sA+s.sB,total);
        return;
      }
      var q=soal[s.cur],pts=q.poin||10;
      var h='<div class="tb-wrap"><div class="tb-head"><span>Soal '+(s.cur+1)+'/'+soal.length+'</span><span>+'+pts+' poin</span></div>';
      h+='<div class="tb-q">'+q.teks+'</div><div class="tb-teams">';
      var acls='tb-team tb-team-a'+(s.correct==='A'?' correct-team':s.buzzed?' buzzed':'');
      var bcls='tb-team tb-team-b'+(s.correct==='B'?' correct-team':s.buzzed?' buzzed':'');
      h+='<button class="'+acls+'" data-buzz="A">'+timA+' ('+s.sA+')</button>';
      h+='<button class="'+bcls+'" data-buzz="B">'+timB+' ('+s.sB+')</button>';
      h+='</div>';
      if(s.buzzed&&!s.correct){
        h+='<div class="tb-judge"><button class="tb-judge-btn tb-judge-yes" data-judge="yes">Benar ('+s.buzzed+')</button>';
        h+='<button class="tb-judge-btn tb-judge-no" data-judge="no">Salah ('+s.buzzed+')</button></div>';
      }
      h+='</div>';
      el.innerHTML=h;
    }
    el.addEventListener('click',function(e){
      var bb=e.target.closest('[data-buzz]');
      if(bb&&!s.buzzed){s.buzzed=bb.getAttribute('data-buzz');render();return;}
      var jb=e.target.closest('[data-judge]');
      if(jb&&s.buzzed){
        if(jb.getAttribute('data-judge')==='yes'){
          var pts=soal[s.cur].poin||10;
          if(s.buzzed==='A') s.sA+=pts; else s.sB+=pts;
          s.correct=s.buzzed;render();
          setTimeout(function(){
            if(s.cur+1<soal.length){s.cur++;s.buzzed=null;s.correct=null;render();}
            else{s.phase='result';render();}
          },1500);
        } else {
          s.buzzed=null;s.correct=null;render();
        }
      }
      var rb=e.target.closest('[data-action="restart"]');
      if(rb){s.cur=0;s.sA=0;s.sB=0;s.buzzed=null;s.correct=null;s.phase='play';render();}
    });
    render();
  });
}

/* ── WORD SEARCH ENGINE ─────────────────────────────────── */
function initWordSearch(){
  if(!GAMEDATA.wordsearch) return;
  Object.keys(GAMEDATA.wordsearch).forEach(function(key){
    var el=document.getElementById('ws-engine-'+key);
    if(!el) return;
    var d=GAMEDATA.wordsearch[key];
    var kata=(d.kata||[]).filter(function(k){return k&&k.trim()});
    var ukuran=d.ukuran||10;
    if(!kata.length) return;
    var pgIdx=gPageIdx(key);
    var grid=[],found=new Set(),selStart=null,phase='play';
    function genGrid(){
      var g=[];for(var r=0;r<ukuran;r++){g[r]=[];for(var c=0;c<ukuran;c++)g[r][c]='';}
      var dirs=[[0,1],[1,0],[1,1],[0,-1],[-1,0],[-1,-1]];
      kata.forEach(function(word){
        for(var att=0;att<50;att++){
          var dir=dirs[Math.floor(Math.random()*dirs.length)];
          var sr=Math.floor(Math.random()*ukuran),sc=Math.floor(Math.random()*ukuran);
          var fits=true;
          for(var i=0;i<word.length;i++){
            var r=sr+dir[0]*i,c=sc+dir[1]*i;
            if(r<0||r>=ukuran||c<0||c>=ukuran||(g[r][c]!==''&&g[r][c]!==word[i])){fits=false;break;}
          }
          if(fits){for(var i=0;i<word.length;i++)g[sr+dir[0]*i][sc+dir[1]*i]=word[i];break;}
        }
      });
      for(var r=0;r<ukuran;r++)for(var c=0;c<ukuran;c++)if(g[r][c]==='')g[r][c]=String.fromCharCode(65+Math.floor(Math.random()*26));
      return g;
    }
    grid=genGrid();
    function render(){
      if(phase==='done'){
        el.innerHTML='<div class="game-result"><div class="game-result-icon">🎉</div><div class="game-result-text">Semua Ditemukan!</div><button class="qe-btn" data-action="restart">Ulangi</button></div>';
        reportScore(pgIdx,kata.length,kata.length);
        return;
      }
      var cs=ukuran<=8?28:22;
      var h='<div class="ws-wrap"><div class="ws-head">🔍 Teka-Teki Kata</div><div class="ws-body">';
      h+='<div class="ws-grid" style="grid-template-columns:repeat('+ukuran+','+cs+'px)">';
      for(var r=0;r<ukuran;r++)for(var c=0;c<ukuran;c++){
        var cls='ws-cell';
        if(selStart&&selStart[0]===r&&selStart[1]===c) cls+=' sel';
        h+='<div class="'+cls+'" data-r="'+r+'" data-c="'+c+'">'+grid[r][c]+'</div>';
      }
      h+='</div><div class="ws-words">';
      kata.forEach(function(k){
        h+='<div class="ws-word '+(found.has(k)?'found-w':'pending')+'">'+k+'</div>';
      });
      h+='</div></div></div>';
      el.innerHTML=h;
    }
    el.addEventListener('click',function(e){
      var cell=e.target.closest('[data-r]');
      if(!cell||phase==='done') return;
      var r=parseInt(cell.getAttribute('data-r')),c=parseInt(cell.getAttribute('data-c'));
      if(!selStart){selStart=[r,c];render();}
      else {
        var word=selStart[0]===r&&selStart[1]===c?'':
          (grid[selStart[0]][selStart[1]]||'')+(grid[r][c]||'');
        var rev=word.split('').reverse().join('');
        var fw=kata.find(function(k){return (k===word||k===rev)&&!found.has(k)});
        if(fw){found.add(fw);if(found.size===kata.length) phase='done';}
        selStart=null;render();
      }
      var rb=e.target.closest('[data-action="restart"]');
      if(rb){found=new Set();selStart=null;phase='play';grid=genGrid();render();}
    });
    render();
  });
}

/* ── FLASHCARD ENGINE ───────────────────────────────────── */
function initFlashcard(){
  if(!GAMEDATA.flashcard) return;
  Object.keys(GAMEDATA.flashcard).forEach(function(key){
    var el=document.getElementById('fc-engine-'+key);
    if(!el) return;
    var kartu=(GAMEDATA.flashcard[key].kartu||[]).filter(function(k){return k.depan||k.belakang});
    if(!kartu.length) return;
    var pgIdx=gPageIdx(key);
    var s={cur:0,flipped:false,reported:false};
    function render(){
      var card=kartu[s.cur];
      var h='<div class="fc-wrap"><div class="fc-head">🃏 Flashcard '+(s.cur+1)+'/'+kartu.length+'</div>';
      h+='<div class="fc-card'+(s.flipped?' flipped':'')+'" data-action="flip">'+(s.flipped?card.belakang:card.depan)+'</div>';
      h+='<div class="fc-nav">';
      h+='<button class="fc-nav-btn" data-action="prev"'+(s.cur===0?' disabled':'')+'>← Sebelumnya</button>';
      h+='<button class="fc-nav-btn" data-action="next"'+(s.cur===kartu.length-1?' disabled':'')+'>Selanjutnya →</button>';
      h+='</div></div>';
      el.innerHTML=h;
    }
    el.addEventListener('click',function(e){
      var flip=e.target.closest('[data-action="flip"]');
      if(flip){s.flipped=!s.flipped;render();
        if(s.cur===kartu.length-1&&s.flipped&&!s.reported){s.reported=true;reportScore(pgIdx,kartu.length,kartu.length);}
        return;
      }
      var prev=e.target.closest('[data-action="prev"]');
      if(prev&&s.cur>0){s.cur--;s.flipped=false;render();return;}
      var next=e.target.closest('[data-action="next"]');
      if(next&&s.cur<kartu.length-1){s.cur++;s.flipped=false;render();}
    });
    render();
  });
}

/* ── GAME TAB SWITCHER ──────────────────────────────────── */
function initGameTabs(){
  document.querySelectorAll('.game-tabs').forEach(function(tabBar){
    var btns=tabBar.querySelectorAll('.game-tab-btn');
    var container=tabBar.parentElement;
    var panels=container.querySelectorAll('.game-panel');
    btns.forEach(function(btn){
      btn.addEventListener('click',function(){
        var target=btn.getAttribute('data-tab');
        btns.forEach(function(b){b.classList.remove('active');b.style.background='rgba(255,255,255,.04)';b.style.color='rgba(255,255,255,.5)'});
        btn.classList.add('active');btn.style.background='rgba(62,207,207,.2)';btn.style.color='#3ecfcf';
        panels.forEach(function(p){p.style.display=p.getAttribute('data-panel')===target?'block':'none'});
      });
    });
  });
}

/* ── CROSSWORD ENGINE ──────────────────────────────────── */
function initCrossword(){
  if(!GAMEDATA.crossword) return;
  Object.keys(GAMEDATA.crossword).forEach(function(key){
    var el=document.getElementById('cw-engine-'+key);
    if(!el) return;
    var d=GAMEDATA.crossword[key];
    var kata=(d.kata||[]).filter(function(k){return k.teks&&k.teks.trim()});
    if(!kata.length) return;
    var pgIdx=gPageIdx(key);
    var SIZE=d.ukuran||12;

    // Build crossword grid
    var grid=[];
    for(var r=0;r<SIZE;r++){grid[r]=[];for(var c=0;c<SIZE;c++)grid[r][c]={letter:'',num:0,wordIds:[]};}
    var wordId=0,placedWords=[];
    var clueNum=1,acrossClues=[],downClues=[];

    // Place words
    kata.forEach(function(w){
      var text=(w.teks||'').toUpperCase().replace(/[^A-Z\u00C0-\u024F]/g,'');
      if(!text) return;
      var hint=w.petunjuk||w.hint||'';
      var dir=w.arah||'across'; // 'across' or 'down'
      var startR=w.baris!=null?w.baris-1:null;
      var startC=w.kolom!=null?w.kolom-1:null;

      // Auto-place if no position given
      if(startR===null||startC===null){
        for(var att=0;att<200;att++){
          var tr=Math.floor(Math.random()*SIZE);
          var tc=Math.floor(Math.random()*SIZE);
          var td=Math.random()>.5?'across':'down';
          var fits=true;
          for(var i=0;i<text.length;i++){
            var nr=td==='down'?tr+i:tr;
            var nc=td==='across'?tc+i:tc;
            if(nr>=SIZE||nc>=SIZE){fits=false;break;}
            var cell=grid[nr][nc];
            if(cell.letter!==''&&cell.letter!==text[i]){fits=false;break;}
          }
          if(fits){startR=tr;startC=tc;dir=td;break;}
        }
        if(startR===null) return; // couldn't place
      }

      // Place the word
      var wid=wordId++;
      for(var i=0;i<text.length;i++){
        var nr=dir==='down'?startR+i:startR;
        var nc=dir==='across'?startC+i:startC;
        if(nr>=SIZE||nc>=SIZE) break;
        grid[nr][nc].letter=text[i];
        grid[nr][nc].wordIds.push(wid);
        if(i===0&&grid[nr][nc].num===0) grid[nr][nc].num=clueNum;
      }
      var clue={num:clueNum,hint:hint||text.charAt(0)+'...',dir:dir,wid:wid,text:text,startR:startR,startC:startC};
      if(dir==='across') acrossClues.push(clue); else downClues.push(clue);
      clueNum++;
      placedWords.push({wid:wid,text:text,dir:dir,startR:startR,startC:startC});
    });

    var userGrid=[],revealed=new Set(),checked=false,phase='play';
    // Init user grid
    for(var r=0;r<SIZE;r++){userGrid[r]=[];for(var c=0;c<SIZE;c++)userGrid[r][c]='';}

    function render(){
      if(phase==='done'){
        var total=placedWords.length;
        el.innerHTML='<div class="game-result"><div class="game-result-icon">🎉</div><div class="game-result-text">Teka Silang Selesai!</div><div class="game-result-sub">'+total+' kata terisi</div><button class="qe-btn" data-action="restart">Ulangi</button></div>';
        reportScore(pgIdx,total,total);
        return;
      }
      var cs=SIZE<=10?24:SIZE<=14?18:14;
      var h='<div class="cw-wrap"><div class="cw-head"><span>🔤 Teka Silang</span><span>'+placedWords.length+' kata</span></div>';
      h+='<div class="cw-body"><div class="cw-grid" style="grid-template-columns:repeat('+SIZE+','+cs+'px)">';
      for(var r=0;r<SIZE;r++)for(var c=0;c<SIZE;c++){
        var cell=grid[r][c];
        if(cell.letter===''){
          h+='<div class="cw-cell empty"></div>';
        } else {
          var cls='cw-cell filled';
          var val=userGrid[r][c]||'';
          if(checked){
            if(val===cell.letter) cls='cw-cell correct';
            else if(val&&val!==cell.letter) cls='cw-cell wrong';
          }
          if(revealed.has(r+','+c)) {cls='cw-cell revealed';val=cell.letter;}
          h+='<div class="'+cls+'" data-r="'+r+'" data-c="'+c+'" style="position:relative">'+(cell.num?'<span class="cw-cell-num">'+cell.num+'</span>':'')+(val||'')+'</div>';
        }
      }
      h+='</div><div class="cw-clues">';
      if(acrossClues.length){
        h+='<div class="cw-clue-title">Mendatar →</div>';
        acrossClues.forEach(function(cl){
          var done=cl.text.split('').every(function(ch,i){
            var nr=cl.startR,nnc=cl.startC+i;
            return userGrid[nr]&&userGrid[nr][nnc]===ch;
          });
          h+='<div class="cw-clue'+(done?' done':'')+'" data-wid="'+cl.wid+'">'+cl.num+'. '+cl.hint+'</div>';
        });
      }
      if(downClues.length){
        h+='<div class="cw-clue-title">Menurun ↓</div>';
        downClues.forEach(function(cl){
          var done=cl.text.split('').every(function(ch,i){
            var nr=cl.dir==='down'?cl.startR+i:cl.startR;
            var nnc=cl.dir==='across'?cl.startC+i:cl.startC;
            return userGrid[nr]&&userGrid[nr][nnc]===ch;
          });
          h+='<div class="cw-clue'+(done?' done':'')+'" data-wid="'+cl.wid+'">'+cl.num+'. '+cl.hint+'</div>';
        });
      }
      h+='</div></div>';
      h+='<button class="cw-check" data-action="check">Cek Jawaban</button>';
      h+='<button class="cw-check" data-action="reveal" style="margin-left:6px;background:rgba(249,193,46,.15);border-color:rgba(249,193,46,.3);color:#f9c82e">Buka 1 Huruf</button>';
      h+='</div>';
      el.innerHTML=h;
    }

    el.addEventListener('click',function(e){
      var cell=e.target.closest('[data-r]');
      if(cell){
        var r=parseInt(cell.getAttribute('data-r')),c=parseInt(cell.getAttribute('data-c'));
        var letter=prompt('Masukkan huruf:');
        if(letter&&letter.trim()){
          userGrid[r][c]=letter.trim().toUpperCase().charAt(0);
          checked=false;
          // Check if all words complete
          var allDone=placedWords.every(function(w){
            return w.text.split('').every(function(ch,i){
              var nr=w.dir==='down'?w.startR+i:w.startR;
              var nc=w.dir==='across'?w.startC+i:w.startC;
              return userGrid[nr]&&userGrid[nr][nc]===ch;
            });
          });
          if(allDone) phase='done';
        }
        render();
      }
      var checkBtn=e.target.closest('[data-action="check"]');
      if(checkBtn){checked=true;render();setTimeout(function(){checked=false;render();},1500);}
      var revealBtn=e.target.closest('[data-action="reveal"]');
      if(revealBtn){
        // Reveal one random empty cell
        var empties=[];
        for(var r=0;r<SIZE;r++)for(var c=0;c<SIZE;c++){
          if(grid[r][c].letter&&userGrid[r][c]!==grid[r][c].letter&&!revealed.has(r+','+c))
            empties.push(r+','+c);
        }
        if(empties.length>0){
          var pick=empties[Math.floor(Math.random()*empties.length)];
          revealed.add(pick);
          var parts=pick.split(',');
          userGrid[parseInt(parts[0])][parseInt(parts[1])]=grid[parseInt(parts[0])][parseInt(parts[1])].letter;
          render();
        }
      }
      var rb=e.target.closest('[data-action="restart"]');
      if(rb){
        for(var r=0;r<SIZE;r++)for(var c=0;c<SIZE;c++)userGrid[r][c]='';
        revealed=new Set();checked=false;phase='play';render();
      }
    });
    render();
  });
}

/* ── FILL-IN-THE-BLANK ENGINE ──────────────────────────── */
function initFillBlank(){
  if(!GAMEDATA.fillblank) return;
  Object.keys(GAMEDATA.fillblank).forEach(function(key){
    var el=document.getElementById('fb-engine-'+key);
    if(!el) return;
    var d=GAMEDATA.fillblank[key];
    var soal=(d.soal||[]).filter(function(s){return s.teks&&s.jawaban});
    if(!soal.length) return;
    var pgIdx=gPageIdx(key);
    var s={cur:0,score:0,answered:false,phase:'play'};

    function render(){
      if(s.phase==='result'){
        var pct=Math.round(s.score/soal.length*100);
        var col=pct>=85?'#34d399':pct>=70?'#f9c12e':'#f87171';
        var lvl=pct>=85?'Sangat Baik':pct>=70?'Baik':'Perlu Latihan';
        el.innerHTML='<div class="game-result"><div class="game-result-icon">✏️</div><div class="game-result-text" style="color:'+col+'">'+pct+'%</div><div class="game-result-sub">'+s.score+'/'+soal.length+' benar</div><button class="qe-btn" data-action="restart">Ulangi</button></div>';
        reportScore(pgIdx,s.score,soal.length);
        return;
      }
      var q=soal[s.cur],prog=((s.cur+1)/soal.length*100);
      // Render question with blanks shown as underlines
      var qText=q.teks;
      var blankMark='___';
      var parts=qText.split(blankMark);
      var h='<div class="fib-wrap"><div class="fib-bar"><div class="fib-bar-fill" style="width:'+prog+'%"></div></div>';
      h+='<div class="fib-head"><span>Soal '+(s.cur+1)+'/'+soal.length+'</span><span>Skor: '+s.score+'</span></div>';
      h+='<div class="fib-q">';
      if(parts.length>1){
        h+=parts[0]+'<span class="fib-blank'+(s.answered?' active':'')+'">'+(s.answered?'(jawaban)':'___')+'</span>'+parts.slice(1).join('');
      } else {
        h+=qText;
      }
      h+='</div>';
      h+='<div class="fib-input-wrap"><input class="fib-input" id="fib-input-'+key+'" type="text" placeholder="Ketik jawaban..." data-action="input"'+(s.answered?' disabled':'')+'></div>';
      if(q.petunjuk) h+='<div class="fib-hint">💡 Petunjuk: '+q.petunjuk+'</div>';
      if(!s.answered) h+='<button class="fib-btn" data-action="submit">Jawab</button>';
      else {
        var isCorrect=s.lastCorrect;
        var style=isCorrect?'background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);color:#34d399;padding:6px 10px;border-radius:6px;margin-top:6px;font-size:10px':'background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#fca5a5;padding:6px 10px;border-radius:6px;margin-top:6px;font-size:10px';
        h+='<div style="'+style+'">'+(isCorrect?'✅ Benar!':'❌ Salah. Jawaban: '+q.jawaban)+'</div>';
      }
      h+='</div>';
      el.innerHTML=h;
      // Focus input
      var inp=document.getElementById('fib-input-'+key);
      if(inp&&!s.answered) setTimeout(function(){inp.focus();},100);
    }

    el.addEventListener('click',function(e){
      var btn=e.target.closest('[data-action="submit"]');
      if(btn&&!s.answered){
        var inp=document.getElementById('fib-input-'+key);
        if(!inp||!inp.value.trim()) return;
        var userAns=inp.value.trim().toLowerCase();
        var correctAns=(soal[s.cur].jawaban||'').toLowerCase();
        // Accept multiple correct answers separated by /
        var acceptList=correctAns.split('/').map(function(a){return a.trim()});
        s.lastCorrect=acceptList.indexOf(userAns)>=0;
        if(s.lastCorrect) s.score++;
        s.answered=true;
        render();
        setTimeout(function(){
          if(s.cur+1<soal.length){s.cur++;s.answered=false;s.lastCorrect=false;render();}
          else{s.phase='result';render();}
        },1500);
      }
      var rb=e.target.closest('[data-action="restart"]');
      if(rb){s.cur=0;s.score=0;s.answered=false;s.phase='play';s.lastCorrect=false;render();}
    });
    // Also handle Enter key for input
    el.addEventListener('keydown',function(e){
      if(e.key==='Enter'&&e.target.getAttribute('data-action')==='input'&&!s.answered){
        var btn=el.querySelector('[data-action="submit"]');
        if(btn) btn.click();
      }
    });
    render();
  });
}

/* ── DRAG & DROP ENGINE ────────────────────────────────── */
function initDragDrop(){
  if(!GAMEDATA.dragdrop) return;
  Object.keys(GAMEDATA.dragdrop).forEach(function(key){
    var el=document.getElementById('dd-engine-'+key);
    if(!el) return;
    var d=GAMEDATA.dragdrop[key];
    var items=(d.items||[]).filter(function(i){return i.teks});
    var targets=(d.target||d.targets||[]);
    if(!items.length||!targets.length) return;
    var pgIdx=gPageIdx(key);
    var placed={},phase='play',dragItem=null;

    function getUnplaced(){
      return items.filter(function(it){return !Object.values(placed).find(function(p){return p.teks===it.teks})});
    }

    function render(){
      if(phase==='done'){
        el.innerHTML='<div class="game-result"><div class="game-result-icon">🖐️</div><div class="game-result-text">Semua Terpasang!</div><div class="game-result-sub">'+items.length+' item ditempatkan</div><button class="qe-btn" data-action="restart">Ulangi</button></div>';
        reportScore(pgIdx,items.length,items.length);
        return;
      }
      var unplaced=getUnplaced();
      var h='<div class="dd-wrap"><div class="dd-head">🖐️ Seret & Letakkan</div>';
      h+='<div class="dd-items">';
      unplaced.forEach(function(it){
        h+='<div class="dd-item" draggable="true" data-item="'+it.teks+'">'+it.teks+'</div>';
      });
      if(!unplaced.length) h+='<div style="font-size:9px;color:rgba(255,255,255,.25)">Semua item sudah ditempatkan</div>';
      h+='</div><div class="dd-targets">';
      targets.forEach(function(tgt){
        var tid=tgt.id||tgt.label;
        var tgtItems=placed[tid]||[];
        h+='<div class="dd-target" data-target="'+tid+'">';
        h+='<div class="dd-target-label">'+tgt.label+'</div>';
        h+='<div class="dd-target-content">';
        if(tgtItems.length){
          tgtItems.forEach(function(it){
            h+='<span class="dd-placed-item" data-remove="'+tid+'|'+it.teks+'">'+it.teks+'</span>';
          });
        } else {
          h+='<span class="dd-drop-hint">Letakkan item di sini...</span>';
        }
        h+='</div></div>';
      });
      h+='</div></div>';
      el.innerHTML=h;

      // Setup drag events
      el.querySelectorAll('.dd-item').forEach(function(item){
        item.addEventListener('dragstart',function(e){
          dragItem=e.target.getAttribute('data-item');
          e.target.classList.add('dragging');
          e.dataTransfer.setData('text/plain',dragItem);
        });
        item.addEventListener('dragend',function(e){
          e.target.classList.remove('dragging');
        });
        // Click-to-place fallback for mobile
        item.addEventListener('click',function(){
          dragItem=item.getAttribute('data-item');
          el.querySelectorAll('.dd-target').forEach(function(t){t.classList.add('drag-over')});
        });
      });
      el.querySelectorAll('.dd-target').forEach(function(tgt){
        tgt.addEventListener('dragover',function(e){e.preventDefault();tgt.classList.add('drag-over')});
        tgt.addEventListener('dragleave',function(){tgt.classList.remove('drag-over')});
        tgt.addEventListener('drop',function(e){
          e.preventDefault();tgt.classList.remove('drag-over');
          var itemText=e.dataTransfer.getData('text/plain')||dragItem;
          if(!itemText) return;
          var tid=tgt.getAttribute('data-target');
          placeItem(itemText,tid);
        });
        tgt.addEventListener('click',function(){
          if(!dragItem) return;
          var tid=tgt.getAttribute('data-target');
          placeItem(dragItem,tid);
          dragItem=null;
          el.querySelectorAll('.dd-target').forEach(function(t){t.classList.remove('drag-over')});
        });
      });
    }

    function placeItem(itemText,targetId){
      var item=items.find(function(it){return it.teks===itemText});
      if(!item) return;
      if(item.target===targetId||item.kategori===targetId){
        if(!placed[targetId]) placed[targetId]=[];
        placed[targetId].push({teks:itemText});
        if(Object.values(placed).flat().length===items.length) phase='done';
        dragItem=null;
        render();
      } else {
        // Wrong target - flash red
        var tgtEl=el.querySelector('[data-target="'+targetId+'"]');
        if(tgtEl){tgtEl.classList.add('wrong');setTimeout(function(){tgtEl.classList.remove('wrong')},500);}
        dragItem=null;
      }
    }

    el.addEventListener('click',function(e){
      var removeBtn=e.target.closest('[data-remove]');
      if(removeBtn){
        var parts=removeBtn.getAttribute('data-remove').split('|');
        var tid=parts[0],txt=parts[1];
        if(placed[tid]){
          placed[tid]=placed[tid].filter(function(it){return it.teks!==txt});
          if(!placed[tid].length) delete placed[tid];
        }
        render();
      }
      var rb=e.target.closest('[data-action="restart"]');
      if(rb){placed={};phase='play';dragItem=null;render();}
    });
    render();
  });
}

/* ── SKENARIO INTERAKTIF ENGINE ──────────────────────────── */
function initSkenario(){
  if(!GAMEDATA.skenario) return;
  Object.keys(GAMEDATA.skenario).forEach(function(key){
    var el=document.getElementById('sk-engine-'+key);
    if(!el) return;
    var chapters=GAMEDATA.skenario[key];
    if(!chapters||!chapters.length) return;
    var pgIdx=gPageIdx(key);
    var s={cur:0,score:0,answered:false,sel:-1,phase:'play',history:[]};
    function esc(t){var d=document.createElement('div');d.textContent=String(t||'');return d.innerHTML}
    function render(){
      if(s.phase==='result'){
        var maxPts=0;
        chapters.forEach(function(ch){var chs=ch.choices||[];chs.forEach(function(c){if((c.pts||0)>(maxPts-(maxPts%20)))maxPts+=20})});
        var totalMax=chapters.length*20;
        var pct=totalMax>0?Math.round(s.score/totalMax*100):0;
        var col=pct>=85?'#34d399':pct>=70?'#f9c12e':pct>=40?'#fb923c':'#f87171';
        var lvl=pct>=85?'Sangat Baik':pct>=70?'Baik':pct>=40?'Cukup':'Perlu Latihan';
        var h='<div class="sk-result"><div style="font-size:48px;margin-bottom:8px">🎭</div><div class="score" style="color:'+col+'">'+pct+'%</div><div class="level" style="color:'+col+'">'+lvl+'</div><div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:4px">Skor: '+s.score+'/'+totalMax+'</div>';
        if(s.history.length>0){
          h+='<div class="sk-history" style="margin-top:12px;text-align:left">';
          h+='<div style="font-size:9px;font-weight:700;color:rgba(244,114,182,.6);margin-bottom:4px">Riwayat Pilihan</div>';
          s.history.forEach(function(hi){
            var icon=hi.good?'✅':'❌';
            var col2=hi.good?'#34d399':'#f87171';
            h+='<div class="sk-history-item"><span style="color:'+col2+'">'+icon+'</span><span>Babak '+(hi.ch+1)+': '+esc(hi.label)+'</span></div>';
          });
          h+='</div>';
        }
        h+='<button class="sk-btn" data-action="restart">Ulangi Skenario</button></div>';
        el.innerHTML=h;
        reportScore(pgIdx,s.score,totalMax);
        return;
      }
      var ch=chapters[s.cur];
      var prog=((s.cur+1)/chapters.length*100);
      var h='<div class="sk-wrap"><div class="sk-bar"><div class="sk-bar-fill" style="width:'+prog+'%"></div></div>';
      h+='<div class="sk-head"><span>Babak '+(s.cur+1)+'/'+chapters.length+'</span><span>Skor: '+s.score+'</span></div>';
      h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><span style="font-size:18px">'+esc(ch.charEmoji||'🧑')+'</span><div class="sk-title">'+esc(ch.title||'Babak '+(s.cur+1))+'</div></div>';
      if(ch.choicePrompt) h+='<div class="sk-prompt">'+esc(ch.choicePrompt)+'</div>';
      var setup=ch.setup||[];
      if(setup.length>0){
        h+='<div class="sk-setup">';
        setup.forEach(function(l){
          var spk=esc(l.speaker||'');
          var txt=esc(l.text||'');
          h+='<div style="margin-bottom:3px"><strong style="color:rgba(244,114,182,.7)">'+spk+'</strong> <span style="color:rgba(255,255,255,.5)">'+txt+'</span></div>';
        });
        h+='</div>';
      }
      var choices=ch.choices||[];
      choices.forEach(function(c,i){
        var cls='sk-choice';
        if(s.answered){
          if(i===s.sel){
            cls+=c.good?' chosen-good':c.level==='mid'?' chosen-bad':' chosen-bad';
          } else {
            cls+=' dim';
          }
        }
        h+='<button class="'+cls+'" data-skci="'+i+'">'+esc(c.icon||'🤔')+' '+esc(c.label||'Pilihan '+(i+1))+'</button>';
      });
      if(s.answered){
        var picked=choices[s.sel];
        if(picked){
          var fbCls=picked.good?'good':picked.level==='mid'?'mid':'bad';
          h+='<div class="sk-feedback '+fbCls+'">';
          h+='<div style="font-weight:700;margin-bottom:4px">'+esc(picked.resultTitle||'')+'</div>';
          h+='<div>'+esc(picked.resultBody||'')+'</div>';
          if(picked.norma) h+='<div style="margin-top:4px;font-size:9px;opacity:.7">📋 '+esc(picked.norma)+'</div>';
          h+='</div>';
        }
      }
      h+='</div>';
      el.innerHTML=h;
    }
    el.addEventListener('click',function(e){
      var btn=e.target.closest('[data-skci]');
      if(btn&&!s.answered){
        var idx=parseInt(btn.getAttribute('data-skci'));
        s.sel=idx; s.answered=true;
        var ch=chapters[s.cur];
        var choice=(ch.choices||[])[idx];
        if(choice){
          s.score+=(choice.pts||0);
          s.history.push({ch:s.cur,label:choice.label||('Pilihan '+(idx+1)),good:!!choice.good,pts:choice.pts||0});
        }
        render();
        setTimeout(function(){
          if(s.cur+1<chapters.length){s.cur++;s.answered=false;s.sel=-1;render();}
          else{s.phase='result';render();}
        },2200);
      }
      var rb=e.target.closest('[data-action="restart"]');
      if(rb){s.cur=0;s.score=0;s.answered=false;s.sel=-1;s.phase='play';s.history=[];render();}
    });
    render();
  });
}

/* ── INIT ALL ───────────────────────────────────────────── */
function initAllGames(){
  initQuizzes();
  initTrueFalse();
  initMemory();
  initMatching();
  initSorting();
  initRoda();
  initSpinWheel();
  initTeamBuzzer();
  initWordSearch();
  initFlashcard();
  initCrossword();
  initFillBlank();
  initDragDrop();
  initSkenario();
  initGameTabs();
}
`;
}
