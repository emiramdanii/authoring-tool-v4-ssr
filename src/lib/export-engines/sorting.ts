export const sortingEngineJS = `
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
`;
