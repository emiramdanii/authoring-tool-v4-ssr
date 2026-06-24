(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,96359,e=>{"use strict";let t=["#f9c12e","#3ecfcf","#34d399","#a78bfa","#ff6b6b","#fb923c","#fbbf24","#22d3ee","#f472b6","#818cf8"],a=["★","●","■","◆","✦","♥","✿","⬟"],r=!1;function n(){if(r||"u"<typeof document)return;r=!0;let e=document.createElement("style");e.id="confetti-enhanced-keyframes",e.textContent=`
    /* ── Main trajectory with gravity-like deceleration ── */
    @keyframes confettiBurst {
      0% {
        transform: translate(0, 0) rotate(0deg) scale(1);
        opacity: 1;
      }
      15% {
        transform: translate(calc(var(--dx) * 0.4), calc(var(--dy) * 0.5)) rotate(calc(var(--rot) * 0.2)) scale(1.05);
        opacity: 1;
      }
      40% {
        transform: translate(calc(var(--dx) * 0.8), calc(var(--dy) * 0.85)) rotate(calc(var(--rot) * 0.55)) scale(0.85);
        opacity: 0.95;
      }
      70% {
        transform: translate(var(--dx), calc(var(--dy) + 300px)) rotate(calc(var(--rot) * 0.85)) scale(0.5);
        opacity: 0.6;
      }
      100% {
        transform: translate(calc(var(--dx) + var(--drift) * 1.5), calc(var(--dy) + 600px)) rotate(var(--rot)) scale(0.2);
        opacity: 0;
      }
    }

    /* ── Side cannon trajectory — launches from edges inward ── */
    @keyframes confettiSideBurst {
      0% {
        transform: translate(0, 0) rotate(0deg) scale(1);
        opacity: 1;
      }
      20% {
        transform: translate(calc(var(--sx) * 0.6), calc(var(--sy) * 0.5)) rotate(calc(var(--rot) * 0.3)) scale(1.1);
        opacity: 1;
      }
      50% {
        transform: translate(var(--sx), calc(var(--sy) + 200px)) rotate(calc(var(--rot) * 0.7)) scale(0.7);
        opacity: 0.8;
      }
      100% {
        transform: translate(calc(var(--sx) + var(--drift) * 2), calc(var(--sy) + 700px)) rotate(var(--rot)) scale(0.15);
        opacity: 0;
      }
    }

    /* ── Horizontal drift animation ── */
    @keyframes confettiDrift {
      0% { margin-left: 0; }
      25% { margin-left: var(--drift); }
      50% { margin-left: calc(var(--drift) * -0.5); }
      75% { margin-left: calc(var(--drift) * 0.8); }
      100% { margin-left: var(--drift); }
    }

    /* ── Shimmer / sparkle opacity pulse ── */
    @keyframes confettiShimmer {
      0%, 100% { opacity: 1; }
      30% { opacity: 0.5; }
      60% { opacity: 1; }
      80% { opacity: 0.7; }
    }

    /* ── Tumble rotation for shape particles ── */
    @keyframes confettiTumble {
      0% { transform: rotate(0deg) rotateY(0deg); }
      25% { transform: rotate(90deg) rotateY(180deg); }
      50% { transform: rotate(180deg) rotateY(360deg); }
      75% { transform: rotate(270deg) rotateY(540deg); }
      100% { transform: rotate(360deg) rotateY(720deg); }
    }
  `,document.head.appendChild(e)}function l(){let e=Math.random();return e<.35?"rect":e<.55?"circle":e<.8?"star":"diamond"}function o(e){let{x:t,y:r,color:n,shape:l,dx:o,dy:i,rotation:s,drift:c,delay:d,duration:m,shimmer:u,wrapper:h,animationType:f,sx:p=0,sy:x=0}=e,g=document.createElement("div"),y=6+8*Math.random();if("star"===l||"diamond"===l){let e="star"===l?a[Math.floor(2*Math.random())]:a[3];g.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${r}px;
      font-size: ${1.4*y}px;
      color: ${n};
      pointer-events: none;
      will-change: transform, opacity;
      line-height: 1;
      animation: ${"side"===f?"confettiSideBurst":"confettiBurst"} ${m}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${o}px;
      --dy: ${i}px;
      --rot: ${s}deg;
      --drift: ${c}px;
      --sx: ${p}px;
      --sy: ${x}px;
    `,Math.random()>.3&&(g.style.animation+=`, confettiTumble ${1200+800*Math.random()}ms linear ${d}ms infinite`),g.textContent=e}else{let e="circle"===l;g.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${r}px;
      width: ${y}px;
      height: ${e?y:.5*y}px;
      background: ${n};
      border-radius: ${e?"50%":"2px"};
      pointer-events: none;
      will-change: transform, opacity;
      animation: ${"side"===f?"confettiSideBurst":"confettiBurst"} ${m}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${o}px;
      --dy: ${i}px;
      --rot: ${s}deg;
      --drift: ${c}px;
      --sx: ${p}px;
      --sy: ${x}px;
    `}u&&.3>Math.random()&&(g.style.animation+=`, confettiShimmer ${400+300*Math.random()}ms ease-in-out ${d}ms infinite`),h.appendChild(g)}function i(e){let t=document.createElement("div");return t.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 9999; overflow: hidden;
  `,e.appendChild(t),t}function s(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function c(e={}){if(s())return;n();let{count:a=50,duration:r=3e3,container:d=document.body,originX:m=.5,originY:u=.3}=e,h=i(d),f=window.innerWidth*m,p=window.innerHeight*u;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,n=200+400*Math.random(),i=Math.cos(a)*n,s=Math.sin(a)*n-300,c=720*Math.random()-360,d=(Math.random()-.5)*120,m=200*Math.random();o({x:f,y:p,color:e,shape:l(),dx:i,dy:s,rotation:c,drift:d,delay:m,duration:r,shimmer:!0,wrapper:h,animationType:"center"})}setTimeout(()=>{h.remove()},r+500)}function d(e={}){if(s())return;n();let{count:a=70,duration:r=3500,container:c=document.body}=e,m=i(c),u=window.innerWidth,h=window.innerHeight,f=Math.floor(a/2);for(let e=0;e<f;e++){let e=t[Math.floor(Math.random()*t.length)],a=h*(.5+.3*Math.random()),n=u*(.2+.4*Math.random()),i=-(.2*h+Math.random()*h*.3),s=720*Math.random()-360,c=20+60*Math.random(),d=300*Math.random();o({x:0,y:a,color:e,shape:l(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:r,shimmer:!0,wrapper:m,animationType:"side",sx:n,sy:i})}for(let e=0;e<f;e++){let e=t[Math.floor(Math.random()*t.length)],a=h*(.5+.3*Math.random()),n=-(u*(.2+.4*Math.random())),i=-(.2*h+Math.random()*h*.3),s=720*Math.random()-360,c=-(20+60*Math.random()),d=300*Math.random();o({x:u,y:a,color:e,shape:l(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:r,shimmer:!0,wrapper:m,animationType:"side",sx:n,sy:i})}setTimeout(()=>{m.remove()},r+500)}e.s(["fireConfetti",0,c,"fireConfettiCelebration",0,function(e={}){if(s())return;let{count:t=60,duration:a=3500,container:r=document.body}=e;d({count:t+10,duration:a,container:r}),setTimeout(()=>{c({count:t,duration:a-200,container:r,originX:.5,originY:.3})},300),setTimeout(()=>{d({count:Math.floor(.7*t),duration:a-400,container:r})},600)},"fireConfettiMini",0,function(e={}){if(s())return;n();let{count:a=9,duration:r=1200,container:c=document.body,originX:d=.5,originY:m=.5}=e,u=i(c),h=window.innerWidth*d,f=window.innerHeight*m;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,n=80+150*Math.random(),i=Math.cos(a)*n,s=Math.sin(a)*n-100,c=360*Math.random()-180,d=(Math.random()-.5)*40,m=100*Math.random();o({x:h,y:f,color:e,shape:l(),dx:i,dy:s,rotation:c,drift:d,delay:m,duration:r,shimmer:!1,wrapper:u,animationType:"center"})}setTimeout(()=>{u.remove()},r+300)}])},12475,37230,e=>{"use strict";let t=(0,e.i(75254).default)("dumbbell",[["path",{d:"M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z",key:"9m4mmf"}],["path",{d:"m2.5 21.5 1.4-1.4",key:"17g3f0"}],["path",{d:"m20.1 3.9 1.4-1.4",key:"1qn309"}],["path",{d:"M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z",key:"1t2c92"}],["path",{d:"m9.6 14.4 4.8-4.8",key:"6umqxw"}]]);e.s(["Dumbbell",0,t],12475);var a=e.i(71645),r=e.i(73829);e.s(["useGameA11y",0,function(e){let{gameType:t,blockId:n,score:l,maxScore:o,interactive:i}=e,s=(0,a.useRef)(l);(0,a.useEffect)(()=>{i&&(l!==s.current&&l>s.current&&(0,r.announceToScreenReader)(`Skor: ${l}`,"polite"),s.current=l)},[l,i]);let c=(0,r.gameAriaLabel)(t,l,o),d=`game-instructions-${n||"game"}`,m=i?{role:"application","aria-label":c,"aria-describedby":d}:{"aria-label":c},u=(0,a.useCallback)((e,t="polite")=>{(0,r.announceToScreenReader)(e,t)},[]),h=(0,a.useCallback)(()=>{(0,r.announceToScreenReader)("Benar!","assertive")},[]),f=(0,a.useCallback)(e=>{let t=e?`Salah. Jawaban yang benar: ${e}`:"Salah!";(0,r.announceToScreenReader)(t,"assertive")},[]),p=(0,a.useCallback)((e,t)=>{let a=t>0?Math.round(e/t*100):0;(0,r.announceToScreenReader)(`Game selesai! ${a>=80?"Luar Biasa":a>=50?"Bagus":"Terus Berlatih"}. Skor kamu: ${e} dari ${t} (${a}%)`,"assertive")},[]),x=(0,a.useCallback)(e=>{(0,r.announceToScreenReader)(`Skor: ${e}`,"polite")},[]),g=(0,a.useCallback)((e,t,a)=>(0,r.progressBarAria)(e,t,a),[]),y=(0,a.useCallback)((e="polite")=>(0,r.liveRegion)(e),[]);return{ariaLabel:c,rootAria:m,progressAria:g,liveAria:y,instructionId:d,announce:u,announceCorrect:h,announceIncorrect:f,announceComplete:p,announceScore:x,rovingFocus:(0,a.useCallback)((e,t,a,n="both",l)=>(0,r.handleRovingFocus)(e,t,a,n,l),[]),isActivation:(0,a.useCallback)(e=>(0,r.isActivationKey)(e),[])}}],37230)},21017,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(12475),n=e.i(61051),l=e.i(27700),o=e.i(5262),i=e.i(96359),s=e.i(37230),c=e.i(52926);let d=[[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]],m=a.default.memo(function({block:e,tokens:m,interactive:u,isCompact:h,isEditing:f,pageIndex:p}){let x=m.edu("word-search-game",h),g=e.words||[],y=e.gridSize||Math.max(8,Math.ceil(Math.sqrt(3*g.join("").length))),b=g.join(","),[k,v]=a.default.useState(0),{grid:w,placements:M}=a.default.useMemo(()=>(function(e,t){let a=Array.from({length:t},()=>Array(t).fill("")),r=[];for(let n of[...e].sort((e,t)=>t.length-e.length)){let e=n.toUpperCase();for(let n=0;n<100;n++){let[n,l]=d[Math.floor(Math.random()*d.length)],o=0===n?t-1:n>0?t-e.length:e.length-1,i=0===l?t-1:l>0?t-e.length:e.length-1,s=n<0?e.length-1:0,c=l<0?e.length-1:0;if(o<s||i<c)continue;let m=s+Math.floor(Math.random()*(o-s+1)),u=c+Math.floor(Math.random()*(i-c+1)),h=!0,f=[];for(let r=0;r<e.length;r++){let o=m+n*r,i=u+l*r;if(o<0||o>=t||i<0||i>=t||""!==a[o][i]&&a[o][i]!==e[r]){h=!1;break}f.push([o,i])}if(h){for(let t=0;t<e.length;t++)a[f[t][0]][f[t][1]]=e[t];r.push({word:e,cells:f});break}}}let n="ABCDEFGHIJKLMNOPQRSTUVWXYZ";for(let e=0;e<t;e++)for(let r=0;r<t;r++)""===a[e][r]&&(a[e][r]=n[Math.floor(Math.random()*n.length)]);return{grid:a,placements:r}})(g,y),[k,y,b]),[j,$]=a.default.useState(new Set),[S,T]=a.default.useState(new Set),[N,B]=a.default.useState(null),[C,A]=a.default.useState(0),[z,I]=a.default.useState("play"),K=(0,s.useGameA11y)({gameType:"Teka-Teki Kata",blockId:e.id,score:j.size,maxScore:M.length,interactive:u??!1}),R=(0,l.useInteractiveStore)(e=>e.replayGeneration);a.default.useEffect(()=>{$(new Set),T(new Set),B(null),A(0),I("play"),v(e=>e+1)},[R]);let P=(0,l.useInteractiveStore)(e=>e.reportScore),E=a.default.useRef(!1);a.default.useEffect(()=>{if("done"===z&&u&&e.id&&!E.current){E.current=!0;let t=Math.max(Math.ceil(.5*M.length),M.length-C);P({elementId:e.id,pageIndex:p??0,score:t,maxScore:M.length,completed:!0});let a=M.length>0?Math.round(t/M.length*100):0;a>=80?((0,o.playSound)("complete"),(0,i.fireConfettiCelebration)()):a>=50?((0,o.playSound)("complete"),(0,i.fireConfetti)({count:30})):(0,o.playSound)("ding"),K.announceComplete(t,M.length)}"done"!==z&&(E.current=!1)},[z,u,e.id,C,M.length,P,p]);let D=(0,n.useInlineEditor)({blockId:e.id,fieldKey:"title",value:e.title??"",tag:"span"}),G=a.default.useCallback((e,t)=>{if(!u||"play"!==z)return;if(!N)return void B([e,t]);if(N[0]===e&&N[1]===t)return void B(null);let a=function(e,t){let[a,r]=e,[n,l]=t,o=Math.sign(n-a),i=Math.sign(l-r);if(0===o&&0===i)return null;let s=Math.abs(n-a),c=Math.abs(l-r);if((0!==o||0===i)&&(0!==i||0===o)&&(s!==c||0===o||0===i))return null;let d=Math.max(s,c),m=[];for(let e=0;e<=d;e++)m.push([a+o*e,r+i*e]);return m}(N,[e,t]);if(!a){(0,o.playSound)("incorrect"),A(e=>e+1),B(null);return}let r=a.map(([e,t])=>w[e][t]).join(""),n=r.split("").reverse().join(""),l=M.find(e=>!j.has(e.word)&&(e.word===r||e.word===n));if(l){(0,o.playSound)("correct");let e=new Set(j);e.add(l.word),$(e),K.announceCorrect(),K.announce(`Kata ditemukan: ${l.word}. ${e.size} dari ${M.length}`,"assertive");let t=new Set(S);l.cells.forEach(([e,a])=>{t.add(`${e},${a}`)}),T(t),e.size>=M.length&&I("done")}else(0,o.playSound)("incorrect"),A(e=>e+1),K.announceIncorrect();B(null)},[u,z,N,w,M,j,S]),W=a.default.useCallback(()=>{$(new Set),T(new Set),B(null),A(0),I("play"),v(e=>e+1),E.current=!1,(0,o.playSound)("click")},[]);if(0===g.length)return(0,t.jsxs)("div",{className:"text-center p-5 rounded-xl",style:{background:x.accentAlpha(.06),border:"2px dashed "+x.accentAlpha(.25)},children:[(0,t.jsx)("div",{className:"text-2xl mb-2",children:(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"24px"},children:"search"})}),(0,t.jsx)("div",{className:"font-extrabold mb-1",style:{...x.caption(),color:x.accent()},children:(0,t.jsx)(n.InlineTextEditor,{...D,className:"font-extrabold",style:{color:x.accent(),...x.micro()},placeholder:"Ketik judul game..."})}),(0,t.jsx)("div",{style:{...x.caption(),color:x.mutedText(.7)},children:"Tambahkan kata untuk memulai game Teka-Teki Kata!"})]});if("done"===z){let e=Math.max(Math.ceil(.5*M.length),M.length-C),a=M.length>0?Math.round(e/M.length*100):0;return(0,t.jsx)(c.PremiumBlockWrapper,{tokens:m,accent:"y",staggerIndex:0,gradientBorder:!0,children:(0,t.jsxs)("div",{className:"text-center p-5",children:[(0,t.jsx)(c.ReadingProgressIndicator,{progress:1,tokens:m,accent:"y",height:3,position:"top"}),(0,t.jsx)("div",{className:"text-3xl mb-3",style:{animation:"float 3s ease-in-out infinite"},children:a>=80?(0,t.jsx)("span",{className:"material-symbols-outlined inline text-app-accent",style:{fontSize:"28px"},children:"emoji_events"}):a>=50?(0,t.jsx)("span",{className:"material-symbols-outlined inline text-app-accent",style:{fontSize:"28px"},children:"star"}):(0,t.jsx)(r.Dumbbell,{size:28,className:"inline text-app-accent"})}),(0,t.jsx)("div",{className:"font-black text-lg mb-1",style:{fontFamily:m.fontFamily("display"),color:x.accent()},children:a>=80?"Luar Biasa!":a>=50?"Bagus!":"Terus Berlatih!"}),(0,t.jsxs)("div",{className:"mb-4",style:{...x.body(),color:x.mutedText(.8)},children:["Skor kamu: ",e,"/",M.length," (",a,"%)"]}),(0,t.jsxs)("div",{className:"flex justify-center gap-3",children:[(0,t.jsxs)(c.PremiumBadge,{tokens:m,accent:"g",variant:"glass",children:["Ditemukan ",M.length]}),(0,t.jsxs)(c.PremiumBadge,{tokens:m,accent:"r",variant:"glass",children:["Salah ",C]})]}),u&&(0,t.jsx)(c.MicroInteraction,{tokens:m,accent:"y",effect:"squish",children:(0,t.jsxs)("button",{className:"mt-4 px-5 py-2 rounded-xl font-extrabold"+m.iosButtonTw(u),onClick:W,style:{...x.caption(),background:"linear-gradient(135deg, "+x.accent()+", "+m.color("o")+")",color:m.color("bg"),boxShadow:"0 4px 16px "+x.accentAlpha(.35)},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"refresh"})," Ulangi"]})})]})})}let Y=y<=8?36:y<=10?32:y<=12?28:24;return(0,t.jsx)(c.PremiumBlockWrapper,{tokens:m,accent:"y",staggerIndex:0,children:(0,t.jsxs)("div",{className:"space-y-3 game-block",...K.rootAria,"data-interactive":!0,children:[(0,t.jsx)(c.ReadingProgressIndicator,{progress:M.length>0?j.size/M.length:0,tokens:m,accent:"y",height:3,position:"top"}),(0,t.jsx)("div",{id:K.instructionId,className:"sr-only",children:"Temukan kata tersembunyi di grid huruf dengan memilih huruf awal dan akhir"}),(0,t.jsxs)("div",{className:"flex items-center justify-between min-w-0",children:[(0,t.jsx)("div",{className:"flex items-center gap-2 min-w-0",children:(0,t.jsxs)("div",{className:"font-extrabold",style:{...x.caption(),color:x.accent()},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"search"})," ",(0,t.jsx)(n.InlineTextEditor,{...D,className:"font-extrabold",style:{color:x.accent(),...x.micro()},placeholder:"Ketik judul game..."})]})}),(0,t.jsx)("div",{className:"flex items-center gap-2",children:(0,t.jsxs)(c.PremiumBadge,{tokens:m,accent:"y",variant:"glass",children:[j.size,"/",M.length]})})]}),(0,t.jsxs)("div",{className:"h-1.5 rounded-full overflow-hidden",...K.progressAria("Kemajuan Teka-Teki Kata",j.size,M.length),style:{background:m.subtleBg(.08)},children:[(0,t.jsx)("div",{className:"h-full rounded-full",style:{width:M.length>0?j.size/M.length*100+"%":"0%",...m.iosTransitionStyle("width","slow"),background:"linear-gradient(90deg, "+x.accent()+", "+m.color("g")+")",backgroundSize:"200% 100%",animation:"shimmer 2s linear infinite",boxShadow:"0 0 8px "+x.accentAlpha(.3)}}),(0,t.jsx)("div",{style:{position:"absolute",top:0,left:0,right:0,bottom:0,background:"linear-gradient(90deg, transparent, "+x.accentAlpha(.2)+", transparent)",backgroundSize:"200% 100%",animation:"shimmer 3s ease-in-out infinite",pointerEvents:"none",borderRadius:"inherit"}})]}),(0,t.jsxs)("div",{className:"flex gap-4",children:[(0,t.jsx)("div",{className:"flex-shrink-0",children:(0,t.jsx)("div",{className:"grid gap-1",style:{gridTemplateColumns:`repeat(${y}, ${Y}px)`},children:w.map((a,r)=>a.map((a,n)=>{let l,o,i,s,c=`${r},${n}`,d=null!==N&&N[0]===r&&N[1]===n,h=S.has(c);return h?(l=m.colorAlpha("g",.18),o=m.colorAlpha("g",.5),i="0 0 8px "+m.colorAlpha("g",.2),s=m.color("g")):(d?(l=x.accentAlpha(.15),o=x.accent(),i="0 0 12px "+x.accentAlpha(.4)):(l=m.colorAlpha("card",.6),o=m.subtleBorder(.12),i=x.shadow("card")),s=x.textColor()),(0,t.jsx)("button",{role:"gridcell",onClick:()=>G(r,n),onKeyDown:t=>{if(!u||"play"!==z)return;let a=y*y,l=r*y+n,o=K.rovingFocus(a,l,t.key,"both",y);if(o!==l){t.preventDefault();let a=Math.floor(o/y),r=o%y,n=document.querySelector(`[data-ws-cell="${e.id||"ws"}-${a}-${r}"]`);n?.focus()}},"data-ws-cell":`${e.id||"ws"}-${r}-${n}`,disabled:!u||"play"!==z,"aria-label":`Baris ${r+1} Kolom ${n+1}, huruf ${a}${h?", ditemukan":""}`,className:"flex items-center justify-center rounded-lg font-extrabold"+m.iosGameButtonTw(u&&"play"===z)+" select-none",style:{width:Y,height:Y,fontSize:Y<=28?"11px":"13px",background:l,border:"2px solid "+o,boxShadow:i,color:s,cursor:u&&"play"===z?"pointer":"default"},children:a},`ws-cell-${e.id||"ws"}-${r}-${n}`)}))})}),(0,t.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,t.jsxs)("div",{className:"rounded-xl p-3 premium-card-glow",style:{background:m.colorAlpha("card",.4),border:"1px solid "+m.subtleBorder(.1),boxShadow:x.shadow("card")},children:[(0,t.jsx)("div",{className:"font-extrabold uppercase tracking-wider mb-2",style:{...x.micro(),color:x.accent()},children:"Kata yang dicari"}),(0,t.jsx)("div",{className:"space-y-1.5 max-h-64 overflow-y-auto",children:M.map((a,r)=>{let n=j.has(a.word);return(0,t.jsxs)("div",{className:"flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-[background-color,border-color]",style:{background:n?m.colorAlpha("g",.12):m.subtleBg(.04),border:"1px solid "+(n?m.colorAlpha("g",.3):m.subtleBorder(.06))},children:[(0,t.jsx)("div",{className:"w-2.5 h-2.5 rounded-full flex-shrink-0",style:{background:n?m.color("g"):m.subtleBg(.15),boxShadow:n?"0 0 6px "+m.colorAlpha("g",.4):"none"}}),(0,t.jsx)("span",{className:"font-bold tracking-wider",style:{...x.caption(),color:n?m.color("g"):x.textColor(),textDecoration:n?"line-through":"none",opacity:n?.7:1},children:a.word})]},`ws-word-${e.id||"ws"}-${a.word}-${r}`)})})]}),u&&!N&&(0,t.jsx)("div",{className:"mt-2 px-3 py-2 rounded-lg",style:{...x.micro(),color:x.mutedText(.6),background:m.subtleBg(.03),border:"1px solid "+m.subtleBorder(.05)},children:"Klik huruf pertama, lalu klik huruf terakhir kata yang kamu temukan."}),u&&N&&(0,t.jsxs)("div",{className:"mt-2 px-3 py-2 rounded-lg flex items-center gap-1.5",style:{...x.micro(),color:x.accent(),background:x.accentAlpha(.08),border:"1px solid "+x.accentAlpha(.2),animation:"pulse 1.5s ease-in-out infinite"},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline flex-shrink-0",style:{fontSize:"12px"},children:"search"}),"Pilih huruf terakhir..."]})]})]}),(0,t.jsxs)("div",{className:"print-only print-answer-key",children:[(0,t.jsx)("h3",{children:"Kunci Jawaban: Teka-Teki Kata"}),(0,t.jsx)("ul",{children:M.map((a,r)=>(0,t.jsxs)("li",{children:[(0,t.jsx)("strong",{children:a.word})," — baris ",a.cells[0][0]+1,", kolom ",a.cells[0][1]+1]},`ws-ans-${e.id||"ws"}-${r}`))})]})]})})});e.s(["WordSearchGameRenderer",0,m])}]);