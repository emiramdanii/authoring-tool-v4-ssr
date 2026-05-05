export const matchingEngineJS = `
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
`;
