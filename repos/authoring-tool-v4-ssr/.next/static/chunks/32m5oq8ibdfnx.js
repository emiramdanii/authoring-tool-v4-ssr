(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,96359,e=>{"use strict";let a=["#f9c12e","#3ecfcf","#34d399","#a78bfa","#ff6b6b","#fb923c","#fbbf24","#22d3ee","#f472b6","#818cf8"],t=["★","●","■","◆","✦","♥","✿","⬟"],r=!1;function n(){if(r||"u"<typeof document)return;r=!0;let e=document.createElement("style");e.id="confetti-enhanced-keyframes",e.textContent=`
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
  `,document.head.appendChild(e)}function o(){let e=Math.random();return e<.35?"rect":e<.55?"circle":e<.8?"star":"diamond"}function l(e){let{x:a,y:r,color:n,shape:o,dx:l,dy:i,rotation:s,drift:c,delay:d,duration:m,shimmer:u,wrapper:h,animationType:p,sx:f=0,sy:x=0}=e,g=document.createElement("div"),y=6+8*Math.random();if("star"===o||"diamond"===o){let e="star"===o?t[Math.floor(2*Math.random())]:t[3];g.style.cssText=`
      position: absolute;
      left: ${a}px;
      top: ${r}px;
      font-size: ${1.4*y}px;
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
    `,Math.random()>.3&&(g.style.animation+=`, confettiTumble ${1200+800*Math.random()}ms linear ${d}ms infinite`),g.textContent=e}else{let e="circle"===o;g.style.cssText=`
      position: absolute;
      left: ${a}px;
      top: ${r}px;
      width: ${y}px;
      height: ${e?y:.5*y}px;
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
    `}u&&.3>Math.random()&&(g.style.animation+=`, confettiShimmer ${400+300*Math.random()}ms ease-in-out ${d}ms infinite`),h.appendChild(g)}function i(e){let a=document.createElement("div");return a.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 9999; overflow: hidden;
  `,e.appendChild(a),a}function s(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function c(e={}){if(s())return;n();let{count:t=50,duration:r=3e3,container:d=document.body,originX:m=.5,originY:u=.3}=e,h=i(d),p=window.innerWidth*m,f=window.innerHeight*u;for(let e=0;e<t;e++){let e=a[Math.floor(Math.random()*a.length)],t=Math.random()*Math.PI*2,n=200+400*Math.random(),i=Math.cos(t)*n,s=Math.sin(t)*n-300,c=720*Math.random()-360,d=(Math.random()-.5)*120,m=200*Math.random();l({x:p,y:f,color:e,shape:o(),dx:i,dy:s,rotation:c,drift:d,delay:m,duration:r,shimmer:!0,wrapper:h,animationType:"center"})}setTimeout(()=>{h.remove()},r+500)}function d(e={}){if(s())return;n();let{count:t=70,duration:r=3500,container:c=document.body}=e,m=i(c),u=window.innerWidth,h=window.innerHeight,p=Math.floor(t/2);for(let e=0;e<p;e++){let e=a[Math.floor(Math.random()*a.length)],t=h*(.5+.3*Math.random()),n=u*(.2+.4*Math.random()),i=-(.2*h+Math.random()*h*.3),s=720*Math.random()-360,c=20+60*Math.random(),d=300*Math.random();l({x:0,y:t,color:e,shape:o(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:r,shimmer:!0,wrapper:m,animationType:"side",sx:n,sy:i})}for(let e=0;e<p;e++){let e=a[Math.floor(Math.random()*a.length)],t=h*(.5+.3*Math.random()),n=-(u*(.2+.4*Math.random())),i=-(.2*h+Math.random()*h*.3),s=720*Math.random()-360,c=-(20+60*Math.random()),d=300*Math.random();l({x:u,y:t,color:e,shape:o(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:r,shimmer:!0,wrapper:m,animationType:"side",sx:n,sy:i})}setTimeout(()=>{m.remove()},r+500)}e.s(["fireConfetti",0,c,"fireConfettiCelebration",0,function(e={}){if(s())return;let{count:a=60,duration:t=3500,container:r=document.body}=e;d({count:a+10,duration:t,container:r}),setTimeout(()=>{c({count:a,duration:t-200,container:r,originX:.5,originY:.3})},300),setTimeout(()=>{d({count:Math.floor(.7*a),duration:t-400,container:r})},600)},"fireConfettiMini",0,function(e={}){if(s())return;n();let{count:t=9,duration:r=1200,container:c=document.body,originX:d=.5,originY:m=.5}=e,u=i(c),h=window.innerWidth*d,p=window.innerHeight*m;for(let e=0;e<t;e++){let e=a[Math.floor(Math.random()*a.length)],t=Math.random()*Math.PI*2,n=80+150*Math.random(),i=Math.cos(t)*n,s=Math.sin(t)*n-100,c=360*Math.random()-180,d=(Math.random()-.5)*40,m=100*Math.random();l({x:h,y:p,color:e,shape:o(),dx:i,dy:s,rotation:c,drift:d,delay:m,duration:r,shimmer:!1,wrapper:u,animationType:"center"})}setTimeout(()=>{u.remove()},r+300)}])},12475,37230,e=>{"use strict";let a=(0,e.i(75254).default)("dumbbell",[["path",{d:"M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z",key:"9m4mmf"}],["path",{d:"m2.5 21.5 1.4-1.4",key:"17g3f0"}],["path",{d:"m20.1 3.9 1.4-1.4",key:"1qn309"}],["path",{d:"M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z",key:"1t2c92"}],["path",{d:"m9.6 14.4 4.8-4.8",key:"6umqxw"}]]);e.s(["Dumbbell",0,a],12475);var t=e.i(71645),r=e.i(73829);e.s(["useGameA11y",0,function(e){let{gameType:a,blockId:n,score:o,maxScore:l,interactive:i}=e,s=(0,t.useRef)(o);(0,t.useEffect)(()=>{i&&(o!==s.current&&o>s.current&&(0,r.announceToScreenReader)(`Skor: ${o}`,"polite"),s.current=o)},[o,i]);let c=(0,r.gameAriaLabel)(a,o,l),d=`game-instructions-${n||"game"}`,m=i?{role:"application","aria-label":c,"aria-describedby":d}:{"aria-label":c},u=(0,t.useCallback)((e,a="polite")=>{(0,r.announceToScreenReader)(e,a)},[]),h=(0,t.useCallback)(()=>{(0,r.announceToScreenReader)("Benar!","assertive")},[]),p=(0,t.useCallback)(e=>{let a=e?`Salah. Jawaban yang benar: ${e}`:"Salah!";(0,r.announceToScreenReader)(a,"assertive")},[]),f=(0,t.useCallback)((e,a)=>{let t=a>0?Math.round(e/a*100):0;(0,r.announceToScreenReader)(`Game selesai! ${t>=80?"Luar Biasa":t>=50?"Bagus":"Terus Berlatih"}. Skor kamu: ${e} dari ${a} (${t}%)`,"assertive")},[]),x=(0,t.useCallback)(e=>{(0,r.announceToScreenReader)(`Skor: ${e}`,"polite")},[]),g=(0,t.useCallback)((e,a,t)=>(0,r.progressBarAria)(e,a,t),[]),y=(0,t.useCallback)((e="polite")=>(0,r.liveRegion)(e),[]);return{ariaLabel:c,rootAria:m,progressAria:g,liveAria:y,instructionId:d,announce:u,announceCorrect:h,announceIncorrect:p,announceComplete:f,announceScore:x,rovingFocus:(0,t.useCallback)((e,a,t,n="both",o)=>(0,r.handleRovingFocus)(e,a,t,n,o),[]),isActivation:(0,t.useCallback)(e=>(0,r.isActivationKey)(e),[])}}],37230)},24133,e=>{"use strict";var a=e.i(43476),t=e.i(71645),r=e.i(12475),n=e.i(61051),o=e.i(27700),l=e.i(5262),i=e.i(96359),s=e.i(37230),c=e.i(52926);let d=t.default.memo(function({block:e,tokens:d,interactive:m,isCompact:u,isEditing:h,pageIndex:p}){let f=d.edu("true-false-game",u),[x,g]=t.default.useState(0),[y,b]=t.default.useState(0),[v,k]=t.default.useState(!1),[S,j]=t.default.useState(null),[w,M]=t.default.useState("play"),$=t.default.useRef([]);t.default.useEffect(()=>()=>{$.current.forEach(clearTimeout)},[]);let B=e.questions||[],T=t.default.useMemo(()=>B.filter(e=>e.text).map(e=>({...e,correct:"string"==typeof e.correct?"true"===e.correct.toLowerCase():!!e.correct})),[B]),N=t.default.useMemo(()=>JSON.stringify(T.map(e=>({t:e.text,c:e.correct}))),[T]);t.default.useEffect(()=>{$.current.forEach(clearTimeout),$.current=[],g(0),b(0),k(!1),j(null),M("play")},[N]);let A=(0,o.useInteractiveStore)(e=>e.replayGeneration);t.default.useEffect(()=>{g(0),b(0),k(!1),j(null),M("play")},[A]);let C=(0,o.useInteractiveStore)(e=>e.reportScore),z=(0,s.useGameA11y)({gameType:"Benar/Salah",blockId:e.id,score:y,maxScore:T.length,interactive:m??!1}),I=t.default.useRef(!1);t.default.useEffect(()=>{if("result"===w&&m&&e.id&&!I.current){I.current=!0,C({elementId:e.id,pageIndex:p??0,score:y,maxScore:T.length,completed:!0});let a=T.length>0?Math.round(y/T.length*100):0;a>=80?((0,l.playSound)("complete"),(0,i.fireConfettiCelebration)()):a>=50?((0,l.playSound)("complete"),(0,i.fireConfetti)({count:30})):(0,l.playSound)("ding"),z.announceComplete(y,T.length)}"result"!==w&&(I.current=!1)},[w,m,e.id,y,T.length,C,p,z]);let R=(0,n.useInlineEditor)({blockId:e.id,fieldKey:"title",value:e.title??"",tag:"span"}),E=t.default.useCallback(e=>{if(v||x>=T.length)return;let a=T[x],t=e===a.correct;j(e),k(!0),t?(b(e=>e+1),(0,l.playSound)("correct"),z.announceCorrect()):((0,l.playSound)("incorrect"),z.announceIncorrect(a.correct?"Benar":"Salah"));let r=setTimeout(()=>{x+1<T.length?(g(e=>e+1),k(!1),j(null)):M("result")},1200);$.current.push(r)},[v,x,T]),P=t.default.useCallback(()=>{$.current.forEach(clearTimeout),$.current=[],g(0),b(0),k(!1),j(null),M("play"),I.current=!1,(0,l.playSound)("click")},[]);if(0===T.length)return(0,a.jsxs)("div",{className:"flex flex-col items-center justify-center p-6 text-center rounded-xl",style:{background:d.subtleBg(.04),border:"2px dashed "+d.subtleBorder(.15)},children:[(0,a.jsx)("span",{className:"material-symbols-outlined",style:{fontSize:"24px"},children:"check_circle"}),(0,a.jsx)("div",{className:"mt-2 font-extrabold",style:{...f.caption(),color:f.mutedText(.5)},children:"Benar / Salah"}),(0,a.jsx)("div",{style:{...f.micro(),color:f.mutedText(.35)},children:"Belum ada soal Benar/Salah ditambahkan"})]});if("result"===w){let e=T.length>0?Math.round(y/T.length*100):0,t=e>=80?(0,a.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"28px"},children:"emoji_events"}):e>=50?(0,a.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"28px"},children:"star"}):(0,a.jsx)(r.Dumbbell,{size:28,className:"inline",style:{color:f.accent()}});return(0,a.jsx)(c.PremiumBlockWrapper,{tokens:d,accent:"y",staggerIndex:0,gradientBorder:!0,children:(0,a.jsxs)("div",{className:"text-center p-5 rounded-2xl",style:{background:f.pageBg(),border:"2px solid "+f.accentAlpha(.3),boxShadow:f.shadow("elevated"),animation:"popSuccess 0.5s ease-out"},children:[(0,a.jsx)(c.ReadingProgressIndicator,{progress:1,tokens:d,accent:"y",height:3,position:"top"}),(0,a.jsx)("div",{className:"text-3xl mb-3",style:{animation:"float 3s ease-in-out infinite"},children:t}),(0,a.jsx)("div",{className:"font-black text-lg mb-1",style:{fontFamily:d.fontFamily("display"),color:f.accent()},children:e>=80?"Luar Biasa!":e>=50?"Bagus!":"Terus Berlatih!"}),(0,a.jsxs)("div",{className:"mb-4",style:{...f.body(),color:f.mutedText(.8)},children:["Skor kamu: ",y,"/",T.length," (",e,"%)"]}),(0,a.jsxs)("div",{className:"flex justify-center gap-3 mb-2",children:[(0,a.jsxs)(c.PremiumBadge,{tokens:d,accent:"g",variant:"glass",children:["Benar ",y]}),(0,a.jsxs)(c.PremiumBadge,{tokens:d,accent:"r",variant:"glass",children:["Salah ",T.length-y]})]}),m&&(0,a.jsx)(c.MicroInteraction,{tokens:d,accent:"y",effect:"squish",children:(0,a.jsxs)("button",{className:"mt-4 px-5 py-2 rounded-xl font-extrabold"+d.iosButtonTw(m),onClick:P,style:{...f.caption(),background:"linear-gradient(135deg, "+f.accent()+", "+d.color("o")+")",color:d.color("bg"),boxShadow:"0 4px 16px "+f.accentAlpha(.35)},children:[(0,a.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"refresh"})," Ulangi"]})})]})})}let W=T[x];if(!W)return null;let F=null!==S&&S===W.correct,K=(x+ +!!v)/T.length*100;return(0,a.jsx)(c.PremiumBlockWrapper,{tokens:d,accent:"y",staggerIndex:0,children:(0,a.jsxs)("div",{className:"space-y-3 game-block",...z.rootAria,"data-interactive":!0,children:[(0,a.jsx)(c.ReadingProgressIndicator,{progress:T.length>0?(x+ +!!v)/T.length:0,tokens:d,accent:"y",height:3,position:"top"}),(0,a.jsx)("div",{id:z.instructionId,className:"sr-only",children:"Tentukan apakah pernyataan benar atau salah"}),(0,a.jsxs)("div",{className:"flex items-center justify-between min-w-0",children:[(0,a.jsx)("div",{className:"flex items-center gap-2 min-w-0",children:(0,a.jsxs)("div",{className:"font-extrabold",style:{...f.caption(),color:f.accent()},children:[(0,a.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"check_circle"})," ",(0,a.jsx)(n.InlineTextEditor,{...R,className:"font-extrabold",style:{color:f.accent(),...f.micro()},placeholder:"Ketik judul Benar/Salah..."})]})}),(0,a.jsxs)(c.PremiumBadge,{tokens:d,accent:"y",variant:"glass",children:[x+1,"/",T.length]})]}),(0,a.jsxs)("div",{className:"h-1.5 rounded-full overflow-hidden relative",...z.progressAria("Kemajuan Benar/Salah",x+ +!!v,T.length),style:{background:d.subtleBg(.08)},children:[(0,a.jsx)("div",{className:"h-full rounded-full",style:{width:`${K}%`,...d.iosTransitionStyle("width","slow"),background:"linear-gradient(90deg, "+f.accent()+", "+d.color("g")+")",backgroundSize:"200% 100%",animation:"shimmer 2s linear infinite",boxShadow:"0 0 8px "+f.accentAlpha(.3)}}),(0,a.jsx)("div",{style:{position:"absolute",top:0,left:0,right:0,bottom:0,background:"linear-gradient(90deg, transparent, "+f.accentAlpha(.2)+", transparent)",backgroundSize:"200% 100%",animation:"shimmer 3s ease-in-out infinite",pointerEvents:"none",borderRadius:"inherit"}})]}),(0,a.jsxs)("div",{className:"flex justify-between items-center",children:[(0,a.jsxs)("span",{className:"font-bold",style:{...f.micro(),color:f.accent()},children:["Soal ",x+1,"/",T.length]}),(0,a.jsxs)("span",{style:{...f.micro(),color:f.mutedText(.6)},"aria-live":"polite",children:["Skor: ",y]})]}),(0,a.jsxs)("div",{className:"p-4 rounded-xl premium-card-glow",style:{background:f.accentAlpha(.06),border:"1px solid "+f.accentAlpha(.2),boxShadow:f.shadow("card"),overflow:"hidden"},children:[(0,a.jsx)("p",{className:`font-bold leading-relaxed mb-4  ${u?"canvas-truncate-2":""}`,style:{color:f.textColor(),wordBreak:"break-word",overflowWrap:"break-word"},children:W.text}),(0,a.jsxs)("div",{className:"grid grid-cols-2 gap-3",children:[(0,a.jsx)("button",{disabled:v,onClick:()=>{m&&E(!0)},"aria-pressed":!0===S,"aria-label":"Benar",className:`p-3 rounded-xl font-extrabold text-center ${d.iosQuizOptionTw(!v&&m)} min-w-0 ${u?"canvas-truncate-1":""}`,style:{...f.body(),background:v?!0===S?F?d.colorAlpha("g",.2):d.colorAlpha("r",.2):d.colorAlpha("g",.04):d.colorAlpha("g",.08),border:"2px solid "+(v?!0===S?F?d.color("g"):d.color("r"):d.subtleBorder(.08):d.colorAlpha("g",.3)),boxShadow:v&&!0===S?F?"0 0 12px "+d.colorAlpha("g",.25):"0 0 12px "+d.colorAlpha("r",.25):"none",color:v?!0===S?F?d.color("g"):d.color("r"):f.mutedText(.35):d.color("g"),cursor:v?"default":"pointer",opacity:v&&!0!==S?.55:1},children:"✅ Benar"},`tf-opt-${e.id||"tf"}-${x}-benar`),(0,a.jsx)("button",{disabled:v,onClick:()=>{m&&E(!1)},"aria-pressed":!1===S,"aria-label":"Salah",className:`p-3 rounded-xl font-extrabold text-center ${d.iosQuizOptionTw(!v&&m)} min-w-0 ${u?"canvas-truncate-1":""}`,style:{...f.body(),background:v?!1===S?F?d.colorAlpha("g",.2):d.colorAlpha("r",.2):d.colorAlpha("r",.04):d.colorAlpha("r",.08),border:"2px solid "+(v?!1===S?F?d.color("g"):d.color("r"):d.subtleBorder(.08):d.colorAlpha("r",.3)),boxShadow:v&&!1===S?F?"0 0 12px "+d.colorAlpha("g",.25):"0 0 12px "+d.colorAlpha("r",.25):"none",color:v?!1===S?F?d.color("g"):d.color("r"):f.mutedText(.35):d.color("r"),cursor:v?"default":"pointer",opacity:v&&!1!==S?.55:1},children:"❌ Salah"},`tf-opt-${e.id||"tf"}-${x}-salah`)]}),v&&(0,a.jsxs)("div",{className:"mt-3 p-3 rounded-xl leading-relaxed",style:{...f.caption(),background:F?d.colorAlpha("g",.1):d.colorAlpha("r",.1),border:"1px solid "+(F?d.colorAlpha("g",.3):d.colorAlpha("r",.3)),color:F?d.color("g"):d.color("r"),animation:"fadeIn 0.3s ease",wordBreak:"break-word",overflowWrap:"break-word"},children:[F?(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("span",{className:"material-symbols-outlined inline mr-1",style:{fontSize:"14px"},children:"check_circle"})," Benar!"]}):(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("span",{className:"material-symbols-outlined inline mr-1",style:{fontSize:"14px"},children:"cancel"})," Salah. Jawaban yang benar: ",W.correct?"Benar":"Salah"]}),W.explanation&&(0,a.jsx)("div",{className:"mt-1",style:{...f.micro(),opacity:.85,overflowWrap:"break-word"},children:W.explanation})]})]}),(0,a.jsxs)("div",{className:"print-only print-answer-key",children:[(0,a.jsx)("h3",{children:"Kunci Jawaban: Benar/Salah"}),(0,a.jsx)("ul",{children:T.map((t,r)=>(0,a.jsxs)("li",{children:[r+1,". ",t.text," — ",(0,a.jsx)("strong",{children:t.correct?"Benar":"Salah"}),t.explanation?` (${t.explanation})`:""]},`tf-ans-${e.id||"tf"}-${r}`))})]})]})})});e.s(["TrueFalseGameRenderer",0,d])}]);