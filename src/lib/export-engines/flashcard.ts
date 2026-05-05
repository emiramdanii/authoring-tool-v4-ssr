export const flashcardEngineJS = `
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
`;
