/* ── TRUE/FALSE ENGINE ──────────────────────────────────── */
export const truefalseEngine: string = `function initTrueFalse(){
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
}`;
