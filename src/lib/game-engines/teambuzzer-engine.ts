/* ── TEAM BUZZER ENGINE ─────────────────────────────────── */
export const teambuzzerEngine: string = `function initTeamBuzzer(){
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
}`;
