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
  `,document.head.appendChild(e)}function o(){let e=Math.random();return e<.35?"rect":e<.55?"circle":e<.8?"star":"diamond"}function i(e){let{x:t,y:r,color:n,shape:o,dx:i,dy:l,rotation:s,drift:c,delay:d,duration:u,shimmer:m,wrapper:f,animationType:h,sx:p=0,sy:x=0}=e,y=document.createElement("div"),g=6+8*Math.random();if("star"===o||"diamond"===o){let e="star"===o?a[Math.floor(2*Math.random())]:a[3];y.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${r}px;
      font-size: ${1.4*g}px;
      color: ${n};
      pointer-events: none;
      will-change: transform, opacity;
      line-height: 1;
      animation: ${"side"===h?"confettiSideBurst":"confettiBurst"} ${u}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${i}px;
      --dy: ${l}px;
      --rot: ${s}deg;
      --drift: ${c}px;
      --sx: ${p}px;
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
      animation: ${"side"===h?"confettiSideBurst":"confettiBurst"} ${u}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${i}px;
      --dy: ${l}px;
      --rot: ${s}deg;
      --drift: ${c}px;
      --sx: ${p}px;
      --sy: ${x}px;
    `}m&&.3>Math.random()&&(y.style.animation+=`, confettiShimmer ${400+300*Math.random()}ms ease-in-out ${d}ms infinite`),f.appendChild(y)}function l(e){let t=document.createElement("div");return t.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 9999; overflow: hidden;
  `,e.appendChild(t),t}function s(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function c(e={}){if(s())return;n();let{count:a=50,duration:r=3e3,container:d=document.body,originX:u=.5,originY:m=.3}=e,f=l(d),h=window.innerWidth*u,p=window.innerHeight*m;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,n=200+400*Math.random(),l=Math.cos(a)*n,s=Math.sin(a)*n-300,c=720*Math.random()-360,d=(Math.random()-.5)*120,u=200*Math.random();i({x:h,y:p,color:e,shape:o(),dx:l,dy:s,rotation:c,drift:d,delay:u,duration:r,shimmer:!0,wrapper:f,animationType:"center"})}setTimeout(()=>{f.remove()},r+500)}function d(e={}){if(s())return;n();let{count:a=70,duration:r=3500,container:c=document.body}=e,u=l(c),m=window.innerWidth,f=window.innerHeight,h=Math.floor(a/2);for(let e=0;e<h;e++){let e=t[Math.floor(Math.random()*t.length)],a=f*(.5+.3*Math.random()),n=m*(.2+.4*Math.random()),l=-(.2*f+Math.random()*f*.3),s=720*Math.random()-360,c=20+60*Math.random(),d=300*Math.random();i({x:0,y:a,color:e,shape:o(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:r,shimmer:!0,wrapper:u,animationType:"side",sx:n,sy:l})}for(let e=0;e<h;e++){let e=t[Math.floor(Math.random()*t.length)],a=f*(.5+.3*Math.random()),n=-(m*(.2+.4*Math.random())),l=-(.2*f+Math.random()*f*.3),s=720*Math.random()-360,c=-(20+60*Math.random()),d=300*Math.random();i({x:m,y:a,color:e,shape:o(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:r,shimmer:!0,wrapper:u,animationType:"side",sx:n,sy:l})}setTimeout(()=>{u.remove()},r+500)}e.s(["fireConfetti",0,c,"fireConfettiCelebration",0,function(e={}){if(s())return;let{count:t=60,duration:a=3500,container:r=document.body}=e;d({count:t+10,duration:a,container:r}),setTimeout(()=>{c({count:t,duration:a-200,container:r,originX:.5,originY:.3})},300),setTimeout(()=>{d({count:Math.floor(.7*t),duration:a-400,container:r})},600)},"fireConfettiMini",0,function(e={}){if(s())return;n();let{count:a=9,duration:r=1200,container:c=document.body,originX:d=.5,originY:u=.5}=e,m=l(c),f=window.innerWidth*d,h=window.innerHeight*u;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,n=80+150*Math.random(),l=Math.cos(a)*n,s=Math.sin(a)*n-100,c=360*Math.random()-180,d=(Math.random()-.5)*40,u=100*Math.random();i({x:f,y:h,color:e,shape:o(),dx:l,dy:s,rotation:c,drift:d,delay:u,duration:r,shimmer:!1,wrapper:m,animationType:"center"})}setTimeout(()=>{m.remove()},r+300)}])},12475,37230,e=>{"use strict";let t=(0,e.i(75254).default)("dumbbell",[["path",{d:"M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z",key:"9m4mmf"}],["path",{d:"m2.5 21.5 1.4-1.4",key:"17g3f0"}],["path",{d:"m20.1 3.9 1.4-1.4",key:"1qn309"}],["path",{d:"M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z",key:"1t2c92"}],["path",{d:"m9.6 14.4 4.8-4.8",key:"6umqxw"}]]);e.s(["Dumbbell",0,t],12475);var a=e.i(71645),r=e.i(73829);e.s(["useGameA11y",0,function(e){let{gameType:t,blockId:n,score:o,maxScore:i,interactive:l}=e,s=(0,a.useRef)(o);(0,a.useEffect)(()=>{l&&(o!==s.current&&o>s.current&&(0,r.announceToScreenReader)(`Skor: ${o}`,"polite"),s.current=o)},[o,l]);let c=(0,r.gameAriaLabel)(t,o,i),d=`game-instructions-${n||"game"}`,u=l?{role:"application","aria-label":c,"aria-describedby":d}:{"aria-label":c},m=(0,a.useCallback)((e,t="polite")=>{(0,r.announceToScreenReader)(e,t)},[]),f=(0,a.useCallback)(()=>{(0,r.announceToScreenReader)("Benar!","assertive")},[]),h=(0,a.useCallback)(e=>{let t=e?`Salah. Jawaban yang benar: ${e}`:"Salah!";(0,r.announceToScreenReader)(t,"assertive")},[]),p=(0,a.useCallback)((e,t)=>{let a=t>0?Math.round(e/t*100):0;(0,r.announceToScreenReader)(`Game selesai! ${a>=80?"Luar Biasa":a>=50?"Bagus":"Terus Berlatih"}. Skor kamu: ${e} dari ${t} (${a}%)`,"assertive")},[]),x=(0,a.useCallback)(e=>{(0,r.announceToScreenReader)(`Skor: ${e}`,"polite")},[]),y=(0,a.useCallback)((e,t,a)=>(0,r.progressBarAria)(e,t,a),[]),g=(0,a.useCallback)((e="polite")=>(0,r.liveRegion)(e),[]);return{ariaLabel:c,rootAria:u,progressAria:y,liveAria:g,instructionId:d,announce:m,announceCorrect:f,announceIncorrect:h,announceComplete:p,announceScore:x,rovingFocus:(0,a.useCallback)((e,t,a,n="both",o)=>(0,r.handleRovingFocus)(e,t,a,n,o),[]),isActivation:(0,a.useCallback)(e=>(0,r.isActivationKey)(e),[])}}],37230)},61196,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(12475),n=e.i(55711),o=e.i(61051),i=e.i(27700),l=e.i(5262),s=e.i(96359),c=e.i(37230),d=e.i(52926);function u(e,t){let a=t||"mem",r=[];e.forEach((e,t)=>{e.left&&e.right&&(r.push({id:`${a}-L${t}`,pairId:`${a}-P${t}`,type:"left",text:e.left}),r.push({id:`${a}-R${t}`,pairId:`${a}-P${t}`,type:"right",text:e.right}))});let n=[...r];for(let e=n.length-1;e>0;e--){let t=Math.floor(Math.random()*(e+1));[n[e],n[t]]=[n[t],n[e]]}return n}let m=a.default.memo(function({block:e,tokens:m,interactive:f,isCompact:h,isEditing:p,pageIndex:x}){var y;let g=m.edu("memory-game",h),b=e.pairs||[],v=a.default.useMemo(()=>b.filter(e=>e.left&&e.right),[b]).length,[k,M]=a.default.useState(()=>u(b,e.id)),[S,j]=a.default.useState([]),[$,w]=a.default.useState(new Set),[T,C]=a.default.useState(0),[N,B]=a.default.useState(0),[A,I]=a.default.useState("play"),R=a.default.useRef([]);a.default.useEffect(()=>{R.current=S},[S]);let z=a.default.useRef(null);a.default.useEffect(()=>()=>{z.current&&clearTimeout(z.current)},[]);let E=(0,i.useInteractiveStore)(e=>e.replayGeneration);a.default.useEffect(()=>{j([]),w(new Set),C(0),B(0),R.current=[],I("play"),M(u(b,e.id)),z.current&&(clearTimeout(z.current),z.current=null)},[E]);let P=(0,i.useInteractiveStore)(e=>e.reportScore),K=(0,c.useGameA11y)({gameType:"Cocokkan Kartu",blockId:e.id,score:$.size/2,maxScore:v,interactive:f??!1}),Y=a.default.useRef(!1);a.default.useEffect(()=>{if("done"===A&&f&&e.id&&!Y.current){Y.current=!0;let t=Math.max(Math.ceil(.5*v),v-N);P({elementId:e.id,pageIndex:x??0,score:t,maxScore:v,completed:!0});let a=v>0?Math.round(t/v*100):0;a>=80?((0,l.playSound)("complete"),(0,s.fireConfettiCelebration)()):a>=50?((0,l.playSound)("complete"),(0,s.fireConfetti)({count:30})):(0,l.playSound)("ding"),K.announceComplete(t,v)}"done"!==A&&(Y.current=!1)},[A,f,e.id,N,v,P,x,K]);let W=(0,o.useInlineEditor)({blockId:e.id,fieldKey:"title",value:e.title??"",tag:"span"}),F=a.default.useCallback(e=>{if(!f||"play"!==A||$.has(e)||R.current.includes(e))return;let t=[...R.current,e];if(R.current=t,j(t),1!==t.length){if(2===t.length){C(e=>e+1);let e=k.find(e=>e.id===t[0]),a=k.find(e=>e.id===t[1]);if(!e||!a)return;if(e.pairId===a.pairId&&e.type!==a.type){(0,l.playSound)("correct"),K.announceCorrect();let t=new Set($);t.add(e.id),t.add(a.id),w(t),R.current=[],j([]),t.size===k.length&&I("done")}else(0,l.playSound)("incorrect"),K.announceIncorrect(),B(e=>e+1),z.current&&clearTimeout(z.current),z.current=setTimeout(()=>{R.current=[],j([]),z.current=null},900)}t.length>2&&(R.current=[e],j([e]))}},[f,A,$,k]),G=a.default.useCallback(()=>{j([]),w(new Set),C(0),B(0),R.current=[],I("play"),M(u(b,e.id)),Y.current=!1,z.current&&(clearTimeout(z.current),z.current=null),(0,l.playSound)("click")},[b,e.id]);if(0===v)return(0,t.jsxs)("div",{className:"text-center p-5 rounded-xl",style:{background:g.accentAlpha(.06),border:"2px dashed "+g.accentAlpha(.25)},children:[(0,t.jsx)("div",{className:"text-2xl mb-2",children:"🧠"}),(0,t.jsx)("div",{className:"font-extrabold mb-1",style:{...g.caption(),color:g.accent()},children:(0,t.jsx)(o.InlineTextEditor,{...W,className:"font-extrabold",style:{color:g.accent(),...g.micro()},placeholder:"Ketik judul game..."})}),(0,t.jsx)("div",{style:{...g.caption(),color:g.mutedText(.7)},children:"Tambahkan pasangan kartu untuk memulai game Cocokkan Kartu!"})]});if("done"===A){let e=Math.max(Math.ceil(.5*v),v-N),a=v>0?Math.round(e/v*100):0;return(0,t.jsx)(d.PremiumBlockWrapper,{tokens:m,accent:"y",staggerIndex:0,gradientBorder:!0,children:(0,t.jsxs)("div",{className:"text-center p-5",children:[(0,t.jsx)(d.ReadingProgressIndicator,{progress:1,tokens:m,accent:"y",height:3,position:"top"}),(0,t.jsx)("div",{className:"text-3xl mb-3",style:{animation:"float 3s ease-in-out infinite"},children:a>=80?(0,t.jsx)("span",{className:"material-symbols-outlined inline text-app-accent",style:{fontSize:"28px"},children:"emoji_events"}):a>=50?(0,t.jsx)("span",{className:"material-symbols-outlined inline text-app-accent",style:{fontSize:"28px"},children:"star"}):(0,t.jsx)(r.Dumbbell,{size:28,className:"inline text-app-accent"})}),(0,t.jsx)("div",{className:"font-black text-lg mb-1",style:{fontFamily:m.fontFamily("display"),color:g.accent()},children:a>=80?"Luar Biasa!":a>=50?"Bagus!":"Terus Berlatih!"}),(0,t.jsxs)("div",{className:"mb-4",style:{...g.body(),color:g.mutedText(.8)},children:["Skor kamu: ",e,"/",v," (",a,"%)"]}),(0,t.jsxs)("div",{className:"flex justify-center gap-3",children:[(0,t.jsxs)(d.PremiumBadge,{tokens:m,accent:"g",variant:"glass",children:["Langkah ",T]}),(0,t.jsxs)(d.PremiumBadge,{tokens:m,accent:"r",variant:"glass",children:["Salah ",N]})]}),f&&(0,t.jsx)(d.MicroInteraction,{tokens:m,accent:"y",effect:"squish",children:(0,t.jsxs)("button",{className:"mt-4 px-5 py-2 rounded-xl font-extrabold"+m.iosButtonTw(f),onClick:G,style:{...g.caption(),background:"linear-gradient(135deg, "+g.accent()+", "+m.color("o")+")",color:m.color("bg"),boxShadow:"0 4px 16px "+g.accentAlpha(.35)},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"refresh"})," Ulangi"]})})]})})}let L=(y=k.length)<=4?2:y<=8?3:4;return(0,t.jsx)(d.PremiumBlockWrapper,{tokens:m,accent:"y",staggerIndex:0,children:(0,t.jsxs)("div",{className:"space-y-3 game-block",...K.rootAria,"data-interactive":!0,children:[(0,t.jsx)(d.ReadingProgressIndicator,{progress:v>0?$.size/2/v:0,tokens:m,accent:"y",height:3,position:"top"}),(0,t.jsx)("div",{id:K.instructionId,className:"sr-only",children:"Balik kartu untuk menemukan pasangan yang cocok"}),(0,t.jsxs)("div",{className:"flex items-center justify-between min-w-0",children:[(0,t.jsx)("div",{className:"flex items-center gap-2 min-w-0",children:(0,t.jsxs)("div",{className:"font-extrabold",style:{...g.caption(),color:g.accent()},children:[(0,t.jsx)(n.Brain,{size:14,className:"inline"})," ",(0,t.jsx)(o.InlineTextEditor,{...W,className:"font-extrabold",style:{color:g.accent(),...g.micro()},placeholder:"Ketik judul game..."})]})}),(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsxs)(d.PremiumBadge,{tokens:m,accent:"y",variant:"glass",children:[$.size/2,"/",v]}),(0,t.jsxs)("span",{className:"px-2.5 py-1 rounded-full font-extrabold",style:{...g.micro(),background:m.colorAlpha("c",.15),color:m.color("c"),border:"1px solid "+m.colorAlpha("c",.3)},children:[T," langkah"]})]})]}),(0,t.jsxs)("div",{className:"h-1.5 rounded-full overflow-hidden relative",...K.progressAria("Kemajuan Cocokkan Kartu",$.size/2,v),style:{background:m.subtleBg(.08)},children:[(0,t.jsx)("div",{className:"h-full rounded-full",style:{width:v>0?$.size/k.length*100+"%":"0%",...m.iosTransitionStyle("width","slow"),background:"linear-gradient(90deg, "+g.accent()+", "+m.color("g")+")",backgroundSize:"200% 100%",animation:"shimmer 2s linear infinite",boxShadow:"0 0 8px "+g.accentAlpha(.3)}}),(0,t.jsx)("div",{style:{position:"absolute",top:0,left:0,right:0,bottom:0,background:"linear-gradient(90deg, transparent, "+g.accentAlpha(.2)+", transparent)",backgroundSize:"200% 100%",animation:"shimmer 3s ease-in-out infinite",pointerEvents:"none",borderRadius:"inherit"}})]}),(0,t.jsx)("div",{className:`grid gap-2.5 premium-card-glow ${h?"max-h-72 overflow-hidden":""}`,style:{gridTemplateColumns:`repeat(${L}, 1fr)`,perspective:"1000px"},role:"group","aria-label":"Kartu memory",children:k.map(a=>{let r=S.includes(a.id),n=$.has(a.id),o=r||n;return(0,t.jsx)("button",{onClick:()=>F(a.id),disabled:!f||n,className:"relative w-full rounded-xl transition-transform duration-300 cursor-pointer"+m.iosFocusRing(),"aria-label":o?a.text:"Kartu tersembunyi","aria-pressed":o,style:{aspectRatio:"3 / 4",perspective:"1000px",transformStyle:"preserve-3d"},children:(0,t.jsxs)("div",{className:"absolute inset-0 transition-transform duration-300",style:{transformStyle:"preserve-3d",transform:o?"rotateY(180deg)":"rotateY(0deg)"},children:[(0,t.jsx)("div",{className:"absolute inset-0 flex items-center justify-center rounded-xl backface-hidden",style:{backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",background:n?m.colorAlpha("g",.15):g.accentAlpha(.08),border:"2px solid "+(n?m.colorAlpha("g",.4):g.accentAlpha(.25)),boxShadow:g.shadow("card")},children:(0,t.jsx)("span",{className:"text-2xl select-none",style:{color:g.accent(),opacity:.6},children:"❓"})}),(0,t.jsx)("div",{className:`absolute inset-0 flex items-center justify-center rounded-xl backface-hidden p-2 ${h?"canvas-truncate-2":""}`,style:{backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",transform:"rotateY(180deg)",background:n?m.colorAlpha("g",.12):"left"===a.type?m.colorAlpha("c",.1):m.colorAlpha("p",.1),border:"2px solid "+(n?m.color("g"):"left"===a.type?m.colorAlpha("c",.4):m.colorAlpha("p",.4)),boxShadow:n?"0 0 12px "+m.colorAlpha("g",.2):"none"},children:(0,t.jsx)("span",{className:"font-bold text-center leading-tight",style:{...g.micro(),color:n?m.color("g"):"left"===a.type?m.color("c"):m.color("p"),wordBreak:"break-word",overflowWrap:"break-word"},children:a.text})})]})},`mem-card-${e.id||"mem"}-${a.id}`)})})]})})});e.s(["MemoryGameRenderer",0,m])}]);