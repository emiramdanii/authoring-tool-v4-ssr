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
  `,document.head.appendChild(e)}function n(){let e=Math.random();return e<.35?"rect":e<.55?"circle":e<.8?"star":"diamond"}function i(e){let{x:t,y:r,color:o,shape:n,dx:i,dy:l,rotation:s,drift:c,delay:d,duration:m,shimmer:p,wrapper:u,animationType:f,sx:h=0,sy:x=0}=e,y=document.createElement("div"),b=6+8*Math.random();if("star"===n||"diamond"===n){let e="star"===n?a[Math.floor(2*Math.random())]:a[3];y.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${r}px;
      font-size: ${1.4*b}px;
      color: ${o};
      pointer-events: none;
      will-change: transform, opacity;
      line-height: 1;
      animation: ${"side"===f?"confettiSideBurst":"confettiBurst"} ${m}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${i}px;
      --dy: ${l}px;
      --rot: ${s}deg;
      --drift: ${c}px;
      --sx: ${h}px;
      --sy: ${x}px;
    `,Math.random()>.3&&(y.style.animation+=`, confettiTumble ${1200+800*Math.random()}ms linear ${d}ms infinite`),y.textContent=e}else{let e="circle"===n;y.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${r}px;
      width: ${b}px;
      height: ${e?b:.5*b}px;
      background: ${o};
      border-radius: ${e?"50%":"2px"};
      pointer-events: none;
      will-change: transform, opacity;
      animation: ${"side"===f?"confettiSideBurst":"confettiBurst"} ${m}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${i}px;
      --dy: ${l}px;
      --rot: ${s}deg;
      --drift: ${c}px;
      --sx: ${h}px;
      --sy: ${x}px;
    `}p&&.3>Math.random()&&(y.style.animation+=`, confettiShimmer ${400+300*Math.random()}ms ease-in-out ${d}ms infinite`),u.appendChild(y)}function l(e){let t=document.createElement("div");return t.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 9999; overflow: hidden;
  `,e.appendChild(t),t}function s(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function c(e={}){if(s())return;o();let{count:a=50,duration:r=3e3,container:d=document.body,originX:m=.5,originY:p=.3}=e,u=l(d),f=window.innerWidth*m,h=window.innerHeight*p;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,o=200+400*Math.random(),l=Math.cos(a)*o,s=Math.sin(a)*o-300,c=720*Math.random()-360,d=(Math.random()-.5)*120,m=200*Math.random();i({x:f,y:h,color:e,shape:n(),dx:l,dy:s,rotation:c,drift:d,delay:m,duration:r,shimmer:!0,wrapper:u,animationType:"center"})}setTimeout(()=>{u.remove()},r+500)}function d(e={}){if(s())return;o();let{count:a=70,duration:r=3500,container:c=document.body}=e,m=l(c),p=window.innerWidth,u=window.innerHeight,f=Math.floor(a/2);for(let e=0;e<f;e++){let e=t[Math.floor(Math.random()*t.length)],a=u*(.5+.3*Math.random()),o=p*(.2+.4*Math.random()),l=-(.2*u+Math.random()*u*.3),s=720*Math.random()-360,c=20+60*Math.random(),d=300*Math.random();i({x:0,y:a,color:e,shape:n(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:r,shimmer:!0,wrapper:m,animationType:"side",sx:o,sy:l})}for(let e=0;e<f;e++){let e=t[Math.floor(Math.random()*t.length)],a=u*(.5+.3*Math.random()),o=-(p*(.2+.4*Math.random())),l=-(.2*u+Math.random()*u*.3),s=720*Math.random()-360,c=-(20+60*Math.random()),d=300*Math.random();i({x:p,y:a,color:e,shape:n(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:r,shimmer:!0,wrapper:m,animationType:"side",sx:o,sy:l})}setTimeout(()=>{m.remove()},r+500)}e.s(["fireConfetti",0,c,"fireConfettiCelebration",0,function(e={}){if(s())return;let{count:t=60,duration:a=3500,container:r=document.body}=e;d({count:t+10,duration:a,container:r}),setTimeout(()=>{c({count:t,duration:a-200,container:r,originX:.5,originY:.3})},300),setTimeout(()=>{d({count:Math.floor(.7*t),duration:a-400,container:r})},600)},"fireConfettiMini",0,function(e={}){if(s())return;o();let{count:a=9,duration:r=1200,container:c=document.body,originX:d=.5,originY:m=.5}=e,p=l(c),u=window.innerWidth*d,f=window.innerHeight*m;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,o=80+150*Math.random(),l=Math.cos(a)*o,s=Math.sin(a)*o-100,c=360*Math.random()-180,d=(Math.random()-.5)*40,m=100*Math.random();i({x:u,y:f,color:e,shape:n(),dx:l,dy:s,rotation:c,drift:d,delay:m,duration:r,shimmer:!1,wrapper:p,animationType:"center"})}setTimeout(()=>{p.remove()},r+300)}])},60447,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(61051),o=e.i(27700),n=e.i(5262),i=e.i(96359),l=e.i(73829),s=e.i(52926);function c({kolomDef:e,kolomIndex:a,blockId:o,tokens:n,selected:i,kolomItems:l,onKolomClick:s,isCompact:d}){let m=n.edu("sortir-game",d),p=(0,r.useInlineEditor)({blockId:o,fieldKey:`kolom.${a}.label`,value:e.label??"",tag:"span"});return(0,t.jsxs)("div",{onClick:s,role:"button",tabIndex:0,"aria-label":e.label||"Kolom","aria-pressed":i===e.id,onKeyDown:e=>{("Enter"===e.key||" "===e.key)&&(e.preventDefault(),s?.())},className:"rounded-xl p-3.5 min-h-[70px] border-2 transition-[background-color,border-color,box-shadow] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent",style:{borderColor:i?n.colorAlpha(e.color,.5):n.colorAlpha(e.color,.2),background:i?n.colorAlpha(e.color,.08):n.colorAlpha(e.color,.04),boxShadow:i?"0 0 16px "+n.colorAlpha(e.color,.15):m.shadow("card")},children:[(0,t.jsxs)("div",{className:"flex items-center gap-2 mb-2",children:[(0,t.jsx)("div",{className:"w-7 h-7 rounded-full flex items-center justify-center",style:{background:n.colorAlpha(e.color,.2)},children:(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"12px"},children:"folder_open"})}),(0,t.jsx)("div",{className:"font-extrabold uppercase tracking-wider min-w-0",style:{...m.caption(),color:n.color(e.color),overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:(0,t.jsx)(r.InlineTextEditor,{...p,className:"font-extrabold uppercase tracking-wider",style:{color:n.color(e.color),...m.micro()},placeholder:"Ketik label kolom..."})})]}),(0,t.jsx)("div",{className:"flex flex-wrap gap-1.5",children:l.map((r,i)=>(0,t.jsx)("span",{className:`px-2.5 py-1 rounded-full font-bold min-w-0 ${d?"canvas-truncate-1":""}`,style:{...m.micro(),background:n.colorAlpha(e.color,.2),color:n.color(e.color),border:"1px solid "+n.colorAlpha(e.color,.3),wordBreak:"break-word",overflowWrap:"break-word",maxWidth:"100%"},children:r},`sortir-item-${o}-${a}-${i}`))})]})}let d=a.default.memo(function({block:e,tokens:d,interactive:m,isCompact:p,isEditing:u,pageIndex:f}){let h=d.edu("sortir-game",p),x=e.accentColor||"y",y=e.pool||[],b=e.kolom||[],[g,v]=a.default.useState(y.map(e=>({...e,placed:!1}))),[k,w]=a.default.useState(()=>{let e={};return b.forEach(t=>{e[t.id]=[]}),e}),[M,$]=a.default.useState(null),[S,j]=a.default.useState(null),[T,N]=a.default.useState({}),I=(0,o.useInteractiveStore)(e=>e.replayGeneration);a.default.useEffect(()=>{v(y.map(e=>({...e,placed:!1})));let e={};b.forEach(t=>{e[t.id]=[]}),w(e),$(null),j(null),N({})},[I]);let C=(0,o.useInteractiveStore)(e=>e.reportScore);(0,r.useInlineEditor)({blockId:e.id,fieldKey:"title",value:e.title??"",tag:"span"});let B=a.default.useMemo(()=>g.filter(e=>e.placed).length,[g]),A=a.default.useMemo(()=>g.filter(e=>!e.placed),[g]),E=y.length,P=E>0&&B>=E,z=a.default.useRef(!1);if(a.default.useEffect(()=>{if(P&&m&&e.id&&!z.current){z.current=!0;let t=Object.values(T).reduce((e,t)=>e+t,0),a=t>0?Math.round(E/t*100):100;C({elementId:e.id,pageIndex:f??0,score:a,maxScore:100,completed:!0}),t<=E?((0,n.playSound)("complete"),(0,i.fireConfettiCelebration)()):((0,n.playSound)("complete"),(0,i.fireConfetti)({count:50})),(0,l.announceToScreenReader)(`Game selesai! Skor kamu: ${a} dari ${E}`,"assertive")}P||(z.current=!1)},[P,m,e.id,T,E,C,f]),a.default.useEffect(()=>{if(S){let e=setTimeout(()=>j(null),2500);return()=>clearTimeout(e)}},[S]),P){let e=Object.values(T).reduce((e,t)=>e+t,0),a=e<=E;return(0,t.jsx)(s.PremiumBlockWrapper,{tokens:d,accent:x,staggerIndex:0,gradientBorder:!0,children:(0,t.jsxs)("div",{className:"text-center p-5 rounded-2xl",style:{background:h.pageBg(),border:"2px solid "+h.accentAlpha(.3),boxShadow:h.shadow("elevated")},children:[(0,t.jsx)(s.ReadingProgressIndicator,{progress:1,tokens:d,accent:x,height:3,position:"top"}),(0,t.jsx)("div",{className:"text-3xl mb-3",style:{animation:"float 3s ease-in-out infinite"},children:a?"🌟":"🎮"}),(0,t.jsx)("div",{className:"font-black text-lg mb-1",style:{fontFamily:d.fontFamily("display"),color:h.accent()},children:a?"Sempurna!":"Semua Benar!"}),(0,t.jsxs)("div",{className:"mb-2",style:{...h.body(),color:h.mutedText(.8)},children:[E," item berhasil dikelompokkan dengan tepat!"]}),e>E&&(0,t.jsxs)(s.PremiumBadge,{tokens:d,accent:"c",variant:"glass",children:[e," percobaan — akurasi ",Math.round(E/e*100),"%"]}),m&&(0,t.jsx)(s.MicroInteraction,{tokens:d,accent:x,effect:"squish",children:(0,t.jsxs)("button",{className:"mt-3 px-5 py-2 rounded-xl font-extrabold"+d.iosButtonTw(m),onClick:()=>{v(y.map(e=>({...e,placed:!1})));let e={};b.forEach(t=>{e[t.id]=[]}),w(e),$(null),j(null),N({}),z.current=!1,(0,n.playSound)("click")},style:{...h.caption(),background:"linear-gradient(135deg, "+h.accent()+", "+d.color("o")+")",color:d.color("bg"),boxShadow:"0 4px 16px "+h.accentAlpha(.35)},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"refresh"})," Ulangi Game"]})})]})})}return(0,t.jsx)(s.PremiumBlockWrapper,{tokens:d,accent:x,staggerIndex:0,children:(0,t.jsxs)("div",{className:"game-block",...m?{role:"application"}:{},"aria-label":`Sortir: ${B} dari ${E} item ditempatkan`,"aria-describedby":`sortir-instructions-${e.id||"sortir"}`,"data-interactive":!0,children:[(0,t.jsx)(s.ReadingProgressIndicator,{progress:E>0?B/E:0,tokens:d,accent:x,height:3,position:"top"}),(0,t.jsx)("span",{id:`sortir-instructions-${e.id||"sortir"}`,className:"sr-only",children:"Pilih item dari kolam, lalu klik kolom yang tepat untuk mengelompokkannya"}),(0,t.jsx)("div",{className:"sr-only","aria-live":"polite",role:"status",children:M?`Item ${M} dipilih. Pilih kolom yang tepat.`:""}),S&&(0,t.jsxs)("div",{className:"mb-3 p-3 rounded-xl flex items-start gap-2",style:{background:d.colorAlpha("r",.12),border:"1px solid "+d.colorAlpha("r",.35),boxShadow:"0 4px 16px "+d.colorAlpha("r",.15),animation:"fadeIn 0.3s ease-out"},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline flex-shrink-0 mt-0.5",style:{fontSize:"14px"},children:"cancel"}),(0,t.jsx)("div",{className:"leading-relaxed",style:{...h.caption(),color:d.color("r")},children:S.message})]}),(0,t.jsxs)("div",{className:"flex flex-wrap gap-2.5 min-h-[50px] p-4 border-2 border-dashed rounded-xl mb-4 premium-card-glow",style:{borderColor:h.accentAlpha(.25),background:h.accentAlpha(.04)},children:[(0,t.jsxs)("div",{className:"w-full font-extrabold uppercase tracking-wider mb-2",style:{...h.micro(),color:h.accent()},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"inventory_2"})," Pilih Item ",(0,t.jsxs)(s.PremiumBadge,{tokens:d,accent:x,variant:"glass",children:[B,"/",E]})]}),A.map(e=>(0,t.jsx)("button",{onClick:()=>{var t;return t=e.id,void(m&&($(e=>e===t?null:t),(0,n.playSound)("tap")))},"aria-selected":M===e.id,className:`px-3.5 py-2 rounded-full font-extrabold ${d.iosGameButtonTw(m)} min-w-0 ${p?"canvas-truncate-1":""}`,style:{background:M===e.id?h.accentAlpha(.2):d.subtleBg(.07),border:"2px solid "+(M===e.id?h.accent():d.subtleBorder(.15)),boxShadow:M===e.id?"0 0 16px "+h.accentAlpha(.35):h.shadow("card"),...h.caption(),animation:M===e.id?"pulse 1.5s ease-in-out infinite":"none",wordBreak:"break-word",overflowWrap:"break-word"},children:e.text},e.id))]}),(0,t.jsx)("div",{className:"grid grid-cols-2 gap-3",children:b.map((a,r)=>(0,t.jsx)(c,{kolomDef:a,kolomIndex:r,blockId:e.id,tokens:d,selected:M,kolomItems:k[a.id]||[],onKolomClick:()=>(e=>{if(!m||!M)return;let t=g.find(e=>e.id===M);if(t){if(t.category===e)v(e=>e.map(e=>e.id===M?{...e,placed:!0}:e)),w(a=>({...a,[e]:[...a[e]||[],t.text]})),(0,n.playSound)("correct"),(0,l.announceToScreenReader)("Item benar!","assertive");else{let a=b.find(e=>e.id===t.category),r=b.find(t=>t.id===e);a?.label;let o=r?.label??e;j({itemId:t.id,kolomId:e,message:`"${t.text}" bukan termasuk ${o}. Coba pindahkan ke kolom yang tepat!`}),N(e=>({...e,[t.id]:(e[t.id]||0)+1})),(0,n.playSound)("incorrect"),(0,l.announceToScreenReader)("Kolom salah","assertive")}$(null)}})(a.id),isCompact:p},a.id))})]})})});e.s(["SortirGameRenderer",0,d])}]);