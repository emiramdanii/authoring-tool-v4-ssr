(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,96359,e=>{"use strict";let t=["#f9c12e","#3ecfcf","#34d399","#a78bfa","#ff6b6b","#fb923c","#fbbf24","#22d3ee","#f472b6","#818cf8"],a=["★","●","■","◆","✦","♥","✿","⬟"],o=!1;function r(){if(o||"u"<typeof document)return;o=!0;let e=document.createElement("style");e.id="confetti-enhanced-keyframes",e.textContent=`
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
  `,document.head.appendChild(e)}function n(){let e=Math.random();return e<.35?"rect":e<.55?"circle":e<.8?"star":"diamond"}function l(e){let{x:t,y:o,color:r,shape:n,dx:l,dy:i,rotation:s,drift:c,delay:d,duration:u,shimmer:m,wrapper:p,animationType:f,sx:h=0,sy:x=0}=e,b=document.createElement("div"),y=6+8*Math.random();if("star"===n||"diamond"===n){let e="star"===n?a[Math.floor(2*Math.random())]:a[3];b.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${o}px;
      font-size: ${1.4*y}px;
      color: ${r};
      pointer-events: none;
      will-change: transform, opacity;
      line-height: 1;
      animation: ${"side"===f?"confettiSideBurst":"confettiBurst"} ${u}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${l}px;
      --dy: ${i}px;
      --rot: ${s}deg;
      --drift: ${c}px;
      --sx: ${h}px;
      --sy: ${x}px;
    `,Math.random()>.3&&(b.style.animation+=`, confettiTumble ${1200+800*Math.random()}ms linear ${d}ms infinite`),b.textContent=e}else{let e="circle"===n;b.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${o}px;
      width: ${y}px;
      height: ${e?y:.5*y}px;
      background: ${r};
      border-radius: ${e?"50%":"2px"};
      pointer-events: none;
      will-change: transform, opacity;
      animation: ${"side"===f?"confettiSideBurst":"confettiBurst"} ${u}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${l}px;
      --dy: ${i}px;
      --rot: ${s}deg;
      --drift: ${c}px;
      --sx: ${h}px;
      --sy: ${x}px;
    `}m&&.3>Math.random()&&(b.style.animation+=`, confettiShimmer ${400+300*Math.random()}ms ease-in-out ${d}ms infinite`),p.appendChild(b)}function i(e){let t=document.createElement("div");return t.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 9999; overflow: hidden;
  `,e.appendChild(t),t}function s(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function c(e={}){if(s())return;r();let{count:a=50,duration:o=3e3,container:d=document.body,originX:u=.5,originY:m=.3}=e,p=i(d),f=window.innerWidth*u,h=window.innerHeight*m;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,r=200+400*Math.random(),i=Math.cos(a)*r,s=Math.sin(a)*r-300,c=720*Math.random()-360,d=(Math.random()-.5)*120,u=200*Math.random();l({x:f,y:h,color:e,shape:n(),dx:i,dy:s,rotation:c,drift:d,delay:u,duration:o,shimmer:!0,wrapper:p,animationType:"center"})}setTimeout(()=>{p.remove()},o+500)}function d(e={}){if(s())return;r();let{count:a=70,duration:o=3500,container:c=document.body}=e,u=i(c),m=window.innerWidth,p=window.innerHeight,f=Math.floor(a/2);for(let e=0;e<f;e++){let e=t[Math.floor(Math.random()*t.length)],a=p*(.5+.3*Math.random()),r=m*(.2+.4*Math.random()),i=-(.2*p+Math.random()*p*.3),s=720*Math.random()-360,c=20+60*Math.random(),d=300*Math.random();l({x:0,y:a,color:e,shape:n(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:o,shimmer:!0,wrapper:u,animationType:"side",sx:r,sy:i})}for(let e=0;e<f;e++){let e=t[Math.floor(Math.random()*t.length)],a=p*(.5+.3*Math.random()),r=-(m*(.2+.4*Math.random())),i=-(.2*p+Math.random()*p*.3),s=720*Math.random()-360,c=-(20+60*Math.random()),d=300*Math.random();l({x:m,y:a,color:e,shape:n(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:o,shimmer:!0,wrapper:u,animationType:"side",sx:r,sy:i})}setTimeout(()=>{u.remove()},o+500)}e.s(["fireConfetti",0,c,"fireConfettiCelebration",0,function(e={}){if(s())return;let{count:t=60,duration:a=3500,container:o=document.body}=e;d({count:t+10,duration:a,container:o}),setTimeout(()=>{c({count:t,duration:a-200,container:o,originX:.5,originY:.3})},300),setTimeout(()=>{d({count:Math.floor(.7*t),duration:a-400,container:o})},600)},"fireConfettiMini",0,function(e={}){if(s())return;r();let{count:a=9,duration:o=1200,container:c=document.body,originX:d=.5,originY:u=.5}=e,m=i(c),p=window.innerWidth*d,f=window.innerHeight*u;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,r=80+150*Math.random(),i=Math.cos(a)*r,s=Math.sin(a)*r-100,c=360*Math.random()-180,d=(Math.random()-.5)*40,u=100*Math.random();l({x:p,y:f,color:e,shape:n(),dx:i,dy:s,rotation:c,drift:d,delay:u,duration:o,shimmer:!1,wrapper:m,animationType:"center"})}setTimeout(()=>{m.remove()},o+300)}])},12475,37230,e=>{"use strict";let t=(0,e.i(75254).default)("dumbbell",[["path",{d:"M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z",key:"9m4mmf"}],["path",{d:"m2.5 21.5 1.4-1.4",key:"17g3f0"}],["path",{d:"m20.1 3.9 1.4-1.4",key:"1qn309"}],["path",{d:"M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z",key:"1t2c92"}],["path",{d:"m9.6 14.4 4.8-4.8",key:"6umqxw"}]]);e.s(["Dumbbell",0,t],12475);var a=e.i(71645),o=e.i(73829);e.s(["useGameA11y",0,function(e){let{gameType:t,blockId:r,score:n,maxScore:l,interactive:i}=e,s=(0,a.useRef)(n);(0,a.useEffect)(()=>{i&&(n!==s.current&&n>s.current&&(0,o.announceToScreenReader)(`Skor: ${n}`,"polite"),s.current=n)},[n,i]);let c=(0,o.gameAriaLabel)(t,n,l),d=`game-instructions-${r||"game"}`,u=i?{role:"application","aria-label":c,"aria-describedby":d}:{"aria-label":c},m=(0,a.useCallback)((e,t="polite")=>{(0,o.announceToScreenReader)(e,t)},[]),p=(0,a.useCallback)(()=>{(0,o.announceToScreenReader)("Benar!","assertive")},[]),f=(0,a.useCallback)(e=>{let t=e?`Salah. Jawaban yang benar: ${e}`:"Salah!";(0,o.announceToScreenReader)(t,"assertive")},[]),h=(0,a.useCallback)((e,t)=>{let a=t>0?Math.round(e/t*100):0;(0,o.announceToScreenReader)(`Game selesai! ${a>=80?"Luar Biasa":a>=50?"Bagus":"Terus Berlatih"}. Skor kamu: ${e} dari ${t} (${a}%)`,"assertive")},[]),x=(0,a.useCallback)(e=>{(0,o.announceToScreenReader)(`Skor: ${e}`,"polite")},[]),b=(0,a.useCallback)((e,t,a)=>(0,o.progressBarAria)(e,t,a),[]),y=(0,a.useCallback)((e="polite")=>(0,o.liveRegion)(e),[]);return{ariaLabel:c,rootAria:u,progressAria:b,liveAria:y,instructionId:d,announce:m,announceCorrect:p,announceIncorrect:f,announceComplete:h,announceScore:x,rovingFocus:(0,a.useCallback)((e,t,a,r="both",n)=>(0,o.handleRovingFocus)(e,t,a,r,n),[]),isActivation:(0,a.useCallback)(e=>(0,o.isActivationKey)(e),[])}}],37230)},54831,e=>{"use strict";var t=e.i(43476),a=e.i(71645),o=e.i(12475),r=e.i(61051),n=e.i(27700),l=e.i(5262),i=e.i(96359),s=e.i(37230),c=e.i(52926);let d=a.default.memo(function({block:e,tokens:d,interactive:u,isCompact:m,isEditing:p,pageIndex:f}){let h=d.edu("team-buzzer-game",m),x=e.questions||[],b=a.default.useMemo(()=>x.filter(e=>e.teks&&e.teks.trim()),[x]),y=e.teamA||"Tim Merah",g=e.teamB||"Tim Biru",[v,k]=a.default.useState(0),[j,S]=a.default.useState(0),[w,M]=a.default.useState(0),[$,A]=a.default.useState(null),[T,N]=a.default.useState(null),[B,z]=a.default.useState("play"),C=a.default.useRef([]);a.default.useEffect(()=>()=>{C.current.forEach(clearTimeout)},[]);let I=a.default.useMemo(()=>JSON.stringify(b.map(e=>({t:e.teks,p:e.poin}))),[b]);a.default.useEffect(()=>{C.current.forEach(clearTimeout),C.current=[],k(0),S(0),M(0),A(null),N(null),z("play")},[I]);let R=(0,n.useInteractiveStore)(e=>e.replayGeneration);a.default.useEffect(()=>{C.current.forEach(clearTimeout),C.current=[],k(0),S(0),M(0),A(null),N(null),z("play")},[R]);let E=(0,n.useInteractiveStore)(e=>e.reportScore),K=a.default.useMemo(()=>b.reduce((e,t)=>e+(t.poin||10),0),[b]),P=(0,s.useGameA11y)({gameType:"Kuis Tim",blockId:e.id,score:j+w,maxScore:K,interactive:u??!1}),W=a.default.useRef(!1);a.default.useEffect(()=>{if("done"===B&&u&&e.id&&!W.current){W.current=!0;let t=j+w;E({elementId:e.id,pageIndex:f??0,score:t,maxScore:K,completed:!0});let a=K>0?Math.round(t/K*100):0;a>=80?((0,l.playSound)("complete"),(0,i.fireConfettiCelebration)()):a>=50?((0,l.playSound)("complete"),(0,i.fireConfetti)({count:30})):(0,l.playSound)("ding"),P.announceComplete(t,K)}"done"!==B&&(W.current=!1)},[B,u,e.id,j,w,K,E,f,P]);let Y=(0,r.useInlineEditor)({blockId:e.id,fieldKey:"title",value:e.title??"",tag:"span"}),G=a.default.useCallback(e=>{!u||"play"!==B||$||"wrong"===T||((0,l.playSound)("buzz"),A(e))},[u,B,$,T]),q=a.default.useCallback(e=>{if(T)return;let t=b[v]?.poin||10;"A"===e?S(e=>e+t):M(e=>e+t),N(e),(0,l.playSound)("correct"),P.announceCorrect();let a=setTimeout(()=>{v+1<b.length?(k(e=>e+1),A(null),N(null)):z("done")},1500);C.current.push(a)},[T,v,b]),D=a.default.useCallback(()=>{if(T)return;N("wrong"),(0,l.playSound)("incorrect"),P.announceIncorrect();let e=setTimeout(()=>{v+1<b.length?(k(e=>e+1),A(null),N(null)):z("done")},800);C.current.push(e)},[T,v,b]),F=a.default.useCallback(()=>{C.current.forEach(clearTimeout),C.current=[],k(0),S(0),M(0),A(null),N(null),z("play"),W.current=!1,(0,l.playSound)("click")},[]);if(0===b.length)return(0,t.jsxs)("div",{className:"flex flex-col items-center justify-center p-6 text-center rounded-xl",style:{background:d.subtleBg(.04),border:"2px dashed "+d.subtleBorder(.15)},children:[(0,t.jsx)("span",{className:"material-symbols-outlined",style:{fontSize:"24px"},children:"bolt"}),(0,t.jsx)("div",{className:"mt-2 font-extrabold",style:{...h.caption(),color:h.mutedText(.5)},children:(0,t.jsx)(r.InlineTextEditor,{...Y,className:"font-extrabold",style:{color:h.mutedText(.5),...h.micro()},placeholder:"Ketik judul Kuis Tim..."})}),(0,t.jsx)("div",{style:{...h.micro(),color:h.mutedText(.35)},children:"Belum ada soal ditambahkan untuk Kuis Tim"})]});if("done"===B){let e=j+w,a=K>0?Math.round(e/K*100):0,r=j>w?y:w>j?g:"Seri";return(0,t.jsx)(c.PremiumBlockWrapper,{tokens:d,accent:"y",staggerIndex:0,gradientBorder:!0,children:(0,t.jsxs)("div",{className:"text-center p-5 rounded-2xl",style:{background:h.pageBg(),border:"2px solid "+h.accentAlpha(.3),boxShadow:h.shadow("elevated"),animation:"popSuccess 0.5s ease-out"},children:[(0,t.jsx)(c.ReadingProgressIndicator,{progress:1,tokens:d,accent:"y",height:3,position:"top"}),(0,t.jsx)("div",{className:"text-3xl mb-3",style:{animation:"float 3s ease-in-out infinite"},children:a>=80?(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"28px"},children:"emoji_events"}):a>=50?(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"28px"},children:"star"}):(0,t.jsx)(o.Dumbbell,{size:28,className:"inline",style:{color:h.accent()}})}),(0,t.jsx)("div",{className:"font-black text-lg mb-1",style:{fontFamily:d.fontFamily("display"),color:h.accent()},children:"Seri"===r?"Seri!":`${r} Menang!`}),(0,t.jsxs)("div",{className:"mb-4",style:{...h.body(),color:h.mutedText(.8)},children:["Total: ",e,"/",K," (",a,"%)"]}),(0,t.jsxs)("div",{className:"flex justify-center gap-3",children:[(0,t.jsxs)(c.PremiumBadge,{tokens:d,accent:"r",variant:"glass",children:[y,": ",j]}),(0,t.jsxs)(c.PremiumBadge,{tokens:d,accent:"c",variant:"glass",children:[g,": ",w]})]}),u&&(0,t.jsx)(c.MicroInteraction,{tokens:d,accent:"y",effect:"squish",children:(0,t.jsxs)("button",{className:"mt-4 px-5 py-2 rounded-xl font-extrabold"+d.iosButtonTw(u),onClick:F,style:{...h.caption(),background:"linear-gradient(135deg, "+h.accent()+", "+d.color("o")+")",color:d.color("bg"),boxShadow:"0 4px 16px "+h.accentAlpha(.35)},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"refresh"})," Ulangi"]})})]})})}let H=b[v];if(!H)return null;let L=(v+ +!!$)/b.length*100;return(0,t.jsx)(c.PremiumBlockWrapper,{tokens:d,accent:"y",staggerIndex:0,children:(0,t.jsxs)("div",{className:"space-y-3 game-block",...P.rootAria,"data-interactive":!0,children:[(0,t.jsx)("div",{id:P.instructionId,className:"sr-only",children:"Tekan buzzer tim lalu tentukan jawaban benar atau salah"}),(0,t.jsx)(c.ReadingProgressIndicator,{progress:b.length>0?(v+ +!!$)/b.length:0,tokens:d,accent:"y",height:3,position:"top"}),(0,t.jsxs)("div",{className:"flex items-center justify-between min-w-0",children:[(0,t.jsx)("div",{className:"flex items-center gap-2 min-w-0",children:(0,t.jsxs)("div",{className:"font-extrabold",style:{...h.caption(),color:h.accent()},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"bolt"})," ",(0,t.jsx)(r.InlineTextEditor,{...Y,className:"font-extrabold",style:{color:h.accent(),...h.micro()},placeholder:"Ketik judul Kuis Tim..."})]})}),(0,t.jsxs)(c.PremiumBadge,{tokens:d,accent:"y",variant:"glass",children:[v+1,"/",b.length]})]}),(0,t.jsx)("div",{className:"h-1.5 rounded-full overflow-hidden",...P.progressAria("Kemajuan Kuis Tim",v+ +!!$,b.length),style:{background:d.subtleBg(.08)},children:(0,t.jsx)("div",{className:"h-full rounded-full",style:{width:`${L}%`,...d.iosTransitionStyle("width","slow"),background:"linear-gradient(90deg, "+h.accent()+", "+d.color("o")+")",backgroundSize:"200% 100%",animation:"shimmer 2s linear infinite",boxShadow:"0 0 8px "+h.accentAlpha(.3)}})}),(0,t.jsxs)("div",{className:"flex justify-between items-center",children:[(0,t.jsxs)("span",{className:"font-bold",style:{...h.micro(),color:h.accent()},children:["Soal ",v+1,"/",b.length]}),(0,t.jsxs)("span",{style:{...h.micro(),color:h.mutedText(.6)},"aria-live":"polite",children:["+",H.poin||10," poin"]})]}),(0,t.jsxs)("div",{className:"p-4 rounded-xl premium-card-glow",style:{background:h.accentAlpha(.06),border:"1px solid "+h.accentAlpha(.2),boxShadow:h.shadow("card")},children:[(0,t.jsx)("p",{className:`font-bold leading-relaxed mb-4  ${m?"canvas-truncate-2":""}`,style:{color:h.textColor(),wordBreak:"break-word",overflowWrap:"break-word",overflow:"hidden"},children:H.teks}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-3",children:[(0,t.jsxs)("button",{onClick:()=>G("A"),disabled:!u||!!$||"wrong"===T,"aria-label":`${y} buzzer, skor ${j}`,className:`p-3 rounded-xl font-extrabold text-center transition-[background-color,border-color,color,transform,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent min-w-0 ${m?"canvas-truncate-1":""}`,style:{...h.caption(),background:"A"===T?d.colorAlpha("g",.2):"A"===$?d.colorAlpha("r",.2):d.colorAlpha("r",.08),border:"2px solid "+("A"===T?d.color("g"):"A"===$?d.color("r"):d.colorAlpha("r",.3)),boxShadow:"A"===T?"0 0 12px "+d.colorAlpha("g",.25):"A"===$?"0 0 12px "+d.colorAlpha("r",.25):"none",color:"A"===T?d.color("g"):d.color("r"),cursor:u&&!$&&"wrong"!==T?"pointer":"default",opacity:$&&"A"!==$?.55:1},children:[y," (",j,")"]},`tb-buzz-${e.id||"tb"}-${v}-A`),(0,t.jsxs)("button",{onClick:()=>G("B"),disabled:!u||!!$||"wrong"===T,"aria-label":`${g} buzzer, skor ${w}`,className:`p-3 rounded-xl font-extrabold text-center transition-[background-color,border-color,color,transform,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent min-w-0 ${m?"canvas-truncate-1":""}`,style:{...h.caption(),background:"B"===T?d.colorAlpha("g",.2):"B"===$?d.colorAlpha("c",.2):d.colorAlpha("c",.08),border:"2px solid "+("B"===T?d.color("g"):"B"===$?d.color("c"):d.colorAlpha("c",.3)),boxShadow:"B"===T?"0 0 12px "+d.colorAlpha("g",.25):"B"===$?"0 0 12px "+d.colorAlpha("c",.25):"none",color:"B"===T?d.color("g"):d.color("c"),cursor:u&&!$&&"wrong"!==T?"pointer":"default",opacity:$&&"B"!==$?.55:1},children:[g," (",w,")"]},`tb-buzz-${e.id||"tb"}-${v}-B`)]}),$&&!T&&(0,t.jsxs)("div",{className:"mt-3 p-3 rounded-xl",style:{background:h.accentAlpha(.08),border:"1px solid "+h.accentAlpha(.2),animation:"fadeIn 0.3s ease"},children:[(0,t.jsxs)("div",{className:"text-center mb-2 font-bold",style:{...h.micro(),color:h.accent()},children:["A"===$?y:g," menekan buzzer!"]}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-2",children:[(0,t.jsxs)("button",{onClick:()=>q($),"aria-label":"Benar",className:"py-2 rounded-lg font-extrabold transition-[background-color,border-color,color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent",style:{...h.micro(),background:d.colorAlpha("g",.15),color:d.color("g"),border:"1px solid "+d.colorAlpha("g",.3),cursor:"pointer"},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline mr-1",style:{fontSize:"12px"},children:"check_circle"}),"Benar (","A"===$?y:g,")"]},`tb-judge-${e.id||"tb"}-${v}-correct`),(0,t.jsxs)("button",{onClick:D,"aria-label":"Salah",className:"py-2 rounded-lg font-extrabold transition-[background-color,border-color,color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent",style:{...h.micro(),background:d.colorAlpha("r",.15),color:d.color("r"),border:"1px solid "+d.colorAlpha("r",.3),cursor:"pointer"},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline mr-1",style:{fontSize:"12px"},children:"cancel"}),"Salah (","A"===$?y:g,")"]},`tb-judge-${e.id||"tb"}-${v}-wrong`)]})]}),T&&"wrong"!==T&&(0,t.jsx)("div",{className:"mt-3 p-3 rounded-xl",style:{background:d.colorAlpha("g",.1),border:"1px solid "+d.colorAlpha("g",.3),animation:"fadeIn 0.3s ease"},children:(0,t.jsxs)("div",{className:"text-center font-extrabold",style:{...h.caption(),color:d.color("g")},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline mr-1",style:{fontSize:"14px"},children:"check_circle"}),"A"===T?y:g," benar! +",H.poin||10," poin"]})}),"wrong"===T&&(0,t.jsx)("div",{className:"mt-3 p-3 rounded-xl",style:{background:d.colorAlpha("r",.1),border:"1px solid "+d.colorAlpha("r",.3),animation:"fadeIn 0.3s ease"},children:(0,t.jsxs)("div",{className:"text-center font-extrabold",style:{...h.caption(),color:d.color("r")},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline mr-1",style:{fontSize:"14px"},children:"cancel"}),"Salah! Lanjut ke soal berikutnya..."]})})]}),(0,t.jsxs)("div",{className:"print-only print-answer-key",children:[(0,t.jsx)("h3",{children:"Daftar Soal Kuis Tim"}),(0,t.jsx)("ul",{children:b.map((a,o)=>(0,t.jsxs)("li",{children:[o+1,". ",a.teks," (",a.poin||10," poin)"]},`tb-ans-${e.id||"tb"}-${o}`))})]})]})})});e.s(["TeamBuzzerGameRenderer",0,d])}]);