/* ── DRAG & DROP ENGINE ────────────────────────────────── */
export const dragdropEngine: string = `function initDragDrop(){
  if(!GAMEDATA.dragdrop) return;
  Object.keys(GAMEDATA.dragdrop).forEach(function(key){
    var el=document.getElementById('dd-engine-'+key);
    if(!el) return;
    var d=GAMEDATA.dragdrop[key];
    var items=(d.items||[]).filter(function(i){return i.teks});
    var targets=(d.target||d.targets||[]);
    if(!items.length||!targets.length) return;
    var pgIdx=gPageIdx(key);
    var placed={},phase='play',dragItem=null,ddWrong=0;

    function getUnplaced(){
      return items.filter(function(it){return !Object.values(placed).find(function(p){return p.teks===it.teks})});
    }

    function render(){
      if(phase==='done'){
        el.innerHTML='<div class="game-result"><div class="game-result-icon">🖐️</div><div class="game-result-text">Semua Terpasang!</div><div class="game-result-sub">'+items.length+' item'+(ddWrong?' · '+ddWrong+' salah':' · Sempurna!')+'</div><button class="qe-btn" data-action="restart">Ulangi</button></div>';
        var ddScore=Math.max(Math.ceil(items.length*0.5),items.length-ddWrong);
        reportScore(pgIdx,ddScore,items.length);
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
        // Wrong target - flash red + track mistake
        ddWrong++;
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
      if(rb){placed={};phase='play';dragItem=null;ddWrong=0;render();}
    });
    render();
  });
}`;
