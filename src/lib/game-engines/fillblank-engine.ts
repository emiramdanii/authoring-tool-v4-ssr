/* ── FILL-IN-THE-BLANK ENGINE ──────────────────────────── */
export const fillblankEngine: string = `function initFillBlank(){
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
}`;
