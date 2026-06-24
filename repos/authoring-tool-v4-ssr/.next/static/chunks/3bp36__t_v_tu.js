(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,96359,e=>{"use strict";let t=["#f9c12e","#3ecfcf","#34d399","#a78bfa","#ff6b6b","#fb923c","#fbbf24","#22d3ee","#f472b6","#818cf8"],a=["★","●","■","◆","✦","♥","✿","⬟"],r=!1;function o(){if(r||"u"<typeof document)return;r=!0;let e=document.createElement("style");e.id="confetti-enhanced-keyframes",e.textContent=`
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
  `,document.head.appendChild(e)}function n(){let e=Math.random();return e<.35?"rect":e<.55?"circle":e<.8?"star":"diamond"}function i(e){let{x:t,y:r,color:o,shape:n,dx:i,dy:l,rotation:s,drift:c,delay:d,duration:m,shimmer:f,wrapper:h,animationType:p,sx:u=0,sy:x=0}=e,y=document.createElement("div"),g=6+8*Math.random();if("star"===n||"diamond"===n){let e="star"===n?a[Math.floor(2*Math.random())]:a[3];y.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${r}px;
      font-size: ${1.4*g}px;
      color: ${o};
      pointer-events: none;
      will-change: transform, opacity;
      line-height: 1;
      animation: ${"side"===p?"confettiSideBurst":"confettiBurst"} ${m}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${i}px;
      --dy: ${l}px;
      --rot: ${s}deg;
      --drift: ${c}px;
      --sx: ${u}px;
      --sy: ${x}px;
    `,Math.random()>.3&&(y.style.animation+=`, confettiTumble ${1200+800*Math.random()}ms linear ${d}ms infinite`),y.textContent=e}else{let e="circle"===n;y.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${r}px;
      width: ${g}px;
      height: ${e?g:.5*g}px;
      background: ${o};
      border-radius: ${e?"50%":"2px"};
      pointer-events: none;
      will-change: transform, opacity;
      animation: ${"side"===p?"confettiSideBurst":"confettiBurst"} ${m}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${i}px;
      --dy: ${l}px;
      --rot: ${s}deg;
      --drift: ${c}px;
      --sx: ${u}px;
      --sy: ${x}px;
    `}f&&.3>Math.random()&&(y.style.animation+=`, confettiShimmer ${400+300*Math.random()}ms ease-in-out ${d}ms infinite`),h.appendChild(y)}function l(e){let t=document.createElement("div");return t.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 9999; overflow: hidden;
  `,e.appendChild(t),t}function s(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function c(e={}){if(s())return;o();let{count:a=50,duration:r=3e3,container:d=document.body,originX:m=.5,originY:f=.3}=e,h=l(d),p=window.innerWidth*m,u=window.innerHeight*f;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,o=200+400*Math.random(),l=Math.cos(a)*o,s=Math.sin(a)*o-300,c=720*Math.random()-360,d=(Math.random()-.5)*120,m=200*Math.random();i({x:p,y:u,color:e,shape:n(),dx:l,dy:s,rotation:c,drift:d,delay:m,duration:r,shimmer:!0,wrapper:h,animationType:"center"})}setTimeout(()=>{h.remove()},r+500)}function d(e={}){if(s())return;o();let{count:a=70,duration:r=3500,container:c=document.body}=e,m=l(c),f=window.innerWidth,h=window.innerHeight,p=Math.floor(a/2);for(let e=0;e<p;e++){let e=t[Math.floor(Math.random()*t.length)],a=h*(.5+.3*Math.random()),o=f*(.2+.4*Math.random()),l=-(.2*h+Math.random()*h*.3),s=720*Math.random()-360,c=20+60*Math.random(),d=300*Math.random();i({x:0,y:a,color:e,shape:n(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:r,shimmer:!0,wrapper:m,animationType:"side",sx:o,sy:l})}for(let e=0;e<p;e++){let e=t[Math.floor(Math.random()*t.length)],a=h*(.5+.3*Math.random()),o=-(f*(.2+.4*Math.random())),l=-(.2*h+Math.random()*h*.3),s=720*Math.random()-360,c=-(20+60*Math.random()),d=300*Math.random();i({x:f,y:a,color:e,shape:n(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:r,shimmer:!0,wrapper:m,animationType:"side",sx:o,sy:l})}setTimeout(()=>{m.remove()},r+500)}e.s(["fireConfetti",0,c,"fireConfettiCelebration",0,function(e={}){if(s())return;let{count:t=60,duration:a=3500,container:r=document.body}=e;d({count:t+10,duration:a,container:r}),setTimeout(()=>{c({count:t,duration:a-200,container:r,originX:.5,originY:.3})},300),setTimeout(()=>{d({count:Math.floor(.7*t),duration:a-400,container:r})},600)},"fireConfettiMini",0,function(e={}){if(s())return;o();let{count:a=9,duration:r=1200,container:c=document.body,originX:d=.5,originY:m=.5}=e,f=l(c),h=window.innerWidth*d,p=window.innerHeight*m;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,o=80+150*Math.random(),l=Math.cos(a)*o,s=Math.sin(a)*o-100,c=360*Math.random()-180,d=(Math.random()-.5)*40,m=100*Math.random();i({x:h,y:p,color:e,shape:n(),dx:l,dy:s,rotation:c,drift:d,delay:m,duration:r,shimmer:!1,wrapper:f,animationType:"center"})}setTimeout(()=>{f.remove()},r+300)}])},70131,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(61051),o=e.i(52926),n=e.i(27700),i=e.i(5262),l=e.i(96359);let s=a.default.memo(function({block:e,tokens:s,isCompact:c,interactive:d,isEditing:m,pageIndex:f}){let h=s.edu("flashcard-set",c),[p,u]=a.default.useState(0),[x,y]=a.default.useState(!1),[g,b]=a.default.useState(new Set),v=(0,n.useInteractiveStore)(e=>e.replayGeneration);a.default.useEffect(()=>{u(0),y(!1),b(new Set)},[v]);let w=e.cards||[],k=w[p],j=d&&g.size>=w.length&&w.length>0,M=(0,n.useInteractiveStore)(e=>e.reportScore),$=a.default.useRef(!1);a.default.useEffect(()=>{x&&d&&p<w.length&&b(e=>{let t=new Set(e);return t.add(p),t})},[x,p,d,w.length]),a.default.useEffect(()=>{j&&e.id&&!$.current&&($.current=!0,M({elementId:e.id,pageIndex:f??0,score:w.length,maxScore:w.length,completed:!0}),(0,i.playSound)("complete"),(0,l.fireConfetti)({count:40})),j||($.current=!1)},[j,e.id,w.length,M,f]);let S=(0,r.useInlineEditor)({blockId:e.id,fieldKey:`cards.${p}.q`,value:k?.q??"",tag:"div"}),N=(0,r.useInlineEditor)({blockId:e.id,fieldKey:`cards.${p}.a`,value:k?.a??"",tag:"div",multiline:!0});return 0===w.length?null:j?(0,t.jsxs)("div",{className:"text-center p-5 rounded-2xl premium-card-glow",style:{background:h.pageBg(),border:"2px solid "+s.colorAlpha("g",.3),boxShadow:h.shadow("elevated"),animation:"popSuccess 0.5s ease-out"},children:[(0,t.jsx)("div",{className:"text-3xl mb-3",style:{animation:"float 3s ease-in-out infinite"},children:"🧠"}),(0,t.jsx)("div",{className:"font-black text-lg mb-1",style:{fontFamily:s.fontFamily("display"),color:s.color("g")},children:"Semua Kartu Dipelajari!"}),(0,t.jsxs)("div",{className:"mb-4",style:{...h.caption(),color:h.mutedText(.8)},children:["Kamu telah mempelajari semua ",w.length," kartu kilat."]}),(0,t.jsx)("div",{className:"inline-flex items-center gap-2 mb-4",children:w.map((a,r)=>(0,t.jsx)("div",{className:"w-5 h-5 rounded-full flex items-center justify-center",style:{background:s.colorAlpha("g",.2),border:"1px solid "+s.colorAlpha("g",.3),animation:`popSuccess 0.3s ease-out ${.1*r}s both`},children:(0,t.jsx)("span",{className:"material-symbols-outlined",style:{fontSize:"10px"},children:"check_circle"})},`card-dot-${e.id||"fc"}-${r}`))}),(0,t.jsx)("div",{children:(0,t.jsx)(o.MicroInteraction,{tokens:s,accent:"g",effect:"squish",children:(0,t.jsxs)("button",{className:"px-5 py-2 rounded-xl font-extrabold "+s.iosButtonTw(d),onClick:()=>{u(0),y(!1),b(new Set),(0,i.playSound)("click")},style:{...h.caption(),background:"linear-gradient(135deg, "+s.color("g")+", "+s.color("c")+")",color:s.color("bg"),boxShadow:"0 4px 16px "+s.colorAlpha("g",.35)},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"refresh"})," Ulangi Kartu"]})})})]}):(0,t.jsxs)(o.PremiumBlockWrapper,{tokens:s,accent:"p",staggerIndex:0,children:[(0,t.jsx)(o.ReadingProgressIndicator,{progress:1,tokens:s,accent:"p",height:2,position:"top"}),(0,t.jsxs)("div",{className:c?"mt-2":"mt-4",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between mb-3",children:[(0,t.jsx)(o.PremiumBadge,{tokens:s,accent:"y",variant:"glass",children:"🃏 Kartu Kilat"}),(0,t.jsxs)("div",{className:"flex items-center gap-1.5",children:[(0,t.jsxs)("span",{className:"font-bold",style:{...h.micro(),color:h.mutedText(.6)},children:[g.size,"/",w.length]}),x?(0,t.jsx)("span",{className:"material-symbols-outlined",style:{fontSize:"12px"},children:"visibility_off"}):(0,t.jsx)("span",{className:"material-symbols-outlined",style:{fontSize:"12px"},children:"visibility"})]})]}),(0,t.jsxs)("div",{className:"relative",style:{perspective:"1000px"},children:[(0,t.jsxs)("div",{className:`rounded-xl ${d?"cursor-pointer":""}`,style:{minHeight:c?110:130,transformStyle:"preserve-3d",transform:x?"rotateY(180deg)":"rotateY(0deg)",transition:s.iosTransitionStyle("transform","slow","ios").transition},onClick:()=>{if(!d)return;let e=!x;y(e),e?(0,i.playSound)("tap"):(0,i.playSound)("correct")},children:[(0,t.jsxs)("div",{className:"rounded-xl p-4 flex flex-col justify-center",style:{background:h.cardBg(),border:"2px solid "+h.accentAlpha(.3),backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",position:"absolute",inset:0,overflowY:"auto",boxShadow:h.shadow("card")+", 0 0 20px "+h.accentAlpha(.1)},children:[(0,t.jsxs)("div",{className:"flex items-center gap-2 mb-2",children:[(0,t.jsx)("div",{className:"w-6 h-6 rounded-full flex items-center justify-center",style:{background:h.accentAlpha(.2)},children:(0,t.jsx)("span",{style:{fontSize:"12px"},children:"❓"})}),(0,t.jsx)("div",{className:"font-extrabold uppercase tracking-wider",style:{...h.caption(),color:h.accent()},children:"Pertanyaan"})]}),(0,t.jsx)(r.InlineTextEditor,{...S,className:`font-extrabold leading-relaxed ${c?"canvas-truncate-2":""}`,style:{...h.bodyLg(),wordBreak:"break-word",overflowWrap:"break-word"},placeholder:"Ketik pertanyaan..."}),d&&(0,t.jsx)("div",{className:"mt-3 text-center",children:(0,t.jsx)("span",{className:"font-bold px-2 py-1 rounded-full",style:{...h.micro(),background:h.accentAlpha(.1),color:h.accent(),border:`1px solid ${h.accentAlpha(.2)}`},children:"👆 Ketuk untuk membalik"})})]}),(0,t.jsxs)("div",{className:"rounded-xl p-4 flex flex-col justify-center",style:{background:s.colorAlpha("g",.12),border:"2px solid "+s.colorAlpha("g",.35),backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",transform:"rotateY(180deg)",position:"absolute",inset:0,overflowY:"auto",boxShadow:h.shadow("card")+", 0 0 20px "+s.colorAlpha("g",.1)},children:[(0,t.jsxs)("div",{className:"flex items-center gap-2 mb-2",children:[(0,t.jsx)("div",{className:"w-6 h-6 rounded-full flex items-center justify-center",style:{background:s.colorAlpha("g",.2)},children:(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"10px"},children:"check_circle"})}),(0,t.jsx)("div",{className:"font-extrabold uppercase tracking-wider",style:{...h.caption(),color:s.color("g")},children:"Jawaban"})]}),(0,t.jsx)(r.InlineTextEditor,{...N,className:`leading-relaxed ${c?"canvas-truncate-2":""}`,style:{...h.body(),color:s.color("g"),wordBreak:"break-word",overflowWrap:"break-word"},placeholder:"Ketik jawaban..."})]})]}),(0,t.jsx)("div",{style:{minHeight:c?110:130}})]}),(0,t.jsxs)("div",{className:"flex items-center justify-between mt-3",children:[(0,t.jsx)("button",{className:"px-4 py-2.5 rounded-full font-bold "+s.iosButtonTw(d),style:{...h.caption(),background:h.accentAlpha(.15),color:h.accent(),border:`1px solid ${h.accentAlpha(.3)}`},onClick:()=>{u(Math.max(0,p-1)),y(!1),(0,i.playSound)("click")},disabled:0===p,children:"← Prev"}),(0,t.jsx)("div",{className:"flex gap-1.5",children:w.map((a,r)=>(0,t.jsx)("div",{className:"w-2 h-2 rounded-full transition-[background-color,box-shadow]",style:{background:r===p?h.accent():g.has(r)?s.color("g"):s.subtleBg(.12),boxShadow:r===p?"0 0 8px "+h.accentAlpha(.5):"none"}},`nav-dot-${e.id||"fc"}-${r}`))}),(0,t.jsx)("button",{className:"px-4 py-2.5 rounded-full font-bold "+s.iosButtonTw(d),style:{...h.caption(),background:h.accentAlpha(.15),color:h.accent(),border:`1px solid ${h.accentAlpha(.3)}`},onClick:()=>{u(Math.min(w.length-1,p+1)),y(!1),(0,i.playSound)("click")},disabled:p>=w.length-1,children:"Next →"})]})]})]})});e.s(["FlashcardRenderer",0,s])}]);