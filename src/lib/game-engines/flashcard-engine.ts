/* ── FLASHCARD ENGINE ───────────────────────────────────── */
export const flashcardEngine: string = `function initFlashcard(){
  if(!GAMEDATA.flashcard) return;
  Object.keys(GAMEDATA.flashcard).forEach(function(key){
    var el=document.getElementById('fc-engine-'+key);
    if(!el) return;
    var kartu=(GAMEDATA.flashcard[key].kartu||[]).filter(function(k){return k.depan||k.belakang});
    if(!kartu.length) return;
    var pgIdx=gPageIdx(key);
    var s={cur:0,flipped:false,reported:false,viewed:new Set()};
    function render(){
      var card=kartu[s.cur];
      var h='<div class="fc-wrap"><div class="fc-head"><span>🃏 Flashcard '+(s.cur+1)+'/'+kartu.length+'</span><span>'+s.viewed.size+'/'+kartu.length+' dilihat</span></div>';
      h+='<div class="fc-card'+(s.flipped?' flipped':'')+'" data-action="flip" style="perspective:800px"><div style="width:100%;height:100%;transition:transform .5s;transform-style:preserve-3d;transform:'+(s.flipped?'rotateY(180deg)':'rotateY(0deg)')+'"><div style="position:absolute;inset:0;backface-visibility:hidden;display:flex;align-items:center;justify-content:center;padding:16px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);font-size:14px;font-weight:700;color:#3ecfcf;text-align:center">'+card.depan+'</div><div style="position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg);display:flex;align-items:center;justify-content:center;padding:16px;border-radius:12px;border:1px solid rgba(62,207,207,.3);background:rgba(62,207,207,.12);font-size:14px;font-weight:700;color:#3ecfcf;text-align:center">'+card.belakang+'</div></div></div>';
      h+='<div class="fc-nav">';
      h+='<button class="fc-nav-btn" data-action="prev"'+(s.cur===0?' disabled':'')+'>← Sebelumnya</button>';
      h+='<button class="fc-nav-btn" data-action="next"'+(s.cur===kartu.length-1?' disabled':'')+'>Selanjutnya →</button>';
      h+='</div></div>';
      el.innerHTML=h;
    }
    el.addEventListener('click',function(e){
      var flip=e.target.closest('[data-action="flip"]');
      if(flip){s.flipped=!s.flipped;
        if(s.flipped) s.viewed.add(s.cur);
        render();
        if(s.viewed.size===kartu.length&&!s.reported){s.reported=true;reportScore(pgIdx,kartu.length,kartu.length);}
        return;
      }
      var prev=e.target.closest('[data-action="prev"]');
      if(prev&&s.cur>0){s.cur--;s.flipped=false;render();return;}
      var next=e.target.closest('[data-action="next"]');
      if(next&&s.cur<kartu.length-1){s.cur++;s.flipped=false;render();}
    });
    render();
  });
}`;
