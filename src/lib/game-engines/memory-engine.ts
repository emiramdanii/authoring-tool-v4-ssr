/* ── MEMORY MATCH ENGINE ────────────────────────────────── */
export const memoryEngine: string = `function initMemory(){
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
    var flipped=[],matched=new Set(),moves=0,wrongAttempts=0,phase='play';
    function render(){
      if(phase==='done'){
        var memScore=Math.max(Math.ceil(pairs.length*0.5),pairs.length-wrongAttempts);
        var memPct=Math.round(memScore/pairs.length*100);
        var memCol=memPct>=85?'#34d399':memPct>=70?'#f9c12e':'#f87171';
        el.innerHTML='<div class="game-result"><div class="game-result-icon">🎉</div><div class="game-result-text" style="color:'+memCol+'">'+memPct+'%</div><div class="game-result-sub">'+moves+' langkah'+(wrongAttempts?' · '+wrongAttempts+' salah':' · Sempurna!')+'</div><button class="qe-btn" data-action="restart">Ulangi</button></div>';
        reportScore(pgIdx,memScore,pairs.length);
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
          wrongAttempts++;
          render();
          setTimeout(function(){flipped=[];render();},800);
        }
      } else { render(); }
      var rb=e.target.closest('[data-action="restart"]');
      if(rb){flipped=[];matched=new Set();moves=0;wrongAttempts=0;phase='play';cards.sort(function(){return Math.random()-.5});render();}
    });
    render();
  });
}`;
