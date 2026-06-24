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
  `,document.head.appendChild(e)}function n(){let e=Math.random();return e<.35?"rect":e<.55?"circle":e<.8?"star":"diamond"}function i(e){let{x:t,y:o,color:r,shape:n,dx:i,dy:l,rotation:c,drift:s,delay:d,duration:m,shimmer:h,wrapper:f,animationType:p,sx:u=0,sy:x=0}=e,y=document.createElement("div"),g=6+8*Math.random();if("star"===n||"diamond"===n){let e="star"===n?a[Math.floor(2*Math.random())]:a[3];y.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${o}px;
      font-size: ${1.4*g}px;
      color: ${r};
      pointer-events: none;
      will-change: transform, opacity;
      line-height: 1;
      animation: ${"side"===p?"confettiSideBurst":"confettiBurst"} ${m}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${i}px;
      --dy: ${l}px;
      --rot: ${c}deg;
      --drift: ${s}px;
      --sx: ${u}px;
      --sy: ${x}px;
    `,Math.random()>.3&&(y.style.animation+=`, confettiTumble ${1200+800*Math.random()}ms linear ${d}ms infinite`),y.textContent=e}else{let e="circle"===n;y.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${o}px;
      width: ${g}px;
      height: ${e?g:.5*g}px;
      background: ${r};
      border-radius: ${e?"50%":"2px"};
      pointer-events: none;
      will-change: transform, opacity;
      animation: ${"side"===p?"confettiSideBurst":"confettiBurst"} ${m}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${i}px;
      --dy: ${l}px;
      --rot: ${c}deg;
      --drift: ${s}px;
      --sx: ${u}px;
      --sy: ${x}px;
    `}h&&.3>Math.random()&&(y.style.animation+=`, confettiShimmer ${400+300*Math.random()}ms ease-in-out ${d}ms infinite`),f.appendChild(y)}function l(e){let t=document.createElement("div");return t.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 9999; overflow: hidden;
  `,e.appendChild(t),t}function c(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function s(e={}){if(c())return;r();let{count:a=50,duration:o=3e3,container:d=document.body,originX:m=.5,originY:h=.3}=e,f=l(d),p=window.innerWidth*m,u=window.innerHeight*h;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,r=200+400*Math.random(),l=Math.cos(a)*r,c=Math.sin(a)*r-300,s=720*Math.random()-360,d=(Math.random()-.5)*120,m=200*Math.random();i({x:p,y:u,color:e,shape:n(),dx:l,dy:c,rotation:s,drift:d,delay:m,duration:o,shimmer:!0,wrapper:f,animationType:"center"})}setTimeout(()=>{f.remove()},o+500)}function d(e={}){if(c())return;r();let{count:a=70,duration:o=3500,container:s=document.body}=e,m=l(s),h=window.innerWidth,f=window.innerHeight,p=Math.floor(a/2);for(let e=0;e<p;e++){let e=t[Math.floor(Math.random()*t.length)],a=f*(.5+.3*Math.random()),r=h*(.2+.4*Math.random()),l=-(.2*f+Math.random()*f*.3),c=720*Math.random()-360,s=20+60*Math.random(),d=300*Math.random();i({x:0,y:a,color:e,shape:n(),dx:0,dy:0,rotation:c,drift:s,delay:d,duration:o,shimmer:!0,wrapper:m,animationType:"side",sx:r,sy:l})}for(let e=0;e<p;e++){let e=t[Math.floor(Math.random()*t.length)],a=f*(.5+.3*Math.random()),r=-(h*(.2+.4*Math.random())),l=-(.2*f+Math.random()*f*.3),c=720*Math.random()-360,s=-(20+60*Math.random()),d=300*Math.random();i({x:h,y:a,color:e,shape:n(),dx:0,dy:0,rotation:c,drift:s,delay:d,duration:o,shimmer:!0,wrapper:m,animationType:"side",sx:r,sy:l})}setTimeout(()=>{m.remove()},o+500)}e.s(["fireConfetti",0,s,"fireConfettiCelebration",0,function(e={}){if(c())return;let{count:t=60,duration:a=3500,container:o=document.body}=e;d({count:t+10,duration:a,container:o}),setTimeout(()=>{s({count:t,duration:a-200,container:o,originX:.5,originY:.3})},300),setTimeout(()=>{d({count:Math.floor(.7*t),duration:a-400,container:o})},600)},"fireConfettiMini",0,function(e={}){if(c())return;r();let{count:a=9,duration:o=1200,container:s=document.body,originX:d=.5,originY:m=.5}=e,h=l(s),f=window.innerWidth*d,p=window.innerHeight*m;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,r=80+150*Math.random(),l=Math.cos(a)*r,c=Math.sin(a)*r-100,s=360*Math.random()-180,d=(Math.random()-.5)*40,m=100*Math.random();i({x:f,y:p,color:e,shape:n(),dx:l,dy:c,rotation:s,drift:d,delay:m,duration:o,shimmer:!1,wrapper:h,animationType:"center"})}setTimeout(()=>{h.remove()},o+300)}])},68554,e=>{"use strict";var t=e.i(43476),a=e.i(71645);let o=(0,e.i(75254).default)("gift",[["rect",{x:"3",y:"8",width:"18",height:"4",rx:"1",key:"bkv52"}],["path",{d:"M12 8v13",key:"1c76mn"}],["path",{d:"M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7",key:"6wjy6b"}],["path",{d:"M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",key:"1ihvrl"}]]);var r=e.i(52926),n=e.i(8531),i=e.i(5262),l=e.i(96359);let c=a.default.memo(function({block:e,tokens:c,isCompact:s,interactive:d,isEditing:m,compression:h}){let f=e.accentColor||"p",p=c.color(f),u=c.edu("reveal",s),[x,y]=(0,a.useState)(!1),[g,b]=(0,a.useState)(!1),v=(0,a.useCallback)(()=>{x||(y(!0),g?(0,i.playSound)("click"):(b(!0),(0,l.fireConfetti)({count:40,duration:2500}),(0,i.playSound)("ding")))},[x,g]),k=(0,a.useCallback)(()=>{y(!1),(0,i.playSound)("click")},[]),M=!d||x;return(0,t.jsxs)(r.PremiumBlockWrapper,{tokens:c,accent:f,staggerIndex:0,gradientBorder:!0,children:[(0,t.jsx)(r.ReadingProgressIndicator,{progress:+!!M,tokens:c,accent:f,height:2,position:"top"}),(0,t.jsxs)("div",{className:"rounded-xl overflow-hidden premium-card-glow",style:{background:c.colorAlpha(f,.06),border:`1px solid ${c.colorAlpha(f,.2)}`,boxShadow:u.shadow("card")},children:[(0,t.jsx)("div",{className:"h-1",style:{background:`linear-gradient(90deg, ${p}, ${c.colorAlpha(f,.4)})`}}),(0,t.jsxs)("div",{style:{...u.sectionPadding()},children:[(0,t.jsxs)("div",{className:"flex items-center gap-2 mb-3",children:[(0,t.jsx)(r.MicroInteraction,{tokens:c,accent:f,effect:"glow",children:(0,t.jsx)("div",{className:"w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",style:{background:c.colorAlpha(f,.2)},children:(0,t.jsx)(o,{size:10,style:{color:p}})})}),(0,t.jsx)(r.PremiumBadge,{tokens:c,accent:f,variant:"glass",children:"Konten Tersembunyi"})]}),e.title&&(0,t.jsx)("div",{className:"font-extrabold mb-3",style:{...u.heading(),fontFamily:c.fontFamily("display"),color:u.textColor(),wordBreak:"break-word",overflowWrap:"break-word"},children:(0,t.jsx)(n.RichText,{content:e.title})}),!M&&(0,t.jsx)(r.MicroInteraction,{tokens:c,accent:f,effect:"bounce",children:(0,t.jsxs)("button",{type:"button",onClick:v,className:`w-full text-center rounded-lg cursor-pointer ${c.iosButtonTw()}  hover:scale-[1.01]`,style:{...u.componentPadding(),background:`linear-gradient(135deg, ${c.colorAlpha(f,.12)}, ${c.colorAlpha(f,.04)})`,border:`2px dashed ${c.colorAlpha(f,.4)}`,outline:"none"},"aria-label":"Ketuk untuk membuka konten tersembunyi",children:[(0,t.jsx)("div",{className:"mx-auto mb-3 flex items-center justify-center",style:{width:s?"48px":"60px",height:s?"48px":"60px",borderRadius:"50%",background:`linear-gradient(135deg, ${p}, ${c.colorAlpha(f,.6)})`,boxShadow:`0 6px 20px ${c.colorAlpha(f,.4)}`,fontSize:s?"24px":"30px",animation:"glowPulse 2s ease-in-out infinite","--glow-color":c.colorAlpha(f,.2),"--glow-color-strong":c.colorAlpha(f,.5)},children:e.coverIcon||"🎁"}),(0,t.jsx)("div",{className:"font-bold",style:{...u.bodyLg(),fontWeight:700,color:p,fontFamily:c.fontFamily("display")},children:e.coverText||"Ketuk untuk membuka!"}),(0,t.jsx)("div",{className:"mt-2",style:{...u.caption(),color:u.mutedText(.5),animation:"float 2.5s ease-in-out infinite"},children:"👆 Ketuk untuk membuka"})]})}),M&&(0,t.jsxs)("div",{style:{...u.componentPadding(),borderRadius:u.radius("lg"),background:u.cardBg(),border:`1px solid ${c.colorAlpha(f,.25)}`,borderLeft:`${u.stripeWidth()}px solid ${p}`,overflow:"hidden"},children:[(0,t.jsxs)("div",{className:"flex items-center gap-2 mb-2",children:[(0,t.jsx)("div",{className:"flex-shrink-0 flex items-center justify-center",style:{width:s?"28px":"34px",height:s?"28px":"34px",borderRadius:"50%",background:`linear-gradient(135deg, ${p}, ${c.colorAlpha(f,.7)})`,boxShadow:`0 4px 12px ${c.colorAlpha(f,.3)}`,fontSize:s?"14px":"17px",animation:g&&x?"popIn 0.4s ease-out":void 0},children:e.revealIcon||"💡"}),(0,t.jsx)("span",{className:"font-extrabold uppercase tracking-wider",style:{...u.micro(),color:p,letterSpacing:"0.06em"},children:"Terbuka!"})]}),(0,t.jsx)("div",{className:s?"canvas-truncate-2":"",style:{...u.body(),color:u.textColor(),wordBreak:"break-word",overflowWrap:"break-word"},children:(0,t.jsx)(n.RichText,{content:e.revealContent||""})}),d&&(0,t.jsx)(r.MicroInteraction,{tokens:c,accent:f,effect:"squish",children:(0,t.jsxs)("button",{type:"button",onClick:k,className:`mt-3 px-4 py-1.5 rounded-lg font-bold ${c.iosExpandTw()}  hover:scale-[1.02]`,style:{...u.caption(),background:c.colorAlpha(f,.1),color:p,border:`1px solid ${c.colorAlpha(f,.3)}`,cursor:"pointer"},"aria-label":"Sembunyikan konten",children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline mr-1",style:{fontSize:"11px"},children:"visibility_off"})," Sembunyikan"]})})]})]})]})]})});e.s(["RevealRenderer",0,c],68554)}]);