export const wordsearchEngineJS = `
/* ── WORD SEARCH ENGINE ─────────────────────────────────── */
function initWordSearch(){
  if(!GAMEDATA.wordsearch) return;
  Object.keys(GAMEDATA.wordsearch).forEach(function(key){
    var el=document.getElementById('ws-engine-'+key);
    if(!el) return;
    var d=GAMEDATA.wordsearch[key];
    var kata=(d.kata||[]).filter(function(k){return k&&k.trim()});
    var ukuran=d.ukuran||10;
    if(!kata.length) return;
    var pgIdx=gPageIdx(key);
    var grid=[],found=new Set(),selStart=null,phase='play';
    function genGrid(){
      var g=[];for(var r=0;r<ukuran;r++){g[r]=[];for(var c=0;c<ukuran;c++)g[r][c]='';}
      var dirs=[[0,1],[1,0],[1,1],[0,-1],[-1,0],[-1,-1]];
      kata.forEach(function(word){
        for(var att=0;att<50;att++){
          var dir=dirs[Math.floor(Math.random()*dirs.length)];
          var sr=Math.floor(Math.random()*ukuran),sc=Math.floor(Math.random()*ukuran);
          var fits=true;
          for(var i=0;i<word.length;i++){
            var r=sr+dir[0]*i,c=sc+dir[1]*i;
            if(r<0||r>=ukuran||c<0||c>=ukuran||(g[r][c]!==''&&g[r][c]!==word[i])){fits=false;break;}
          }
          if(fits){for(var i=0;i<word.length;i++)g[sr+dir[0]*i][sc+dir[1]*i]=word[i];break;}
        }
      });
      for(var r=0;r<ukuran;r++)for(var c=0;c<ukuran;c++)if(g[r][c]==='')g[r][c]=String.fromCharCode(65+Math.floor(Math.random()*26));
      return g;
    }
    grid=genGrid();
    function render(){
      if(phase==='done'){
        el.innerHTML='<div class="game-result"><div class="game-result-icon">🎉</div><div class="game-result-text">Semua Ditemukan!</div><button class="qe-btn" data-action="restart">Ulangi</button></div>';
        reportScore(pgIdx,kata.length,kata.length);
        return;
      }
      var cs=ukuran<=8?28:22;
      var h='<div class="ws-wrap"><div class="ws-head">🔍 Teka-Teki Kata</div><div class="ws-body">';
      h+='<div class="ws-grid" style="grid-template-columns:repeat('+ukuran+','+cs+'px)">';
      for(var r=0;r<ukuran;r++)for(var c=0;c<ukuran;c++){
        var cls='ws-cell';
        if(selStart&&selStart[0]===r&&selStart[1]===c) cls+=' sel';
        h+='<div class="'+cls+'" data-r="'+r+'" data-c="'+c+'">'+grid[r][c]+'</div>';
      }
      h+='</div><div class="ws-words">';
      kata.forEach(function(k){
        h+='<div class="ws-word '+(found.has(k)?'found-w':'pending')+'">'+k+'</div>';
      });
      h+='</div></div></div>';
      el.innerHTML=h;
    }
    el.addEventListener('click',function(e){
      var cell=e.target.closest('[data-r]');
      if(!cell||phase==='done') return;
      var r=parseInt(cell.getAttribute('data-r')),c=parseInt(cell.getAttribute('data-c'));
      if(!selStart){selStart=[r,c];render();}
      else {
        var word=selStart[0]===r&&selStart[1]===c?'':
          (grid[selStart[0]][selStart[1]]||'')+(grid[r][c]||'');
        var rev=word.split('').reverse().join('');
        var fw=kata.find(function(k){return (k===word||k===rev)&&!found.has(k)});
        if(fw){found.add(fw);if(found.size===kata.length) phase='done';}
        selStart=null;render();
      }
      var rb=e.target.closest('[data-action="restart"]');
      if(rb){found=new Set();selStart=null;phase='play';grid=genGrid();render();}
    });
    render();
  });
}
`;
