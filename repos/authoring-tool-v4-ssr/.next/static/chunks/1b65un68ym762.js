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
  `,document.head.appendChild(e)}function o(){let e=Math.random();return e<.35?"rect":e<.55?"circle":e<.8?"star":"diamond"}function l(e){let{x:t,y:r,color:n,shape:o,dx:l,dy:i,rotation:s,drift:c,delay:d,duration:m,shimmer:u,wrapper:h,animationType:p,sx:f=0,sy:x=0}=e,y=document.createElement("div"),g=6+8*Math.random();if("star"===o||"diamond"===o){let e="star"===o?a[Math.floor(2*Math.random())]:a[3];y.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${r}px;
      font-size: ${1.4*g}px;
      color: ${n};
      pointer-events: none;
      will-change: transform, opacity;
      line-height: 1;
      animation: ${"side"===p?"confettiSideBurst":"confettiBurst"} ${m}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${l}px;
      --dy: ${i}px;
      --rot: ${s}deg;
      --drift: ${c}px;
      --sx: ${f}px;
      --sy: ${x}px;
    `,Math.random()>.3&&(y.style.animation+=`, confettiTumble ${1200+800*Math.random()}ms linear ${d}ms infinite`),y.textContent=e}else{let e="circle"===o;y.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${r}px;
      width: ${g}px;
      height: ${e?g:.5*g}px;
      background: ${n};
      border-radius: ${e?"50%":"2px"};
      pointer-events: none;
      will-change: transform, opacity;
      animation: ${"side"===p?"confettiSideBurst":"confettiBurst"} ${m}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${l}px;
      --dy: ${i}px;
      --rot: ${s}deg;
      --drift: ${c}px;
      --sx: ${f}px;
      --sy: ${x}px;
    `}u&&.3>Math.random()&&(y.style.animation+=`, confettiShimmer ${400+300*Math.random()}ms ease-in-out ${d}ms infinite`),h.appendChild(y)}function i(e){let t=document.createElement("div");return t.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 9999; overflow: hidden;
  `,e.appendChild(t),t}function s(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function c(e={}){if(s())return;n();let{count:a=50,duration:r=3e3,container:d=document.body,originX:m=.5,originY:u=.3}=e,h=i(d),p=window.innerWidth*m,f=window.innerHeight*u;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,n=200+400*Math.random(),i=Math.cos(a)*n,s=Math.sin(a)*n-300,c=720*Math.random()-360,d=(Math.random()-.5)*120,m=200*Math.random();l({x:p,y:f,color:e,shape:o(),dx:i,dy:s,rotation:c,drift:d,delay:m,duration:r,shimmer:!0,wrapper:h,animationType:"center"})}setTimeout(()=>{h.remove()},r+500)}function d(e={}){if(s())return;n();let{count:a=70,duration:r=3500,container:c=document.body}=e,m=i(c),u=window.innerWidth,h=window.innerHeight,p=Math.floor(a/2);for(let e=0;e<p;e++){let e=t[Math.floor(Math.random()*t.length)],a=h*(.5+.3*Math.random()),n=u*(.2+.4*Math.random()),i=-(.2*h+Math.random()*h*.3),s=720*Math.random()-360,c=20+60*Math.random(),d=300*Math.random();l({x:0,y:a,color:e,shape:o(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:r,shimmer:!0,wrapper:m,animationType:"side",sx:n,sy:i})}for(let e=0;e<p;e++){let e=t[Math.floor(Math.random()*t.length)],a=h*(.5+.3*Math.random()),n=-(u*(.2+.4*Math.random())),i=-(.2*h+Math.random()*h*.3),s=720*Math.random()-360,c=-(20+60*Math.random()),d=300*Math.random();l({x:u,y:a,color:e,shape:o(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:r,shimmer:!0,wrapper:m,animationType:"side",sx:n,sy:i})}setTimeout(()=>{m.remove()},r+500)}e.s(["fireConfetti",0,c,"fireConfettiCelebration",0,function(e={}){if(s())return;let{count:t=60,duration:a=3500,container:r=document.body}=e;d({count:t+10,duration:a,container:r}),setTimeout(()=>{c({count:t,duration:a-200,container:r,originX:.5,originY:.3})},300),setTimeout(()=>{d({count:Math.floor(.7*t),duration:a-400,container:r})},600)},"fireConfettiMini",0,function(e={}){if(s())return;n();let{count:a=9,duration:r=1200,container:c=document.body,originX:d=.5,originY:m=.5}=e,u=i(c),h=window.innerWidth*d,p=window.innerHeight*m;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,n=80+150*Math.random(),i=Math.cos(a)*n,s=Math.sin(a)*n-100,c=360*Math.random()-180,d=(Math.random()-.5)*40,m=100*Math.random();l({x:h,y:p,color:e,shape:o(),dx:i,dy:s,rotation:c,drift:d,delay:m,duration:r,shimmer:!1,wrapper:u,animationType:"center"})}setTimeout(()=>{u.remove()},r+300)}])},12475,37230,e=>{"use strict";let t=(0,e.i(75254).default)("dumbbell",[["path",{d:"M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z",key:"9m4mmf"}],["path",{d:"m2.5 21.5 1.4-1.4",key:"17g3f0"}],["path",{d:"m20.1 3.9 1.4-1.4",key:"1qn309"}],["path",{d:"M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z",key:"1t2c92"}],["path",{d:"m9.6 14.4 4.8-4.8",key:"6umqxw"}]]);e.s(["Dumbbell",0,t],12475);var a=e.i(71645),r=e.i(73829);e.s(["useGameA11y",0,function(e){let{gameType:t,blockId:n,score:o,maxScore:l,interactive:i}=e,s=(0,a.useRef)(o);(0,a.useEffect)(()=>{i&&(o!==s.current&&o>s.current&&(0,r.announceToScreenReader)(`Skor: ${o}`,"polite"),s.current=o)},[o,i]);let c=(0,r.gameAriaLabel)(t,o,l),d=`game-instructions-${n||"game"}`,m=i?{role:"application","aria-label":c,"aria-describedby":d}:{"aria-label":c},u=(0,a.useCallback)((e,t="polite")=>{(0,r.announceToScreenReader)(e,t)},[]),h=(0,a.useCallback)(()=>{(0,r.announceToScreenReader)("Benar!","assertive")},[]),p=(0,a.useCallback)(e=>{let t=e?`Salah. Jawaban yang benar: ${e}`:"Salah!";(0,r.announceToScreenReader)(t,"assertive")},[]),f=(0,a.useCallback)((e,t)=>{let a=t>0?Math.round(e/t*100):0;(0,r.announceToScreenReader)(`Game selesai! ${a>=80?"Luar Biasa":a>=50?"Bagus":"Terus Berlatih"}. Skor kamu: ${e} dari ${t} (${a}%)`,"assertive")},[]),x=(0,a.useCallback)(e=>{(0,r.announceToScreenReader)(`Skor: ${e}`,"polite")},[]),y=(0,a.useCallback)((e,t,a)=>(0,r.progressBarAria)(e,t,a),[]),g=(0,a.useCallback)((e="polite")=>(0,r.liveRegion)(e),[]);return{ariaLabel:c,rootAria:m,progressAria:y,liveAria:g,instructionId:d,announce:u,announceCorrect:h,announceIncorrect:p,announceComplete:f,announceScore:x,rovingFocus:(0,a.useCallback)((e,t,a,n="both",o)=>(0,r.handleRovingFocus)(e,t,a,n,o),[]),isActivation:(0,a.useCallback)(e=>(0,r.isActivationKey)(e),[])}}],37230)},77274,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(12475),n=e.i(61051),o=e.i(27700),l=e.i(5262),i=e.i(96359),s=e.i(37230),c=e.i(52926);let d=a.default.memo(function({block:e,tokens:d,interactive:m,isCompact:u,isEditing:h,pageIndex:p}){let f=d.edu("drag-drop-game",u),[x,y]=a.default.useState({}),[g,b]=a.default.useState(null),[k,v]=a.default.useState(0),[w,j]=a.default.useState("play"),M=a.default.useMemo(()=>(e.items||[]).filter(e=>e.text.trim()&&e.target.trim()),[e.items]),$=e.targets||[],S=a.default.useMemo(()=>M.map(e=>`${e.text}|${e.target}`).join(";;")+"||"+$.map(e=>`${e.id}|${e.label}|${e.color??""}`).join(";;"),[M,$]);a.default.useEffect(()=>{y({}),b(null),v(0),j("play")},[S]);let T=(0,o.useInteractiveStore)(e=>e.replayGeneration);a.default.useEffect(()=>{y({}),b(null),v(0),j("play")},[T]);let N=(0,o.useInteractiveStore)(e=>e.reportScore),B=a.default.useMemo(()=>Object.values(x).reduce((e,t)=>e+t.length,0),[x]),C=M.length,A=(0,s.useGameA11y)({gameType:"Seret & Letakkan",blockId:e.id,score:B,maxScore:C,interactive:m??!1}),I=(0,n.useInlineEditor)({blockId:e.id,fieldKey:"title",value:e.title??"",tag:"span"}),z=C>0&&B>=C;a.default.useEffect(()=>{if(z&&"play"===w){let e=setTimeout(()=>j("done"),600);return()=>clearTimeout(e)}},[z,w]);let P=a.default.useRef(!1);a.default.useEffect(()=>{if("done"===w&&m&&e.id&&!P.current){P.current=!0;let t=Math.max(Math.ceil(.5*M.length),M.length-k);N({elementId:e.id,pageIndex:p??0,score:t,maxScore:M.length,completed:!0});let a=Math.round(t/M.length*100);a>=80?((0,l.playSound)("complete"),(0,i.fireConfettiCelebration)()):a>=50?((0,l.playSound)("complete"),(0,i.fireConfetti)({count:30})):(0,l.playSound)("ding"),A.announceComplete(t,M.length)}"done"!==w&&(P.current=!1)},[w,m,e.id,k,M.length,N,p]);let R=a.default.useMemo(()=>{let e=new Set;return Object.values(x).forEach(t=>{t.forEach(t=>e.add(t.idx))}),e},[x]);if(0===M.length||0===$.length)return(0,t.jsxs)("div",{className:"text-center p-6 rounded-xl",style:{background:d.subtleBg(.04),border:"2px dashed "+d.subtleBorder(.2)},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline mb-2",style:{fontSize:"24px"},children:"drag_indicator"}),(0,t.jsx)("div",{className:"font-bold",style:{...f.caption(),color:f.mutedText(.6)},children:"Seret & Letakkan Game"}),(0,t.jsx)("div",{style:{...f.micro(),color:f.mutedText(.4)},children:"Tambahkan item dan target untuk memulai game"})]});if("done"===w){let e=Math.max(Math.ceil(.5*C),C-k),a=Math.round(e/C*100);return(0,t.jsx)(c.PremiumBlockWrapper,{tokens:d,accent:"y",staggerIndex:0,gradientBorder:!0,children:(0,t.jsxs)("div",{className:"text-center p-5 rounded-2xl",style:{background:f.pageBg(),border:"2px solid "+f.accentAlpha(.3),boxShadow:f.shadow("elevated")},children:[(0,t.jsx)(c.ReadingProgressIndicator,{progress:1,tokens:d,accent:"y",height:3,position:"top"}),(0,t.jsx)("div",{className:"text-3xl mb-3",style:{animation:"float 3s ease-in-out infinite"},children:a>=80?(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"28px"},children:"emoji_events"}):a>=50?(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"28px"},children:"star"}):(0,t.jsx)(r.Dumbbell,{size:28,className:"inline",style:{color:f.accent()}})}),(0,t.jsx)("div",{className:"font-black text-lg mb-1",style:{fontFamily:d.fontFamily("display"),color:f.accent()},children:a>=80?"Luar Biasa!":a>=50?"Bagus!":"Terus Berlatih!"}),(0,t.jsxs)("div",{className:"mb-3",style:{...f.body(),color:f.mutedText(.8)},children:["Skor kamu: ",e,"/",C," (",a,"%)"]}),(0,t.jsxs)("div",{className:"flex justify-center gap-3 mb-4",children:[(0,t.jsxs)(c.PremiumBadge,{tokens:d,accent:"g",variant:"glass",children:["Benar: ",C]}),(0,t.jsxs)(c.PremiumBadge,{tokens:d,accent:"r",variant:"glass",children:["Salah: ",k]})]}),m&&(0,t.jsx)(c.MicroInteraction,{tokens:d,accent:"y",effect:"squish",children:(0,t.jsxs)("button",{className:"px-5 py-2 rounded-xl font-extrabold"+d.iosButtonTw(m),onClick:()=>{y({}),b(null),v(0),j("play"),P.current=!1,(0,l.playSound)("click")},style:{...f.caption(),background:"linear-gradient(135deg, "+f.accent()+", "+d.color("o")+")",color:d.color("bg"),boxShadow:"0 4px 16px "+f.accentAlpha(.35)},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"refresh"})," Ulangi"]})})]})})}let E=e=>{if(!m||null===g)return;let t=M[g];t&&(t.target===e?(y(a=>({...a,[e]:[...a[e]||[],{idx:g,text:t.text}]})),b(null),(0,l.playSound)("correct"),A.announceCorrect()):(v(e=>e+1),b(null),(0,l.playSound)("incorrect"),A.announceIncorrect()))};return(0,t.jsx)(c.PremiumBlockWrapper,{tokens:d,accent:"y",staggerIndex:0,children:(0,t.jsxs)("div",{className:"space-y-3 game-block",...A.rootAria,"data-interactive":!0,children:[(0,t.jsx)("div",{id:A.instructionId,className:"sr-only",children:"Pilih item dari kolam, lalu klik target yang tepat untuk menempatkannya"}),(0,t.jsx)(c.ReadingProgressIndicator,{progress:C>0?B/C:0,tokens:d,accent:"y",height:3,position:"top"}),(0,t.jsxs)("div",{className:"flex items-center justify-between min-w-0",children:[(0,t.jsx)("div",{className:"flex items-center gap-2 min-w-0",children:(0,t.jsxs)("div",{className:"font-extrabold",style:{...f.caption(),color:f.accent()},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"drag_indicator"})," ",(0,t.jsx)(n.InlineTextEditor,{...I,className:"font-extrabold",style:{color:f.accent(),...f.micro()},placeholder:"Ketik judul game..."})]})}),(0,t.jsxs)(c.PremiumBadge,{tokens:d,accent:"y",variant:"glass",children:[B,"/",C]})]}),(0,t.jsx)("div",{className:"h-1.5 rounded-full overflow-hidden",...A.progressAria("Kemajuan Seret & Letakkan",B,C),style:{background:d.subtleBg(.08)},children:(0,t.jsx)("div",{className:"h-full rounded-full",style:{width:`${C>0?B/C*100:0}%`,...d.iosTransitionStyle("width","slow"),background:"linear-gradient(90deg, "+f.accent()+", "+d.color("g")+")",backgroundSize:"200% 100%",animation:"shimmer 2s linear infinite",boxShadow:"0 0 8px "+f.accentAlpha(.3)}})}),(0,t.jsxs)("div",{className:"flex flex-wrap gap-2.5 min-h-[50px] p-4 border-2 border-dashed rounded-xl premium-card-glow",style:{borderColor:f.accentAlpha(.25),background:f.accentAlpha(.04)},children:[(0,t.jsxs)("div",{className:"w-full font-extrabold uppercase tracking-wider mb-2",style:{...f.micro(),color:f.accent()},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"drag_indicator"})," Pilih Item (",B,"/",C,")"]}),M.map((a,r)=>{if(R.has(r))return null;let n=g===r,o=n?f.accentAlpha(.2):d.subtleBg(.07),i=n?f.accent():d.subtleBorder(.15),s=n?"0 0 16px "+f.accentAlpha(.35):f.shadow("card");return(0,t.jsx)("button",{onClick:()=>{m&&(b(e=>e===r?null:r),(0,l.playSound)("click"))},"aria-pressed":g===r,"aria-label":`Item: ${a.text}${g===r?", dipilih":""}`,className:`px-3.5 py-2 rounded-full font-extrabold ${d.iosGameButtonTw(m)} min-w-0 ${u?"canvas-truncate-1":""}`,style:{background:o,border:"2px solid "+i,boxShadow:s,...f.caption(),animation:n?"pulse 1.5s ease-in-out infinite":"none",wordBreak:"break-word",overflowWrap:"break-word",outline:n?"3px solid "+f.accentAlpha(.5):"none",outlineOffset:"2px"},children:a.text},`dd-item-${e.id||"dd"}-${r}`)}),M.every((e,t)=>R.has(t))&&(0,t.jsx)("div",{className:"w-full text-center py-1",style:{...f.micro(),color:f.mutedText(.5)},children:"Semua item telah ditempatkan!"})]}),(0,t.jsx)("div",{className:"space-y-2.5",children:$.map(a=>{let r=a.id,n=x[r]||[],o=null!==g,i=a.color||"y",s=o?d.colorAlpha(i,.08):d.colorAlpha(i,.03),c=o?d.colorAlpha(i,.5):d.colorAlpha(i,.25),u=o?"0 0 12px "+d.colorAlpha(i,.12):f.shadow("card");return(0,t.jsxs)("div",{onClick:()=>E(r),role:"button",tabIndex:0,"aria-label":`Target ${r+1}`,onKeyDown:e=>{("Enter"===e.key||" "===e.key)&&(e.preventDefault(),E(r))},className:"rounded-xl p-3.5 min-h-[60px] border-2 transition-[background-color,border-color,box-shadow] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent",style:{borderStyle:o?"solid":"dashed",borderColor:c,background:s,boxShadow:u},children:[(0,t.jsxs)("div",{className:"flex items-center gap-2 mb-2 min-w-0",children:[(0,t.jsx)("div",{className:"w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",style:{background:d.colorAlpha(i,.2)},children:(0,t.jsx)("span",{className:"material-symbols-outlined",style:{fontSize:"12px"},children:"drag_indicator"})}),(0,t.jsx)("div",{className:"font-extrabold uppercase tracking-wider min-w-0",style:{...f.caption(),color:d.color(i),overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:a.label})]}),n.length>0?(0,t.jsx)("div",{className:"flex flex-wrap gap-1.5",children:n.map(a=>(0,t.jsx)("button",{onClick:e=>{var t;e.stopPropagation(),t=a.idx,m&&(y(e=>{let a=e[r]||[];return{...e,[r]:a.filter(e=>e.idx!==t)}}),(0,l.playSound)("click"))},className:"px-2.5 py-1 rounded-full font-bold"+d.iosGameButtonTw(m)+" min-w-0",style:{...f.micro(),background:d.colorAlpha(i,.2),color:d.color(i),border:"1px solid "+d.colorAlpha(i,.3),wordBreak:"break-word",overflowWrap:"break-word",maxWidth:"100%",cursor:m?"pointer":"default",textDecoration:"none"},title:"Klik untuk menghapus dari target","aria-label":`Hapus ${a.text} dari target`,children:a.text},`dd-placed-${e.id||"dd"}-${a.idx}`))}):(0,t.jsx)("div",{style:{...f.micro(),color:f.mutedText(.4)},children:o?"Klik di sini untuk menempatkan item":"Area target — tempatkan item di sini"})]},`dd-target-${e.id||"dd"}-${r}`)})}),null===g&&B<C&&m&&(0,t.jsx)("div",{className:"text-center",style:{...f.micro(),color:f.mutedText(.5)},children:"Pilih item di kolam terlebih dahulu"}),null!==g&&m&&(0,t.jsx)("div",{className:"text-center",style:{...f.micro(),color:f.accent()},children:"Sekarang klik target yang tepat untuk menempatkan item"}),(0,t.jsxs)("div",{className:"print-only print-answer-key",children:[(0,t.jsx)("h3",{children:"Kunci Jawaban: Seret & Letakkan"}),(0,t.jsx)("ul",{children:M.map((a,r)=>{let n=$.find(e=>e.id===a.target);return(0,t.jsxs)("li",{children:[(0,t.jsx)("strong",{children:a.text})," → ",n?.label||a.target]},`dd-ans-${e.id||"dd"}-${r}`)})})]})]})})});e.s(["DragDropGameRenderer",0,d])}]);