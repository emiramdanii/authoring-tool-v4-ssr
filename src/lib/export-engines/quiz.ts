export const quizEngineJS = `
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
`;
