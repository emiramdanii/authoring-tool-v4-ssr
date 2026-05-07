/* ── RODA PUTAR ENGINE — Non-scored tool (random picker) ── */
export const rodaEngine: string = `function initRoda(){
  if(!GAMEDATA.roda) return;
  Object.keys(GAMEDATA.roda).forEach(function(key){
    var el=document.getElementById('roda-engine-'+key);
    if(!el) return;
    var opsi=GAMEDATA.roda[key].opsi||[];
    if(opsi.length<2) return;
    var rot=0,spinning=false,result=null,reported=false;
    var colors=['#f9c82e','#3ecfcf','#a78bfa','#34d399','#ff6b6b','#fb923c','#60a5fa','#f472b6'];
    function makeSlices(){
      var h='';
      opsi.forEach(function(o,i){
        var sa=(i*360)/opsi.length,ea=((i+1)*360)/opsi.length;
        var sr=(sa-90)*Math.PI/180,er=(ea-90)*Math.PI/180;
        var x1=70+65*Math.cos(sr),y1=70+65*Math.sin(sr);
        var x2=70+65*Math.cos(er),y2=70+65*Math.sin(er);
        var la=ea-sa>180?1:0;
        h+='<path d="M70,70 L'+x1+','+y1+' A65,65 0 '+la+',1 '+x2+','+y2+' Z" fill="'+colors[i%colors.length]+'" opacity=".8"/>';
      });
      return h+'<circle cx="70" cy="70" r="10" fill="#1a1a2e"/>';
    }
    function render(){
      var h='<div class="roda-wrap"><div style="position:relative"><svg width="140" height="140" viewBox="0 0 140 140" class="roda-svg" style="transform:rotate('+rot+'deg)">'+makeSlices()+'</svg><div style="position:absolute;top:0;left:50%;transform:translateX(-50%) translateY(-4px);font-size:16px">▼</div></div>';
      if(result) h+='<div class="roda-result">'+result+'</div>';
      h+='<button class="roda-spin" data-action="spin"'+(spinning?' disabled':'')+'>'+(spinning?'Berputar...':'Putar!')+'</button></div>';
      el.innerHTML=h;
    }
    var pgIdx=gPageIdx(key);
    el.addEventListener('click',function(e){
      var btn=e.target.closest('[data-action="spin"]');
      if(btn&&!spinning){
        spinning=true;result=null;
        var extra=Math.floor(Math.random()*360)+360*3;
        rot+=extra;render();
        setTimeout(function(){
          spinning=false;
          var n=rot%360,sa=360/opsi.length;
          var idx=Math.floor(((360-n+sa/2)%360)/sa);
          result=opsi[Math.min(idx,opsi.length-1)];
          // Non-scored tool — report (0,0) once to mark completion
          if(!reported){reported=true;reportScore(pgIdx,0,0);}
          render();
        },2500);
      }
    });
    render();
  });
}`;
