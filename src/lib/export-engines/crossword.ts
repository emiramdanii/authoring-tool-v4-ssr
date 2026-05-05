export const crosswordEngineJS = `
/* ── CROSSWORD ENGINE ──────────────────────────────────── */
function initCrossword(){
  if(!GAMEDATA.crossword) return;
  Object.keys(GAMEDATA.crossword).forEach(function(key){
    var el=document.getElementById('cw-engine-'+key);
    if(!el) return;
    var d=GAMEDATA.crossword[key];
    var kata=(d.kata||[]).filter(function(k){return k.teks&&k.teks.trim()});
    if(!kata.length) return;
    var pgIdx=gPageIdx(key);
    var SIZE=d.ukuran||12;

    // Build crossword grid
    var grid=[];
    for(var r=0;r<SIZE;r++){grid[r]=[];for(var c=0;c<SIZE;c++)grid[r][c]={letter:'',num:0,wordIds:[]};}
    var wordId=0,placedWords=[];
    var clueNum=1,acrossClues=[],downClues=[];

    // Place words
    kata.forEach(function(w){
      var text=(w.teks||'').toUpperCase().replace(/[^A-Z\u00C0-\u024F]/g,'');
      if(!text) return;
      var hint=w.petunjuk||w.hint||'';
      var dir=w.arah||'across'; // 'across' or 'down'
      var startR=w.baris!=null?w.baris-1:null;
      var startC=w.kolom!=null?w.kolom-1:null;

      // Auto-place if no position given
      if(startR===null||startC===null){
        for(var att=0;att<200;att++){
          var tr=Math.floor(Math.random()*SIZE);
          var tc=Math.floor(Math.random()*SIZE);
          var td=Math.random()>.5?'across':'down';
          var fits=true;
          for(var i=0;i<text.length;i++){
            var nr=td==='down'?tr+i:tr;
            var nc=td==='across'?tc+i:tc;
            if(nr>=SIZE||nc>=SIZE){fits=false;break;}
            var cell=grid[nr][nc];
            if(cell.letter!==''&&cell.letter!==text[i]){fits=false;break;}
          }
          if(fits){startR=tr;startC=tc;dir=td;break;}
        }
        if(startR===null) return; // couldn't place
      }

      // Place the word
      var wid=wordId++;
      for(var i=0;i<text.length;i++){
        var nr=dir==='down'?startR+i:startR;
        var nc=dir==='across'?startC+i:startC;
        if(nr>=SIZE||nc>=SIZE) break;
        grid[nr][nc].letter=text[i];
        grid[nr][nc].wordIds.push(wid);
        if(i===0&&grid[nr][nc].num===0) grid[nr][nc].num=clueNum;
      }
      var clue={num:clueNum,hint:hint||text.charAt(0)+'...',dir:dir,wid:wid,text:text,startR:startR,startC:startC};
      if(dir==='across') acrossClues.push(clue); else downClues.push(clue);
      clueNum++;
      placedWords.push({wid:wid,text:text,dir:dir,startR:startR,startC:startC});
    });

    var userGrid=[],revealed=new Set(),checked=false,phase='play';
    // Init user grid
    for(var r=0;r<SIZE;r++){userGrid[r]=[];for(var c=0;c<SIZE;c++)userGrid[r][c]='';}

    function render(){
      if(phase==='done'){
        var total=placedWords.length;
        el.innerHTML='<div class="game-result"><div class="game-result-icon">🎉</div><div class="game-result-text">Teka Silang Selesai!</div><div class="game-result-sub">'+total+' kata terisi</div><button class="qe-btn" data-action="restart">Ulangi</button></div>';
        reportScore(pgIdx,total,total);
        return;
      }
      var cs=SIZE<=10?24:SIZE<=14?18:14;
      var h='<div class="cw-wrap"><div class="cw-head"><span>🔤 Teka Silang</span><span>'+placedWords.length+' kata</span></div>';
      h+='<div class="cw-body"><div class="cw-grid" style="grid-template-columns:repeat('+SIZE+','+cs+'px)">';
      for(var r=0;r<SIZE;r++)for(var c=0;c<SIZE;c++){
        var cell=grid[r][c];
        if(cell.letter===''){
          h+='<div class="cw-cell empty"></div>';
        } else {
          var cls='cw-cell filled';
          var val=userGrid[r][c]||'';
          if(checked){
            if(val===cell.letter) cls='cw-cell correct';
            else if(val&&val!==cell.letter) cls='cw-cell wrong';
          }
          if(revealed.has(r+','+c)) {cls='cw-cell revealed';val=cell.letter;}
          h+='<div class="'+cls+'" data-r="'+r+'" data-c="'+c+'" style="position:relative">'+(cell.num?'<span class="cw-cell-num">'+cell.num+'</span>':'')+(val||'')+'</div>';
        }
      }
      h+='</div><div class="cw-clues">';
      if(acrossClues.length){
        h+='<div class="cw-clue-title">Mendatar →</div>';
        acrossClues.forEach(function(cl){
          var done=cl.text.split('').every(function(ch,i){
            var nr=cl.startR,nnc=cl.startC+i;
            return userGrid[nr]&&userGrid[nr][nnc]===ch;
          });
          h+='<div class="cw-clue'+(done?' done':'')+'" data-wid="'+cl.wid+'">'+cl.num+'. '+cl.hint+'</div>';
        });
      }
      if(downClues.length){
        h+='<div class="cw-clue-title">Menurun ↓</div>';
        downClues.forEach(function(cl){
          var done=cl.text.split('').every(function(ch,i){
            var nr=cl.dir==='down'?cl.startR+i:cl.startR;
            var nnc=cl.dir==='across'?cl.startC+i:cl.startC;
            return userGrid[nr]&&userGrid[nr][nnc]===ch;
          });
          h+='<div class="cw-clue'+(done?' done':'')+'" data-wid="'+cl.wid+'">'+cl.num+'. '+cl.hint+'</div>';
        });
      }
      h+='</div></div>';
      h+='<button class="cw-check" data-action="check">Cek Jawaban</button>';
      h+='<button class="cw-check" data-action="reveal" style="margin-left:6px;background:rgba(249,193,46,.15);border-color:rgba(249,193,46,.3);color:#f9c82e">Buka 1 Huruf</button>';
      h+='</div>';
      el.innerHTML=h;
    }

    el.addEventListener('click',function(e){
      var cell=e.target.closest('[data-r]');
      if(cell){
        var r=parseInt(cell.getAttribute('data-r')),c=parseInt(cell.getAttribute('data-c'));
        var letter=prompt('Masukkan huruf:');
        if(letter&&letter.trim()){
          userGrid[r][c]=letter.trim().toUpperCase().charAt(0);
          checked=false;
          // Check if all words complete
          var allDone=placedWords.every(function(w){
            return w.text.split('').every(function(ch,i){
              var nr=w.dir==='down'?w.startR+i:w.startR;
              var nc=w.dir==='across'?w.startC+i:w.startC;
              return userGrid[nr]&&userGrid[nr][nc]===ch;
            });
          });
          if(allDone) phase='done';
        }
        render();
      }
      var checkBtn=e.target.closest('[data-action="check"]');
      if(checkBtn){checked=true;render();setTimeout(function(){checked=false;render();},1500);}
      var revealBtn=e.target.closest('[data-action="reveal"]');
      if(revealBtn){
        // Reveal one random empty cell
        var empties=[];
        for(var r=0;r<SIZE;r++)for(var c=0;c<SIZE;c++){
          if(grid[r][c].letter&&userGrid[r][c]!==grid[r][c].letter&&!revealed.has(r+','+c))
            empties.push(r+','+c);
        }
        if(empties.length>0){
          var pick=empties[Math.floor(Math.random()*empties.length)];
          revealed.add(pick);
          var parts=pick.split(',');
          userGrid[parseInt(parts[0])][parseInt(parts[1])]=grid[parseInt(parts[0])][parseInt(parts[1])].letter;
          render();
        }
      }
      var rb=e.target.closest('[data-action="restart"]');
      if(rb){
        for(var r=0;r<SIZE;r++)for(var c=0;c<SIZE;c++)userGrid[r][c]='';
        revealed=new Set();checked=false;phase='play';render();
      }
    });
    render();
  });
}
`;
