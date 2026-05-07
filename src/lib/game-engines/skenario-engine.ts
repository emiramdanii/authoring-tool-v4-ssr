/* ── SKENARIO INTERAKTIF ENGINE ──────────────────────────── */
export const skenarioEngine: string = `function initSkenario(){
  if(!GAMEDATA.skenario) return;
  Object.keys(GAMEDATA.skenario).forEach(function(key){
    var el=document.getElementById('sk-engine-'+key);
    if(!el) return;
    var chapters=GAMEDATA.skenario[key];
    if(!chapters||!chapters.length) return;
    var pgIdx=gPageIdx(key);
    var s={cur:0,score:0,answered:false,sel:-1,phase:'play',history:[]};
    function esc(t){var d=document.createElement('div');d.textContent=String(t||'');return d.innerHTML}
    function render(){
      if(s.phase==='result'){
        var maxPts=0;
        chapters.forEach(function(ch){var chs=ch.choices||[];chs.forEach(function(c){if((c.pts||0)>(maxPts-(maxPts%20)))maxPts+=20})});
        var totalMax=chapters.length*20;
        var pct=totalMax>0?Math.round(s.score/totalMax*100):0;
        var col=pct>=85?'#34d399':pct>=70?'#f9c12e':pct>=40?'#fb923c':'#f87171';
        var lvl=pct>=85?'Sangat Baik':pct>=70?'Baik':pct>=40?'Cukup':'Perlu Latihan';
        var h='<div class="sk-result"><div style="font-size:48px;margin-bottom:8px">🎭</div><div class="score" style="color:'+col+'">'+pct+'%</div><div class="level" style="color:'+col+'">'+lvl+'</div><div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:4px">Skor: '+s.score+'/'+totalMax+'</div>';
        if(s.history.length>0){
          h+='<div class="sk-history" style="margin-top:12px;text-align:left">';
          h+='<div style="font-size:9px;font-weight:700;color:rgba(244,114,182,.6);margin-bottom:4px">Riwayat Pilihan</div>';
          s.history.forEach(function(hi){
            var icon=hi.good?'✅':'❌';
            var col2=hi.good?'#34d399':'#f87171';
            h+='<div class="sk-history-item"><span style="color:'+col2+'">'+icon+'</span><span>Babak '+(hi.ch+1)+': '+esc(hi.label)+'</span></div>';
          });
          h+='</div>';
        }
        h+='<button class="sk-btn" data-action="restart">Ulangi Skenario</button></div>';
        el.innerHTML=h;
        reportScore(pgIdx,s.score,totalMax);
        return;
      }
      var ch=chapters[s.cur];
      var prog=((s.cur+1)/chapters.length*100);
      var h='<div class="sk-wrap"><div class="sk-bar"><div class="sk-bar-fill" style="width:'+prog+'%"></div></div>';
      h+='<div class="sk-head"><span>Babak '+(s.cur+1)+'/'+chapters.length+'</span><span>Skor: '+s.score+'</span></div>';
      h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><span style="font-size:18px">'+esc(ch.charEmoji||'🧑')+'</span><div class="sk-title">'+esc(ch.title||'Babak '+(s.cur+1))+'</div></div>';
      if(ch.choicePrompt) h+='<div class="sk-prompt">'+esc(ch.choicePrompt)+'</div>';
      var setup=ch.setup||[];
      if(setup.length>0){
        h+='<div class="sk-setup">';
        setup.forEach(function(l){
          var spk=esc(l.speaker||'');
          var txt=esc(l.text||'');
          h+='<div style="margin-bottom:3px"><strong style="color:rgba(244,114,182,.7)">'+spk+'</strong> <span style="color:rgba(255,255,255,.5)">'+txt+'</span></div>';
        });
        h+='</div>';
      }
      var choices=ch.choices||[];
      choices.forEach(function(c,i){
        var cls='sk-choice';
        if(s.answered){
          if(i===s.sel){
            cls+=c.good?' chosen-good':c.level==='mid'?' chosen-bad':' chosen-bad';
          } else {
            cls+=' dim';
          }
        }
        h+='<button class="'+cls+'" data-skci="'+i+'">'+esc(c.icon||'🤔')+' '+esc(c.label||'Pilihan '+(i+1))+'</button>';
      });
      if(s.answered){
        var picked=choices[s.sel];
        if(picked){
          var fbCls=picked.good?'good':picked.level==='mid'?'mid':'bad';
          h+='<div class="sk-feedback '+fbCls+'">';
          h+='<div style="font-weight:700;margin-bottom:4px">'+esc(picked.resultTitle||'')+'</div>';
          h+='<div>'+esc(picked.resultBody||'')+'</div>';
          if(picked.norma) h+='<div style="margin-top:4px;font-size:9px;opacity:.7">📋 '+esc(picked.norma)+'</div>';
          h+='</div>';
        }
      }
      h+='</div>';
      el.innerHTML=h;
    }
    el.addEventListener('click',function(e){
      var btn=e.target.closest('[data-skci]');
      if(btn&&!s.answered){
        var idx=parseInt(btn.getAttribute('data-skci'));
        s.sel=idx; s.answered=true;
        var ch=chapters[s.cur];
        var choice=(ch.choices||[])[idx];
        if(choice){
          s.score+=(choice.pts||0);
          s.history.push({ch:s.cur,label:choice.label||('Pilihan '+(idx+1)),good:!!choice.good,pts:choice.pts||0});
        }
        render();
        setTimeout(function(){
          if(s.cur+1<chapters.length){s.cur++;s.answered=false;s.sel=-1;render();}
          else{s.phase='result';render();}
        },2200);
      }
      var rb=e.target.closest('[data-action="restart"]');
      if(rb){s.cur=0;s.score=0;s.answered=false;s.sel=-1;s.phase='play';s.history=[];render();}
    });
    render();
  });
}`;
