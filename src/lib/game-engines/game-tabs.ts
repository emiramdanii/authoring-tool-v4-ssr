/* ── GAME TAB SWITCHER ──────────────────────────────────── */
export const gameTabsEngine: string = `function initGameTabs(){
  document.querySelectorAll('.game-tabs').forEach(function(tabBar){
    var btns=tabBar.querySelectorAll('.game-tab-btn');
    var container=tabBar.parentElement;
    var panels=container.querySelectorAll('.game-panel');
    btns.forEach(function(btn){
      btn.addEventListener('click',function(){
        var target=btn.getAttribute('data-tab');
        btns.forEach(function(b){b.classList.remove('active');b.style.background='rgba(255,255,255,.04)';b.style.color='rgba(255,255,255,.5)'});
        btn.classList.add('active');btn.style.background='rgba(62,207,207,.2)';btn.style.color='#3ecfcf';
        panels.forEach(function(p){p.style.display=p.getAttribute('data-panel')===target?'block':'none'});
      });
    });
  });
}`;
