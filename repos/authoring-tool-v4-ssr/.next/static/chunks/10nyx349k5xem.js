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
  `,document.head.appendChild(e)}function o(){let e=Math.random();return e<.35?"rect":e<.55?"circle":e<.8?"star":"diamond"}function l(e){let{x:t,y:r,color:n,shape:o,dx:l,dy:i,rotation:s,drift:c,delay:d,duration:m,shimmer:u,wrapper:h,animationType:p,sx:f=0,sy:x=0}=e,g=document.createElement("div"),b=6+8*Math.random();if("star"===o||"diamond"===o){let e="star"===o?a[Math.floor(2*Math.random())]:a[3];g.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${r}px;
      font-size: ${1.4*b}px;
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
      left: ${t}px;
      top: ${r}px;
      width: ${b}px;
      height: ${e?b:.5*b}px;
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
    `}u&&.3>Math.random()&&(g.style.animation+=`, confettiShimmer ${400+300*Math.random()}ms ease-in-out ${d}ms infinite`),h.appendChild(g)}function i(e){let t=document.createElement("div");return t.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 9999; overflow: hidden;
  `,e.appendChild(t),t}function s(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function c(e={}){if(s())return;n();let{count:a=50,duration:r=3e3,container:d=document.body,originX:m=.5,originY:u=.3}=e,h=i(d),p=window.innerWidth*m,f=window.innerHeight*u;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,n=200+400*Math.random(),i=Math.cos(a)*n,s=Math.sin(a)*n-300,c=720*Math.random()-360,d=(Math.random()-.5)*120,m=200*Math.random();l({x:p,y:f,color:e,shape:o(),dx:i,dy:s,rotation:c,drift:d,delay:m,duration:r,shimmer:!0,wrapper:h,animationType:"center"})}setTimeout(()=>{h.remove()},r+500)}function d(e={}){if(s())return;n();let{count:a=70,duration:r=3500,container:c=document.body}=e,m=i(c),u=window.innerWidth,h=window.innerHeight,p=Math.floor(a/2);for(let e=0;e<p;e++){let e=t[Math.floor(Math.random()*t.length)],a=h*(.5+.3*Math.random()),n=u*(.2+.4*Math.random()),i=-(.2*h+Math.random()*h*.3),s=720*Math.random()-360,c=20+60*Math.random(),d=300*Math.random();l({x:0,y:a,color:e,shape:o(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:r,shimmer:!0,wrapper:m,animationType:"side",sx:n,sy:i})}for(let e=0;e<p;e++){let e=t[Math.floor(Math.random()*t.length)],a=h*(.5+.3*Math.random()),n=-(u*(.2+.4*Math.random())),i=-(.2*h+Math.random()*h*.3),s=720*Math.random()-360,c=-(20+60*Math.random()),d=300*Math.random();l({x:u,y:a,color:e,shape:o(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:r,shimmer:!0,wrapper:m,animationType:"side",sx:n,sy:i})}setTimeout(()=>{m.remove()},r+500)}e.s(["fireConfetti",0,c,"fireConfettiCelebration",0,function(e={}){if(s())return;let{count:t=60,duration:a=3500,container:r=document.body}=e;d({count:t+10,duration:a,container:r}),setTimeout(()=>{c({count:t,duration:a-200,container:r,originX:.5,originY:.3})},300),setTimeout(()=>{d({count:Math.floor(.7*t),duration:a-400,container:r})},600)},"fireConfettiMini",0,function(e={}){if(s())return;n();let{count:a=9,duration:r=1200,container:c=document.body,originX:d=.5,originY:m=.5}=e,u=i(c),h=window.innerWidth*d,p=window.innerHeight*m;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,n=80+150*Math.random(),i=Math.cos(a)*n,s=Math.sin(a)*n-100,c=360*Math.random()-180,d=(Math.random()-.5)*40,m=100*Math.random();l({x:h,y:p,color:e,shape:o(),dx:i,dy:s,rotation:c,drift:d,delay:m,duration:r,shimmer:!1,wrapper:u,animationType:"center"})}setTimeout(()=>{u.remove()},r+300)}])},12475,37230,e=>{"use strict";let t=(0,e.i(75254).default)("dumbbell",[["path",{d:"M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z",key:"9m4mmf"}],["path",{d:"m2.5 21.5 1.4-1.4",key:"17g3f0"}],["path",{d:"m20.1 3.9 1.4-1.4",key:"1qn309"}],["path",{d:"M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z",key:"1t2c92"}],["path",{d:"m9.6 14.4 4.8-4.8",key:"6umqxw"}]]);e.s(["Dumbbell",0,t],12475);var a=e.i(71645),r=e.i(73829);e.s(["useGameA11y",0,function(e){let{gameType:t,blockId:n,score:o,maxScore:l,interactive:i}=e,s=(0,a.useRef)(o);(0,a.useEffect)(()=>{i&&(o!==s.current&&o>s.current&&(0,r.announceToScreenReader)(`Skor: ${o}`,"polite"),s.current=o)},[o,i]);let c=(0,r.gameAriaLabel)(t,o,l),d=`game-instructions-${n||"game"}`,m=i?{role:"application","aria-label":c,"aria-describedby":d}:{"aria-label":c},u=(0,a.useCallback)((e,t="polite")=>{(0,r.announceToScreenReader)(e,t)},[]),h=(0,a.useCallback)(()=>{(0,r.announceToScreenReader)("Benar!","assertive")},[]),p=(0,a.useCallback)(e=>{let t=e?`Salah. Jawaban yang benar: ${e}`:"Salah!";(0,r.announceToScreenReader)(t,"assertive")},[]),f=(0,a.useCallback)((e,t)=>{let a=t>0?Math.round(e/t*100):0;(0,r.announceToScreenReader)(`Game selesai! ${a>=80?"Luar Biasa":a>=50?"Bagus":"Terus Berlatih"}. Skor kamu: ${e} dari ${t} (${a}%)`,"assertive")},[]),x=(0,a.useCallback)(e=>{(0,r.announceToScreenReader)(`Skor: ${e}`,"polite")},[]),g=(0,a.useCallback)((e,t,a)=>(0,r.progressBarAria)(e,t,a),[]),b=(0,a.useCallback)((e="polite")=>(0,r.liveRegion)(e),[]);return{ariaLabel:c,rootAria:m,progressAria:g,liveAria:b,instructionId:d,announce:u,announceCorrect:h,announceIncorrect:p,announceComplete:f,announceScore:x,rovingFocus:(0,a.useCallback)((e,t,a,n="both",o)=>(0,r.handleRovingFocus)(e,t,a,n,o),[]),isActivation:(0,a.useCallback)(e=>(0,r.isActivationKey)(e),[])}}],37230)},3724,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(12475),n=e.i(61051),o=e.i(27700),l=e.i(5262),i=e.i(96359),s=e.i(37230),c=e.i(52926);let d=a.default.memo(function({block:e,tokens:d,interactive:m,isCompact:u,isEditing:h,pageIndex:p}){let f=d.edu("fill-blank-game",u),[x,g]=a.default.useState(0),[b,y]=a.default.useState(0),[v,k]=a.default.useState(!1),[w,j]=a.default.useState(""),[S,M]=a.default.useState(null),[$,T]=a.default.useState("play"),B=a.default.useRef([]);a.default.useEffect(()=>()=>{B.current.forEach(clearTimeout)},[]);let N=e.questions||[],C=a.default.useMemo(()=>N.filter(e=>e.text&&e.answer),[N]),A=a.default.useMemo(()=>JSON.stringify(C.map(e=>({t:e.text,a:e.answer}))),[C]);a.default.useEffect(()=>{B.current.forEach(clearTimeout),B.current=[],g(0),y(0),k(!1),j(""),M(null),T("play")},[A]);let I=(0,o.useInteractiveStore)(e=>e.replayGeneration);a.default.useEffect(()=>{B.current.forEach(clearTimeout),B.current=[],g(0),y(0),k(!1),j(""),M(null),T("play")},[I]);let z=(0,o.useInteractiveStore)(e=>e.reportScore),R=(0,s.useGameA11y)({gameType:"Isian",blockId:e.id,score:b,maxScore:C.length,interactive:m??!1}),E=a.default.useRef(!1);a.default.useEffect(()=>{if("result"===$&&m&&e.id&&!E.current){E.current=!0,z({elementId:e.id,pageIndex:p??0,score:b,maxScore:C.length,completed:!0});let t=C.length>0?Math.round(b/C.length*100):0;t>=80?((0,l.playSound)("complete"),(0,i.fireConfettiCelebration)()):t>=50?((0,l.playSound)("complete"),(0,i.fireConfetti)({count:30})):(0,l.playSound)("ding"),R.announceComplete(b,C.length)}"result"!==$&&(E.current=!1)},[$,m,e.id,b,C.length,z,p,R]);let P=(0,n.useInlineEditor)({blockId:e.id,fieldKey:"title",value:e.title??"",tag:"span"}),K=a.default.useCallback(()=>{if(v||!w.trim()||x>=C.length)return;let e=w.trim().toLowerCase(),t=(C[x].answer||"").toLowerCase().split("/").map(e=>e.trim()).includes(e);M(t),t?(y(e=>e+1),(0,l.playSound)("correct"),R.announceCorrect()):((0,l.playSound)("incorrect"),R.announceIncorrect(C[x].answer)),k(!0);let a=setTimeout(()=>{x+1<C.length?(g(e=>e+1),k(!1),j(""),M(null)):T("result")},1500);B.current.push(a)},[v,w,x,C]),F=a.default.useCallback(()=>{B.current.forEach(clearTimeout),B.current=[],g(0),y(0),k(!1),j(""),M(null),T("play"),E.current=!1,(0,l.playSound)("click")},[]);if(0===C.length)return(0,t.jsxs)("div",{className:"flex flex-col items-center justify-center p-6 text-center rounded-xl",style:{background:d.subtleBg(.04),border:"2px dashed "+d.subtleBorder(.15)},children:[(0,t.jsx)("span",{className:"material-symbols-outlined",style:{fontSize:"24px"},children:"edit"}),(0,t.jsx)("div",{className:"mt-2 font-extrabold",style:{...f.caption(),color:f.mutedText(.5)},children:"Isian"}),(0,t.jsx)("div",{style:{...f.micro(),color:f.mutedText(.35)},children:"Belum ada soal isian ditambahkan"})]});if("result"===$){let e=C.length>0?Math.round(b/C.length*100):0,a=e>=80?(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"28px"},children:"emoji_events"}):e>=50?(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"28px"},children:"star"}):(0,t.jsx)(r.Dumbbell,{size:28,className:"inline",style:{color:f.accent()}});return(0,t.jsx)(c.PremiumBlockWrapper,{tokens:d,accent:"y",staggerIndex:0,gradientBorder:!0,children:(0,t.jsxs)("div",{className:"text-center p-5 rounded-2xl",style:{background:f.pageBg(),border:"2px solid "+f.accentAlpha(.3),boxShadow:f.shadow("elevated"),animation:"popSuccess 0.5s ease-out"},children:[(0,t.jsx)(c.ReadingProgressIndicator,{progress:1,tokens:d,accent:"y",height:3,position:"top"}),(0,t.jsx)("div",{className:"text-3xl mb-3",style:{animation:"float 3s ease-in-out infinite"},children:a}),(0,t.jsx)("div",{className:"font-black text-lg mb-1",style:{fontFamily:d.fontFamily("display"),color:f.accent()},children:e>=80?"Luar Biasa!":e>=50?"Bagus!":"Terus Berlatih!"}),(0,t.jsxs)("div",{className:"mb-4",style:{...f.body(),color:f.mutedText(.8)},children:["Skor kamu: ",b,"/",C.length," (",e,"%)"]}),(0,t.jsxs)("div",{className:"flex justify-center gap-3 mb-2",children:[(0,t.jsxs)(c.PremiumBadge,{tokens:d,accent:"g",variant:"glass",children:["Benar ",b]}),(0,t.jsxs)(c.PremiumBadge,{tokens:d,accent:"r",variant:"glass",children:["Salah ",C.length-b]})]}),m&&(0,t.jsx)(c.MicroInteraction,{tokens:d,accent:"y",effect:"squish",children:(0,t.jsxs)("button",{className:"mt-4 px-5 py-2 rounded-xl font-extrabold"+d.iosButtonTw(m),onClick:F,style:{...f.caption(),background:"linear-gradient(135deg, "+f.accent()+", "+d.color("o")+")",color:d.color("bg"),boxShadow:"0 4px 16px "+f.accentAlpha(.35)},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"refresh"})," Ulangi"]})})]})})}let J=C[x];if(!J)return null;let W=(x+ +!!v)/C.length*100,L=J.text||"",Y=L.split("___");return(0,t.jsx)(c.PremiumBlockWrapper,{tokens:d,accent:"y",staggerIndex:0,children:(0,t.jsxs)("div",{className:"space-y-3 game-block",...R.rootAria,"data-interactive":!0,children:[(0,t.jsx)(c.ReadingProgressIndicator,{progress:C.length>0?(x+ +!!v)/C.length:0,tokens:d,accent:"y",height:3,position:"top"}),(0,t.jsx)("div",{id:R.instructionId,className:"sr-only",children:"Ketik jawaban yang benar pada kolom isian"}),(0,t.jsx)("div",{className:"sr-only",...R.liveAria("polite"),children:v&&(S?"Jawaban benar!":`Jawaban salah. Jawaban yang benar: ${J.answer}`)}),(0,t.jsxs)("div",{className:"flex items-center justify-between min-w-0",children:[(0,t.jsx)("div",{className:"flex items-center gap-2 min-w-0",children:(0,t.jsxs)("div",{className:"font-extrabold",style:{...f.caption(),color:f.accent()},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"edit"})," ",(0,t.jsx)(n.InlineTextEditor,{...P,className:"font-extrabold",style:{color:f.accent(),...f.micro()},placeholder:"Ketik judul isian..."})]})}),(0,t.jsxs)(c.PremiumBadge,{tokens:d,accent:"y",variant:"glass",children:[x+1,"/",C.length]})]}),(0,t.jsxs)("div",{className:"h-1.5 rounded-full overflow-hidden relative",...R.progressAria("Kemajuan Isian",x+ +!!v,C.length),style:{background:d.subtleBg(.08)},children:[(0,t.jsx)("div",{className:"h-full rounded-full",style:{width:`${W}%`,...d.iosTransitionStyle("width","slow"),background:"linear-gradient(90deg, "+f.accent()+", "+d.color("g")+")",backgroundSize:"200% 100%",animation:"shimmer 2s linear infinite",boxShadow:"0 0 8px "+f.accentAlpha(.3)}}),(0,t.jsx)("div",{style:{position:"absolute",top:0,left:0,right:0,bottom:0,background:"linear-gradient(90deg, transparent, "+f.accentAlpha(.2)+", transparent)",backgroundSize:"200% 100%",animation:"shimmer 3s ease-in-out infinite",pointerEvents:"none",borderRadius:"inherit"}})]}),(0,t.jsxs)("div",{className:"flex justify-between items-center",children:[(0,t.jsxs)("span",{className:"font-bold",style:{...f.micro(),color:f.accent()},children:["Soal ",x+1,"/",C.length]}),(0,t.jsxs)("span",{style:{...f.micro(),color:f.mutedText(.6)},"aria-live":"polite",children:["Skor: ",b]})]}),(0,t.jsxs)("div",{className:"p-4 rounded-xl premium-card-glow",style:{background:f.accentAlpha(.06),border:"1px solid "+f.accentAlpha(.2),boxShadow:f.shadow("card"),overflow:"hidden"},children:[(0,t.jsx)("p",{className:`font-bold leading-relaxed mb-3  ${u?"canvas-truncate-2":""}`,style:{color:f.textColor(),wordBreak:"break-word",overflowWrap:"break-word"},children:Y.length>1?(0,t.jsx)(t.Fragment,{children:Y.map((r,n)=>(0,t.jsxs)(a.default.Fragment,{children:[r,n<Y.length-1&&(0,t.jsx)("span",{className:"inline-block min-w-[50px] border-b-2 border-dashed mx-1 text-center",style:{borderColor:f.accentAlpha(.4),color:v?S?d.color("g"):d.color("r"):f.mutedText(.3),...f.micro()},children:v?"(jawaban)":" "})]},`fillblank-part-${e.id||"fb"}-${x}-${n}`))}):L}),J.hint&&!v&&(0,t.jsxs)("div",{className:"mb-3 p-2 rounded-lg flex items-start gap-1.5",style:{background:d.colorAlpha("o",.08),border:"1px solid "+d.colorAlpha("o",.2),borderLeft:`${f.stripeWidth()}px solid ${d.color("o")}`},children:[(0,t.jsx)("span",{style:{...f.micro()},children:"💡"}),(0,t.jsxs)("span",{className:"italic leading-relaxed",style:{...f.micro(),color:d.colorAlpha("o",.8)},children:["Petunjuk: ",J.hint]})]}),(0,t.jsx)("input",{type:"text",value:w,onChange:e=>j(e.target.value),onKeyDown:e=>{"Enter"===e.key&&K()},disabled:v,placeholder:"Ketik jawaban...","aria-label":"Jawaban isian",className:"w-full px-3 py-2 rounded-lg font-semibold outline-none"+d.iosTextInputTw(),style:{...f.caption(),border:"2px solid "+(v?S?d.color("g"):d.color("r"):d.subtleBorder(.15)),background:v?S?d.colorAlpha("g",.1):d.colorAlpha("r",.1):d.subtleBg(.05),color:v?S?d.color("g"):d.color("r"):f.textColor(),boxShadow:v?S?"0 0 12px "+d.colorAlpha("g",.15):"0 0 12px "+d.colorAlpha("r",.15):"none"}}),v&&(0,t.jsx)("div",{className:"mt-3 p-3 rounded-xl leading-relaxed font-bold",style:{...f.caption(),background:S?d.colorAlpha("g",.1):d.colorAlpha("r",.1),border:"1px solid "+(S?d.colorAlpha("g",.3):d.colorAlpha("r",.3)),color:S?d.color("g"):d.color("r"),animation:"fadeIn 0.3s ease",wordBreak:"break-word",overflowWrap:"break-word"},children:S?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline mr-1",style:{fontSize:"14px"},children:"check_circle"})," Benar!"]}):(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline mr-1",style:{fontSize:"14px"},children:"cancel"})," Salah. Jawaban: ",J.answer]})}),!v&&(0,t.jsx)("button",{onClick:K,disabled:!w.trim(),"aria-label":"Kirim jawaban",className:"mt-3 px-4 py-2 rounded-xl font-extrabold"+d.iosButtonTw(!!w.trim()),style:{...f.caption(),background:w.trim()?"linear-gradient(135deg, "+f.accent()+", "+d.color("o")+")":d.subtleBg(.08),color:w.trim()?d.color("bg"):f.mutedText(.35),boxShadow:w.trim()?"0 4px 16px "+f.accentAlpha(.35):"none",border:"1px solid "+(w.trim()?f.accentAlpha(.5):d.subtleBorder(.1)),cursor:w.trim()?"pointer":"not-allowed"},children:"Jawab"})]})]})})});e.s(["FillBlankGameRenderer",0,d])}]);