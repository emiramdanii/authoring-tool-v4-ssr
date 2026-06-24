(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,8531,e=>{"use strict";var t=e.i(43476),a=e.i(71645);let r=new Set(["strong","em","b","i","u","br","span","sub","sup","mark","small"]),o=/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi;function n(e){if(!e)return"";let t=e.replace(o,"");return(t=t.replace(/<!--[\s\S]*?-->/g,"")).replace(/<\/?[a-zA-Z][^>]*>?|<![^>]*>?|<|[^<]+/g,e=>{if("<"===e)return"<";if(!e.startsWith("<"))return e;if(e.startsWith("<!"))return"";let t=e.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);if(!t)return"";let a=t[1].toLowerCase();return r.has(a)?e.startsWith("</")?`</${a}>`:"br"===a?"<br>":`<${a}>`:""})}let i=a.default.memo(function({content:e,className:r,style:o,tag:i="span",placeholder:s=""}){let l=e||s,c=(0,a.useMemo)(()=>{var t;return t=e||"",/<[a-z][\s\S]*?>/i.test(t)},[e]),d=(0,a.useMemo)(()=>n(l),[l]),m={wordBreak:"break-word",overflowWrap:"break-word",...o};return c?(0,t.jsx)(i,{className:r,style:m,dangerouslySetInnerHTML:{__html:d}}):(0,t.jsx)(i,{className:r,style:m,children:l})});e.s(["RichText",0,i,"sanitizeHtml",0,n,"stripHtmlTags",0,function(e){return e.replace(/<[^>]*>/g,"")}],8531)},96359,e=>{"use strict";let t=["#f9c12e","#3ecfcf","#34d399","#a78bfa","#ff6b6b","#fb923c","#fbbf24","#22d3ee","#f472b6","#818cf8"],a=["★","●","■","◆","✦","♥","✿","⬟"],r=!1;function o(){if(r||"u"<typeof document)return;r=!0;let e=document.createElement("style");e.id="confetti-enhanced-keyframes",e.textContent=`
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
  `,document.head.appendChild(e)}function n(){let e=Math.random();return e<.35?"rect":e<.55?"circle":e<.8?"star":"diamond"}function i(e){let{x:t,y:r,color:o,shape:n,dx:i,dy:s,rotation:l,drift:c,delay:d,duration:m,shimmer:h,wrapper:f,animationType:u,sx:p=0,sy:x=0}=e,y=document.createElement("div"),g=6+8*Math.random();if("star"===n||"diamond"===n){let e="star"===n?a[Math.floor(2*Math.random())]:a[3];y.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${r}px;
      font-size: ${1.4*g}px;
      color: ${o};
      pointer-events: none;
      will-change: transform, opacity;
      line-height: 1;
      animation: ${"side"===u?"confettiSideBurst":"confettiBurst"} ${m}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${i}px;
      --dy: ${s}px;
      --rot: ${l}deg;
      --drift: ${c}px;
      --sx: ${p}px;
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
      animation: ${"side"===u?"confettiSideBurst":"confettiBurst"} ${m}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${i}px;
      --dy: ${s}px;
      --rot: ${l}deg;
      --drift: ${c}px;
      --sx: ${p}px;
      --sy: ${x}px;
    `}h&&.3>Math.random()&&(y.style.animation+=`, confettiShimmer ${400+300*Math.random()}ms ease-in-out ${d}ms infinite`),f.appendChild(y)}function s(e){let t=document.createElement("div");return t.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 9999; overflow: hidden;
  `,e.appendChild(t),t}function l(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function c(e={}){if(l())return;o();let{count:a=50,duration:r=3e3,container:d=document.body,originX:m=.5,originY:h=.3}=e,f=s(d),u=window.innerWidth*m,p=window.innerHeight*h;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,o=200+400*Math.random(),s=Math.cos(a)*o,l=Math.sin(a)*o-300,c=720*Math.random()-360,d=(Math.random()-.5)*120,m=200*Math.random();i({x:u,y:p,color:e,shape:n(),dx:s,dy:l,rotation:c,drift:d,delay:m,duration:r,shimmer:!0,wrapper:f,animationType:"center"})}setTimeout(()=>{f.remove()},r+500)}function d(e={}){if(l())return;o();let{count:a=70,duration:r=3500,container:c=document.body}=e,m=s(c),h=window.innerWidth,f=window.innerHeight,u=Math.floor(a/2);for(let e=0;e<u;e++){let e=t[Math.floor(Math.random()*t.length)],a=f*(.5+.3*Math.random()),o=h*(.2+.4*Math.random()),s=-(.2*f+Math.random()*f*.3),l=720*Math.random()-360,c=20+60*Math.random(),d=300*Math.random();i({x:0,y:a,color:e,shape:n(),dx:0,dy:0,rotation:l,drift:c,delay:d,duration:r,shimmer:!0,wrapper:m,animationType:"side",sx:o,sy:s})}for(let e=0;e<u;e++){let e=t[Math.floor(Math.random()*t.length)],a=f*(.5+.3*Math.random()),o=-(h*(.2+.4*Math.random())),s=-(.2*f+Math.random()*f*.3),l=720*Math.random()-360,c=-(20+60*Math.random()),d=300*Math.random();i({x:h,y:a,color:e,shape:n(),dx:0,dy:0,rotation:l,drift:c,delay:d,duration:r,shimmer:!0,wrapper:m,animationType:"side",sx:o,sy:s})}setTimeout(()=>{m.remove()},r+500)}e.s(["fireConfetti",0,c,"fireConfettiCelebration",0,function(e={}){if(l())return;let{count:t=60,duration:a=3500,container:r=document.body}=e;d({count:t+10,duration:a,container:r}),setTimeout(()=>{c({count:t,duration:a-200,container:r,originX:.5,originY:.3})},300),setTimeout(()=>{d({count:Math.floor(.7*t),duration:a-400,container:r})},600)},"fireConfettiMini",0,function(e={}){if(l())return;o();let{count:a=9,duration:r=1200,container:c=document.body,originX:d=.5,originY:m=.5}=e,h=s(c),f=window.innerWidth*d,u=window.innerHeight*m;for(let e=0;e<a;e++){let e=t[Math.floor(Math.random()*t.length)],a=Math.random()*Math.PI*2,o=80+150*Math.random(),s=Math.cos(a)*o,l=Math.sin(a)*o-100,c=360*Math.random()-180,d=(Math.random()-.5)*40,m=100*Math.random();i({x:f,y:u,color:e,shape:n(),dx:s,dy:l,rotation:c,drift:d,delay:m,duration:r,shimmer:!1,wrapper:h,animationType:"center"})}setTimeout(()=>{h.remove()},r+300)}])},68554,e=>{"use strict";var t=e.i(43476),a=e.i(71645);let r=(0,e.i(75254).default)("gift",[["rect",{x:"3",y:"8",width:"18",height:"4",rx:"1",key:"bkv52"}],["path",{d:"M12 8v13",key:"1c76mn"}],["path",{d:"M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7",key:"6wjy6b"}],["path",{d:"M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",key:"1ihvrl"}]]);var o=e.i(52926),n=e.i(8531),i=e.i(5262),s=e.i(96359);let l=a.default.memo(function({block:e,tokens:l,isCompact:c,interactive:d,isEditing:m,compression:h}){let f=e.accentColor||"p",u=l.color(f),p=l.edu("reveal",c),[x,y]=(0,a.useState)(!1),[g,b]=(0,a.useState)(!1),v=(0,a.useCallback)(()=>{x||(y(!0),g?(0,i.playSound)("click"):(b(!0),(0,s.fireConfetti)({count:40,duration:2500}),(0,i.playSound)("ding")))},[x,g]),k=(0,a.useCallback)(()=>{y(!1),(0,i.playSound)("click")},[]),M=!d||x;return(0,t.jsxs)(o.PremiumBlockWrapper,{tokens:l,accent:f,staggerIndex:0,gradientBorder:!0,children:[(0,t.jsx)(o.ReadingProgressIndicator,{progress:+!!M,tokens:l,accent:f,height:2,position:"top"}),(0,t.jsxs)("div",{className:"rounded-xl overflow-hidden premium-card-glow",style:{background:l.colorAlpha(f,.06),border:`1px solid ${l.colorAlpha(f,.2)}`,boxShadow:p.shadow("card")},children:[(0,t.jsx)("div",{className:"h-1",style:{background:`linear-gradient(90deg, ${u}, ${l.colorAlpha(f,.4)})`}}),(0,t.jsxs)("div",{style:{...p.sectionPadding()},children:[(0,t.jsxs)("div",{className:"flex items-center gap-2 mb-3",children:[(0,t.jsx)(o.MicroInteraction,{tokens:l,accent:f,effect:"glow",children:(0,t.jsx)("div",{className:"w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",style:{background:l.colorAlpha(f,.2)},children:(0,t.jsx)(r,{size:10,style:{color:u}})})}),(0,t.jsx)(o.PremiumBadge,{tokens:l,accent:f,variant:"glass",children:"Konten Tersembunyi"})]}),e.title&&(0,t.jsx)("div",{className:"font-extrabold mb-3",style:{...p.heading(),fontFamily:l.fontFamily("display"),color:p.textColor(),wordBreak:"break-word",overflowWrap:"break-word"},children:(0,t.jsx)(n.RichText,{content:e.title})}),!M&&(0,t.jsx)(o.MicroInteraction,{tokens:l,accent:f,effect:"bounce",children:(0,t.jsxs)("button",{type:"button",onClick:v,className:`w-full text-center rounded-lg cursor-pointer ${l.iosButtonTw()}  hover:scale-[1.01]`,style:{...p.componentPadding(),background:`linear-gradient(135deg, ${l.colorAlpha(f,.12)}, ${l.colorAlpha(f,.04)})`,border:`2px dashed ${l.colorAlpha(f,.4)}`,outline:"none"},"aria-label":"Ketuk untuk membuka konten tersembunyi",children:[(0,t.jsx)("div",{className:"mx-auto mb-3 flex items-center justify-center",style:{width:c?"48px":"60px",height:c?"48px":"60px",borderRadius:"50%",background:`linear-gradient(135deg, ${u}, ${l.colorAlpha(f,.6)})`,boxShadow:`0 6px 20px ${l.colorAlpha(f,.4)}`,fontSize:c?"24px":"30px",animation:"glowPulse 2s ease-in-out infinite","--glow-color":l.colorAlpha(f,.2),"--glow-color-strong":l.colorAlpha(f,.5)},children:e.coverIcon||"🎁"}),(0,t.jsx)("div",{className:"font-bold",style:{...p.bodyLg(),fontWeight:700,color:u,fontFamily:l.fontFamily("display")},children:e.coverText||"Ketuk untuk membuka!"}),(0,t.jsx)("div",{className:"mt-2",style:{...p.caption(),color:p.mutedText(.5),animation:"float 2.5s ease-in-out infinite"},children:"👆 Ketuk untuk membuka"})]})}),M&&(0,t.jsxs)("div",{style:{...p.componentPadding(),borderRadius:p.radius("lg"),background:p.cardBg(),border:`1px solid ${l.colorAlpha(f,.25)}`,borderLeft:`${p.stripeWidth()}px solid ${u}`,overflow:"hidden"},children:[(0,t.jsxs)("div",{className:"flex items-center gap-2 mb-2",children:[(0,t.jsx)("div",{className:"flex-shrink-0 flex items-center justify-center",style:{width:c?"28px":"34px",height:c?"28px":"34px",borderRadius:"50%",background:`linear-gradient(135deg, ${u}, ${l.colorAlpha(f,.7)})`,boxShadow:`0 4px 12px ${l.colorAlpha(f,.3)}`,fontSize:c?"14px":"17px",animation:g&&x?"popIn 0.4s ease-out":void 0},children:e.revealIcon||"💡"}),(0,t.jsx)("span",{className:"font-extrabold uppercase tracking-wider",style:{...p.micro(),color:u,letterSpacing:"0.06em"},children:"Terbuka!"})]}),(0,t.jsx)("div",{className:c?"canvas-truncate-2":"",style:{...p.body(),color:p.textColor(),wordBreak:"break-word",overflowWrap:"break-word"},children:(0,t.jsx)(n.RichText,{content:e.revealContent||""})}),d&&(0,t.jsx)(o.MicroInteraction,{tokens:l,accent:f,effect:"squish",children:(0,t.jsxs)("button",{type:"button",onClick:k,className:`mt-3 px-4 py-1.5 rounded-lg font-bold ${l.iosExpandTw()}  hover:scale-[1.02]`,style:{...p.caption(),background:l.colorAlpha(f,.1),color:u,border:`1px solid ${l.colorAlpha(f,.3)}`,cursor:"pointer"},"aria-label":"Sembunyikan konten",children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline mr-1",style:{fontSize:"11px"},children:"visibility_off"})," Sembunyikan"]})})]})]})]})]})});e.s(["RevealRenderer",0,l],68554)}]);