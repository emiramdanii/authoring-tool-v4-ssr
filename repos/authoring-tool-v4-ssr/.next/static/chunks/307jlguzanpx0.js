(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,25351,e=>{"use strict";var t=e.i(71645);e.s(["useBlockCompression",0,function(e){let{compression:a,totalItems:o,defaultVisibleCount:r}=e,[l,s]=(0,t.useState)(!1),n=(0,t.useMemo)(()=>{if(!a||!a.isCompressed)return o;switch(a.strategy){case"accordion":return Math.min(2,o);case"reveal-set":return a.params.visibleItemCount??Math.ceil(.4*o);case"collapsible":return Math.max(1,Math.ceil(.4*o));case"step-reveal":return 1;default:return Math.ceil(.5*o)}},[a,o]),c=l?o:a?.isCompressed?n:r??o,i=o-c,d=(0,t.useCallback)(()=>{s(!0)},[]),m=(0,t.useCallback)(()=>{s(!0)},[]);return{visibleCount:c,hiddenCount:i,hasMore:i>0,isCompressed:a?.isCompressed??!1,strategy:a?.strategy??null,showMore:d,showAll:m,isExpanded:l,decision:a??null}}])},96359,e=>{"use strict";let t=["#f9c12e","#3ecfcf","#34d399","#a78bfa","#ff6b6b","#fb923c","#fbbf24","#22d3ee","#f472b6","#818cf8"],a=["★","●","■","◆","✦","♥","✿","⬟"],o=!1;function r(){if(o||"u"<typeof document)return;o=!0;let e=document.createElement("style");e.id="confetti-enhanced-keyframes",e.textContent=`
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
  `,document.head.appendChild(e)}function l(){let e=Math.random();return e<.35?"rect":e<.55?"circle":e<.8?"star":"diamond"}function s(e){let{x:t,y:o,color:r,shape:l,dx:s,dy:n,rotation:c,drift:i,delay:d,duration:m,shimmer:h,wrapper:p,animationType:x,sx:u=0,sy:f=0}=e,y=document.createElement("div"),b=6+8*Math.random();if("star"===l||"diamond"===l){let e="star"===l?a[Math.floor(2*Math.random())]:a[3];y.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${o}px;
      font-size: ${1.4*b}px;
      color: ${r};
      pointer-events: none;
      will-change: transform, opacity;
      line-height: 1;
      animation: ${"side"===x?"confettiSideBurst":"confettiBurst"} ${m}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${s}px;
      --dy: ${n}px;
      --rot: ${c}deg;
      --drift: ${i}px;
      --sx: ${u}px;
      --sy: ${f}px;
    `,Math.random()>.3&&(y.style.animation+=`, confettiTumble ${1200+800*Math.random()}ms linear ${d}ms infinite`),y.textContent=e}else{let e="circle"===l;y.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${o}px;
      width: ${b}px;
      height: ${e?b:.5*b}px;
      background: ${r};
      border-radius: ${e?"50%":"2px"};
      pointer-events: none;
      will-change: transform, opacity;
      animation: ${"side"===x?"confettiSideBurst":"confettiBurst"} ${m}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${s}px;
      --dy: ${n}px;
      --rot: ${c}deg;
      --drift: ${i}px;
      --sx: ${u}px;
      --sy: ${f}px;
    `}h&&.3>Math.random()&&(y.style.animation+=`, confettiShimmer ${400+300*Math.random()}ms ease-in-out ${d}ms infinite`),p.appendChild(y)}function n(e){let t=document.createElement("div");return t.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 9999; overflow: hidden;
  `,e.appendChild(t),t}function c(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function i(e={}){if(c())return;r();let{count:a=50,duration:o=3e3,container:d=document.body,originX:m=.5,originY:h=.3}=e,p=n(d),x=window.innerWidth*m,u=window.innerHeight*h;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,r=200+400*Math.random(),n=Math.cos(a)*r,c=Math.sin(a)*r-300,i=720*Math.random()-360,d=(Math.random()-.5)*120,m=200*Math.random();s({x:x,y:u,color:e,shape:l(),dx:n,dy:c,rotation:i,drift:d,delay:m,duration:o,shimmer:!0,wrapper:p,animationType:"center"})}setTimeout(()=>{p.remove()},o+500)}function d(e={}){if(c())return;r();let{count:a=70,duration:o=3500,container:i=document.body}=e,m=n(i),h=window.innerWidth,p=window.innerHeight,x=Math.floor(a/2);for(let e=0;e<x;e++){let e=t[Math.floor(Math.random()*t.length)],a=p*(.5+.3*Math.random()),r=h*(.2+.4*Math.random()),n=-(.2*p+Math.random()*p*.3),c=720*Math.random()-360,i=20+60*Math.random(),d=300*Math.random();s({x:0,y:a,color:e,shape:l(),dx:0,dy:0,rotation:c,drift:i,delay:d,duration:o,shimmer:!0,wrapper:m,animationType:"side",sx:r,sy:n})}for(let e=0;e<x;e++){let e=t[Math.floor(Math.random()*t.length)],a=p*(.5+.3*Math.random()),r=-(h*(.2+.4*Math.random())),n=-(.2*p+Math.random()*p*.3),c=720*Math.random()-360,i=-(20+60*Math.random()),d=300*Math.random();s({x:h,y:a,color:e,shape:l(),dx:0,dy:0,rotation:c,drift:i,delay:d,duration:o,shimmer:!0,wrapper:m,animationType:"side",sx:r,sy:n})}setTimeout(()=>{m.remove()},o+500)}e.s(["fireConfetti",0,i,"fireConfettiCelebration",0,function(e={}){if(c())return;let{count:t=60,duration:a=3500,container:o=document.body}=e;d({count:t+10,duration:a,container:o}),setTimeout(()=>{i({count:t,duration:a-200,container:o,originX:.5,originY:.3})},300),setTimeout(()=>{d({count:Math.floor(.7*t),duration:a-400,container:o})},600)},"fireConfettiMini",0,function(e={}){if(c())return;r();let{count:a=9,duration:o=1200,container:i=document.body,originX:d=.5,originY:m=.5}=e,h=n(i),p=window.innerWidth*d,x=window.innerHeight*m;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,r=80+150*Math.random(),n=Math.cos(a)*r,c=Math.sin(a)*r-100,i=360*Math.random()-180,d=(Math.random()-.5)*40,m=100*Math.random();s({x:p,y:x,color:e,shape:l(),dx:n,dy:c,rotation:i,drift:d,delay:m,duration:o,shimmer:!1,wrapper:h,animationType:"center"})}setTimeout(()=>{h.remove()},o+300)}])},37748,e=>{"use strict";var t=e.i(43476),a=e.i(71645),o=e.i(75254);let r=(0,o.default)("party-popper",[["path",{d:"M5.8 11.3 2 22l10.7-3.79",key:"gwxi1d"}],["path",{d:"M4 3h.01",key:"1vcuye"}],["path",{d:"M22 8h.01",key:"1mrtc2"}],["path",{d:"M15 2h.01",key:"1cjtqr"}],["path",{d:"M22 20h.01",key:"1mrys2"}],["path",{d:"m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10",key:"hbicv8"}],["path",{d:"m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17",key:"1i94pl"}],["path",{d:"m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7",key:"1cofks"}],["path",{d:"M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z",key:"4kbmks"}]]),l=(0,o.default)("bell",[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]]);var s=e.i(61051),n=e.i(8531),c=e.i(52926),i=e.i(27700),d=e.i(5262),m=e.i(96359),h=e.i(25351);let p=a.default.memo(function({block:e,tokens:o,interactive:p,isCompact:x,isEditing:u,pageIndex:f,compression:y}){let b=o.edu("skenario",x),g=(0,s.useInlineEditor)({blockId:e.id,fieldKey:"title",value:e.title??"",tag:"span"}),[v,k]=a.default.useState(0),[j,M]=a.default.useState([]),[N,w]=a.default.useState(null),[$,S]=a.default.useState(!1),T=a.default.useRef([]),B=(0,i.useInteractiveStore)(e=>e.replayGeneration);a.default.useEffect(()=>{k(0),M([]),w(null),S(!1)},[B]);let C=e.chapters||[],{isCompressed:A}=(0,h.useBlockCompression)({compression:y,totalItems:C.length}),R=C[v],z=v>=C.length,I=(0,i.useInteractiveStore)(e=>e.reportScore);a.default.useEffect(()=>()=>{T.current.forEach(e=>clearTimeout(e))},[]);let P=a.default.useRef(!1);a.default.useEffect(()=>{if(z&&p&&e.id&&!P.current){P.current=!0;let t=j.reduce((e,t)=>e+t.pts,0),a=20*C.length;I({elementId:e.id,pageIndex:f??0,score:t,maxScore:a,completed:!0}),(0,d.playSound)("complete"),(0,m.fireConfetti)({count:60})}z||(P.current=!1)},[z,p,e.id,j,C.length,I,f]);let W=a.default.useMemo(()=>j.reduce((e,t)=>e+t.pts,0),[j]),E=20*C.length,F=o.color("g");o.color("r");let Y=o.color("y");return(0,t.jsxs)(c.PremiumBlockWrapper,{tokens:o,accent:"o",staggerIndex:0,children:[(0,t.jsx)(c.ReadingProgressIndicator,{progress:1,tokens:o,accent:"o",height:2,position:"top"}),(0,t.jsxs)("div",{className:"mt-3 rounded-2xl overflow-hidden border-2 premium-card-glow",style:{background:b.sceneBg(),borderColor:o.colorAlpha("c",.3),boxShadow:b.shadow("elevated")},children:[(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsx)("div",{className:"absolute top-0 left-0 right-0 h-0.5",style:{background:"linear-gradient(90deg, "+o.color("c")+", "+Y+", "+o.color("c")+")"}}),(0,t.jsxs)("div",{className:"flex items-center justify-between p-3 border-b-2",style:{background:"linear-gradient(90deg, "+b.pageBg()+", "+b.pageBg2()+")",borderColor:o.colorAlpha("c",.2)},children:[(0,t.jsxs)("span",{className:"font-black",style:{...b.caption(),fontWeight:700,color:b.accent(),fontFamily:o.fontFamily("display")},children:["🎭 ",(0,t.jsx)(s.InlineTextEditor,{...g,style:{color:b.accent(),fontFamily:o.fontFamily("display")}})]}),(0,t.jsxs)("div",{className:"flex gap-2",children:[(0,t.jsxs)(c.PremiumBadge,{tokens:o,accent:"y",variant:"solid",children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"star"})," ",W]}),(0,t.jsxs)("span",{className:"px-2.5 py-1 rounded-full font-extrabold",style:{...b.micro(),background:b.accentAlpha(.15),color:b.accent(),border:`1px solid ${b.accentAlpha(.3)}`},children:["Babak ",Math.min(v+1,C.length),"/",C.length]})]})]})]}),z&&(0,t.jsxs)("div",{className:"p-6 text-center",children:[(0,t.jsx)("div",{className:"text-4xl mb-3",style:{animation:"float 3s ease-in-out infinite"},children:(0,t.jsx)(r,{size:32,className:"inline"})}),(0,t.jsx)("div",{className:"font-black text-lg mb-2",style:{fontFamily:o.fontFamily("display"),color:Y},children:"Skenario Selesai!"}),(0,t.jsxs)("div",{className:"mb-4",style:{...b.body(),color:b.mutedText(.85)},children:["Kamu telah menyelesaikan semua ",C.length," babak skenario."]}),(0,t.jsxs)("div",{className:"inline-flex items-center gap-3",children:[(0,t.jsxs)("div",{className:"px-4 py-2 rounded-xl",style:{background:o.colorAlpha("g",.12),border:"1px solid "+o.colorAlpha("g",.3)},children:[(0,t.jsx)("div",{className:"font-extrabold",style:{color:F,...b.caption(),fontWeight:600},children:"Skor"}),(0,t.jsxs)("div",{className:"font-black text-lg",style:{color:F},children:[W,"/",E]})]}),(0,t.jsxs)("div",{className:"px-4 py-2 rounded-xl",style:{background:o.colorAlpha("y",.12),border:"1px solid "+o.colorAlpha("y",.3)},children:[(0,t.jsx)("div",{className:"font-extrabold",style:{color:b.accent(),...b.caption(),fontWeight:600},children:"Pilihan Baik"}),(0,t.jsxs)("div",{className:"font-black text-lg",style:{color:Y},children:[j.filter(e=>e.good).length,"/",C.length]})]})]}),p&&(0,t.jsx)(c.MicroInteraction,{tokens:o,accent:"y",effect:"squish",children:(0,t.jsxs)("button",{className:`mt-4 px-5 py-2 rounded-xl font-extrabold ${o.iosButtonTw()}`,onClick:()=>{k(0),M([]),P.current=!1,(0,d.playSound)("click")},style:{...b.micro(),background:`linear-gradient(135deg, ${b.accent()}, ${o.color("o")})`,color:o.color("bg"),boxShadow:`0 4px 16px ${b.accentAlpha(.35)}`},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"refresh"})," Ulangi Skenario"]})})]}),R&&!z&&!$&&(0,t.jsxs)("div",{className:"p-4",children:[!A&&R.setup&&R.setup.length>0&&(0,t.jsx)("div",{className:"mb-4 space-y-2",children:R.setup.map((e,a)=>{let r="NARRATOR"===e.speaker.toUpperCase()||"NARATOR"===e.speaker.toUpperCase();return(0,t.jsxs)("div",{className:`flex gap-2 ${r?"italic":""}`,children:[(0,t.jsx)("span",{className:"font-bold flex-shrink-0 mt-0.5",style:{...b.caption(),color:r?o.textSubtle(.65):o.color("r")},children:r?(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"menu_book"}):e.speaker?`${e.speaker}:`:""}),(0,t.jsx)(n.RichText,{content:e.text??"",className:`leading-relaxed ${x?"canvas-truncate-2":""}`,style:{...b.body(),color:r?o.textSubtle(.8):o.textSecondary(.85),wordBreak:"break-word",overflowWrap:"break-word"}})]},`skenario-setup-${e.speaker?.slice(0,6)}-${a}`)})}),R.choicePrompt&&(0,t.jsxs)("div",{className:"italic mb-3 p-3 rounded-lg",style:{...b.body(),color:b.mutedText(.9),background:b.accentAlpha(.08),border:`1px solid ${b.accentAlpha(.2)}`,wordBreak:"break-word",overflowWrap:"break-word"},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"chat"})," ",(0,t.jsx)(n.RichText,{content:R.choicePrompt,className:x?"canvas-truncate-2":""})]}),(0,t.jsx)("div",{className:"space-y-2.5",children:R.choices.map((e,a)=>p?(0,t.jsxs)("button",{onClick:()=>(e=>{if(!R||!p)return;let t=R.choices[e];M(a=>[...a,{chapterIdx:v,choiceIdx:e,good:t.good,pts:t.pts}]),w({choiceIdx:e,choice:t}),S(!0),t.good?(0,d.playSound)("correct"):(0,d.playSound)("incorrect");let a=setTimeout(()=>{S(!1),w(null),k(null!=t.nextChapter?t.nextChapter:v+1),(0,d.playSound)("click")},3e3);T.current.push(a)})(a),className:`w-full flex items-start gap-2.5 px-4 py-3 rounded-xl text-left ${o.iosQuizOptionTw(p)} hover:scale-[1.02] active:scale-[0.98]`,style:{background:o.subtleBg(.05),border:`1px solid ${o.subtleBorder(.12)}`,boxShadow:b.shadow("card")},children:[(0,t.jsx)("span",{className:"text-lg mt-0.5",children:e.icon}),(0,t.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,t.jsx)(n.RichText,{content:e.label??"",className:`font-bold ${x?"canvas-truncate-1":""}`,style:{...b.body(),color:b.textColor(),wordBreak:"break-word"}}),e.detail&&(0,t.jsx)(n.RichText,{content:e.detail,className:`mt-1 ${x?"canvas-truncate-1":"line-clamp-2"}`,style:{...b.body(),color:o.textSubtle(.8),wordBreak:"break-word"}})]})]},`skenario-choice-${e.label?.slice(0,8)}-${a}`):(0,t.jsxs)("div",{className:"w-full flex items-start gap-2.5 px-4 py-3 rounded-xl text-left",style:{background:o.subtleBg(.05),border:`1px solid ${o.subtleBorder(.12)}`,boxShadow:b.shadow("card")},children:[(0,t.jsx)("span",{className:"text-lg mt-0.5",children:e.icon}),(0,t.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,t.jsx)(n.RichText,{content:e.label??"",className:`font-bold ${x?"canvas-truncate-1":""}`,style:{...b.body(),color:b.textColor(),wordBreak:"break-word"}}),e.detail&&(0,t.jsx)(n.RichText,{content:e.detail,className:`mt-1 ${x?"canvas-truncate-1":"line-clamp-2"}`,style:{...b.body(),color:o.textSubtle(.8),wordBreak:"break-word"}})]})]},`skenario-choice-ro-${e.label?.slice(0,8)}-${a}`))})]}),$&&N&&R&&(0,t.jsxs)("div",{className:"p-4 space-y-2.5",children:[(0,t.jsxs)("div",{className:"p-3 rounded-xl text-center",style:{background:N.choice.good?o.colorAlpha("g",.12):o.colorAlpha("r",.12),border:"2px solid "+(N.choice.good?o.colorAlpha("g",.4):o.colorAlpha("r",.4)),boxShadow:N.choice.good?"0 0 16px "+o.colorAlpha("g",.15):"0 0 16px "+o.colorAlpha("r",.15)},children:[(0,t.jsx)("div",{className:"text-lg mb-1",children:N.choice.resultTitle||(N.choice.good?(0,t.jsx)("span",{className:"material-symbols-outlined inline text-emerald-400",style:{fontSize:"20px"},children:"check_circle"}):(0,t.jsx)("span",{className:"material-symbols-outlined inline text-red-400",style:{fontSize:"20px"},children:"cancel"}))}),(0,t.jsx)("div",{className:"font-bold",style:{...b.body(),color:N.choice.good?o.color("g"):o.color("r")},children:N.choice.good?N.choice.feedbackGood||"Pilihan tepat!":N.choice.feedbackBad||"Coba lagi!"})]}),N.choice.resultBody&&(0,t.jsx)("div",{className:"p-3 rounded-xl",style:{background:o.subtleBg(.05),border:"1px solid "+o.subtleBorder(.1)},children:(0,t.jsx)(n.RichText,{content:N.choice.resultBody??"",className:`leading-relaxed ${x?"canvas-truncate-2":""}`,style:{...b.body(),color:o.textSecondary(.85)}})}),N.choice.norma&&(0,t.jsxs)("div",{className:"p-3 rounded-xl",style:{background:o.colorAlpha("y",.1),border:"1px solid "+o.colorAlpha("y",.25)},children:[(0,t.jsxs)("div",{className:"font-bold mb-1",style:{...b.caption(),fontWeight:600,color:b.accent()},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"scroll"})," Kaitan Norma"]}),(0,t.jsx)(n.RichText,{content:N.choice.norma??"",className:`leading-relaxed ${x?"canvas-truncate-2":""}`,style:{...b.body(),color:o.textSecondary(.85)}})]}),N.choice.consequences&&N.choice.consequences.length>0&&(0,t.jsxs)("div",{className:"p-3 rounded-xl",style:{background:o.subtleBg(.05),border:"1px solid "+o.subtleBorder(.1)},children:[(0,t.jsxs)("div",{className:"font-bold mb-1.5",style:{...b.caption(),fontWeight:600,color:o.textSubtle(.7)},children:[(0,t.jsx)(l,{size:14,className:"inline"})," Dampak"]}),N.choice.consequences.map((e,a)=>(0,t.jsxs)("div",{className:`flex items-start gap-1.5 leading-relaxed mb-1 ${x?"canvas-truncate-1":""}`,style:{...b.body(),color:b.mutedText(.85)},children:[(0,t.jsx)("span",{className:"mt-px",children:e.icon})," ",(0,t.jsx)(n.RichText,{content:e.text??""})]},`skenario-con-${e.text?.slice(0,6)}-${a}`))]}),N.choice.pts>0&&(0,t.jsx)("div",{className:"text-center",children:(0,t.jsxs)("span",{className:"font-bold px-3 py-1 rounded-full",style:{background:o.colorAlpha("g",.15),color:F,boxShadow:"0 0 8px "+o.colorAlpha("g",.2)},children:["+",N.choice.pts," poin"]})})]}),C.length>0&&(0,t.jsx)("div",{className:"flex gap-1 p-3 border-t",style:{background:b.pageBg(),borderColor:o.colorAlpha("c",.15)},children:C.map((a,r)=>(0,t.jsx)("div",{className:"flex-1 h-1.5 rounded-full transition-[background-color,box-shadow]",style:{background:r<v?F:r===v?Y:o.colorAlpha("muted",.2),boxShadow:r===v?"0 0 8px "+Y:r<v?"0 0 4px "+o.colorAlpha("g",.3):"none"}},`skenario-prog-${e.id||"sk"}-${r}`))})]})]})});e.s(["SkenarioRenderer",0,p],37748)}]);