(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,8531,e=>{"use strict";var t=e.i(43476),r=e.i(71645);let a=new Set(["strong","em","b","i","u","br","span","sub","sup","mark","small"]),o=/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi;function n(e){if(!e)return"";let t=e.replace(o,"");return(t=t.replace(/<!--[\s\S]*?-->/g,"")).replace(/<\/?[a-zA-Z][^>]*>?|<![^>]*>?|<|[^<]+/g,e=>{if("<"===e)return"<";if(!e.startsWith("<"))return e;if(e.startsWith("<!"))return"";let t=e.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);if(!t)return"";let r=t[1].toLowerCase();return a.has(r)?e.startsWith("</")?`</${r}>`:"br"===r?"<br>":`<${r}>`:""})}let i=r.default.memo(function({content:e,className:a,style:o,tag:i="span",placeholder:l=""}){let s=e||l,c=(0,r.useMemo)(()=>{var t;return t=e||"",/<[a-z][\s\S]*?>/i.test(t)},[e]),d=(0,r.useMemo)(()=>n(s),[s]),u={wordBreak:"break-word",overflowWrap:"break-word",...o};return c?(0,t.jsx)(i,{className:a,style:u,dangerouslySetInnerHTML:{__html:d}}):(0,t.jsx)(i,{className:a,style:u,children:s})});e.s(["RichText",0,i,"sanitizeHtml",0,n,"stripHtmlTags",0,function(e){return e.replace(/<[^>]*>/g,"")}],8531)},61051,e=>{"use strict";var t=e.i(43476),r=e.i(71645);e.i(22880);var a=e.i(59263),o=e.i(8531);e.s(["InlineTextEditor",0,function({value:e,onSave:n,isEditing:i,className:l="",style:s,placeholder:c="Ketik teks...",tag:d="span",multiline:u=!1,allowHtml:m=!1}){let p=(0,r.useRef)(null),f=(0,r.useRef)(!1);(0,r.useEffect)(()=>{if(p.current){if(f.current){f.current=!1;return}/<[a-z][\s\S]*>/i.test(e||"")?p.current.innerHTML!==e&&(p.current.innerHTML=e):p.current.textContent!==e&&(p.current.textContent=e)}},[e]),(0,r.useEffect)(()=>{if(i&&p.current){p.current.focus();let e=document.createRange();e.selectNodeContents(p.current);let t=window.getSelection();t?.removeAllRanges(),t?.addRange(e)}},[i]);let h=(0,r.useCallback)(()=>{if(!p.current)return;let t=/<[a-z][\s\S]*>/i.test(e||"")?p.current.innerHTML:p.current.textContent||"";t!==e&&n(t),a.useCanvaStore.getState().stopEditing()},[e,n]),x=(0,r.useCallback)(()=>{f.current=!0},[]),y=(0,r.useCallback)(t=>{"Enter"!==t.key||u||(t.preventDefault(),p.current?.blur()),"Escape"===t.key&&(t.preventDefault(),p.current&&(p.current.textContent=e),p.current?.blur())},[u,e]);if(!i){let r=/<[a-z][\s\S]*>/i.test(e||"");if(m||r){let r=(0,o.sanitizeHtml)(e||c);return(0,t.jsx)(d,{className:l,style:s,dangerouslySetInnerHTML:{__html:r}})}return(0,t.jsx)(d,{className:l,style:s,children:e||c})}return/<[a-z][\s\S]*>/i.test(e||"")?(0,t.jsx)(d,{ref:p,className:`${l} outline-none ring-2 ring-emerald-400/40 rounded-sm px-0.5 -mx-0.5 transition-shadow`,style:s,contentEditable:!0,suppressContentEditableWarning:!0,onBlur:h,onInput:x,onKeyDown:y,"data-inline-editor":"true"}):(0,t.jsx)(d,{ref:p,className:`${l} outline-none ring-2 ring-emerald-400/40 rounded-sm px-0.5 -mx-0.5 transition-shadow`,style:s,contentEditable:!0,suppressContentEditableWarning:!0,onBlur:h,onInput:x,onKeyDown:y,"data-inline-editor":"true",children:e||c})},"useInlineEditor",0,function(e){let{blockId:t,fieldKey:o,value:n,...i}=e,l=(0,a.useCanvaStore)(e=>e.editingBlockId),s=(0,a.useCanvaStore)(e=>e.updateSchemaBlock),c=!!t&&l===t;return{value:n,onSave:(0,r.useCallback)(e=>{t&&s(t,function(e,t){let r=e.split("."),a={},o=a;for(let e=0;e<r.length;e++)e===r.length-1?o[r[e]]=t:(o[r[e]]={},o=o[r[e]]);return a}(o,e),{overflowPolicy:"warn",source:"user"})},[t,o,s]),isEditing:c,...i}}])},96359,e=>{"use strict";let t=["#f9c12e","#3ecfcf","#34d399","#a78bfa","#ff6b6b","#fb923c","#fbbf24","#22d3ee","#f472b6","#818cf8"],r=["★","●","■","◆","✦","♥","✿","⬟"],a=!1;function o(){if(a||"u"<typeof document)return;a=!0;let e=document.createElement("style");e.id="confetti-enhanced-keyframes",e.textContent=`
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
  `,document.head.appendChild(e)}function n(){let e=Math.random();return e<.35?"rect":e<.55?"circle":e<.8?"star":"diamond"}function i(e){let{x:t,y:a,color:o,shape:n,dx:i,dy:l,rotation:s,drift:c,delay:d,duration:u,shimmer:m,wrapper:p,animationType:f,sx:h=0,sy:x=0}=e,y=document.createElement("div"),g=6+8*Math.random();if("star"===n||"diamond"===n){let e="star"===n?r[Math.floor(2*Math.random())]:r[3];y.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${a}px;
      font-size: ${1.4*g}px;
      color: ${o};
      pointer-events: none;
      will-change: transform, opacity;
      line-height: 1;
      animation: ${"side"===f?"confettiSideBurst":"confettiBurst"} ${u}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${i}px;
      --dy: ${l}px;
      --rot: ${s}deg;
      --drift: ${c}px;
      --sx: ${h}px;
      --sy: ${x}px;
    `,Math.random()>.3&&(y.style.animation+=`, confettiTumble ${1200+800*Math.random()}ms linear ${d}ms infinite`),y.textContent=e}else{let e="circle"===n;y.style.cssText=`
      position: absolute;
      left: ${t}px;
      top: ${a}px;
      width: ${g}px;
      height: ${e?g:.5*g}px;
      background: ${o};
      border-radius: ${e?"50%":"2px"};
      pointer-events: none;
      will-change: transform, opacity;
      animation: ${"side"===f?"confettiSideBurst":"confettiBurst"} ${u}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d}ms forwards;
      --dx: ${i}px;
      --dy: ${l}px;
      --rot: ${s}deg;
      --drift: ${c}px;
      --sx: ${h}px;
      --sy: ${x}px;
    `}m&&.3>Math.random()&&(y.style.animation+=`, confettiShimmer ${400+300*Math.random()}ms ease-in-out ${d}ms infinite`),p.appendChild(y)}function l(e){let t=document.createElement("div");return t.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 9999; overflow: hidden;
  `,e.appendChild(t),t}function s(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function c(e={}){if(s())return;o();let{count:r=50,duration:a=3e3,container:d=document.body,originX:u=.5,originY:m=.3}=e,p=l(d),f=window.innerWidth*u,h=window.innerHeight*m;for(let e=0;e<r;e++){let e=t[Math.floor(Math.random()*t.length)],r=Math.random()*Math.PI*2,o=200+400*Math.random(),l=Math.cos(r)*o,s=Math.sin(r)*o-300,c=720*Math.random()-360,d=(Math.random()-.5)*120,u=200*Math.random();i({x:f,y:h,color:e,shape:n(),dx:l,dy:s,rotation:c,drift:d,delay:u,duration:a,shimmer:!0,wrapper:p,animationType:"center"})}setTimeout(()=>{p.remove()},a+500)}function d(e={}){if(s())return;o();let{count:r=70,duration:a=3500,container:c=document.body}=e,u=l(c),m=window.innerWidth,p=window.innerHeight,f=Math.floor(r/2);for(let e=0;e<f;e++){let e=t[Math.floor(Math.random()*t.length)],r=p*(.5+.3*Math.random()),o=m*(.2+.4*Math.random()),l=-(.2*p+Math.random()*p*.3),s=720*Math.random()-360,c=20+60*Math.random(),d=300*Math.random();i({x:0,y:r,color:e,shape:n(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:a,shimmer:!0,wrapper:u,animationType:"side",sx:o,sy:l})}for(let e=0;e<f;e++){let e=t[Math.floor(Math.random()*t.length)],r=p*(.5+.3*Math.random()),o=-(m*(.2+.4*Math.random())),l=-(.2*p+Math.random()*p*.3),s=720*Math.random()-360,c=-(20+60*Math.random()),d=300*Math.random();i({x:m,y:r,color:e,shape:n(),dx:0,dy:0,rotation:s,drift:c,delay:d,duration:a,shimmer:!0,wrapper:u,animationType:"side",sx:o,sy:l})}setTimeout(()=>{u.remove()},a+500)}e.s(["fireConfetti",0,c,"fireConfettiCelebration",0,function(e={}){if(s())return;let{count:t=60,duration:r=3500,container:a=document.body}=e;d({count:t+10,duration:r,container:a}),setTimeout(()=>{c({count:t,duration:r-200,container:a,originX:.5,originY:.3})},300),setTimeout(()=>{d({count:Math.floor(.7*t),duration:r-400,container:a})},600)},"fireConfettiMini",0,function(e={}){if(s())return;o();let{count:r=9,duration:a=1200,container:c=document.body,originX:d=.5,originY:u=.5}=e,m=l(c),p=window.innerWidth*d,f=window.innerHeight*u;for(let e=0;e<r;e++){let e=t[Math.floor(Math.random()*t.length)],r=Math.random()*Math.PI*2,o=80+150*Math.random(),l=Math.cos(r)*o,s=Math.sin(r)*o-100,c=360*Math.random()-180,d=(Math.random()-.5)*40,u=100*Math.random();i({x:p,y:f,color:e,shape:n(),dx:l,dy:s,rotation:c,drift:d,delay:u,duration:a,shimmer:!1,wrapper:m,animationType:"center"})}setTimeout(()=>{m.remove()},a+300)}])},60447,e=>{"use strict";var t=e.i(43476),r=e.i(71645),a=e.i(61051),o=e.i(27700),n=e.i(5262),i=e.i(96359),l=e.i(73829),s=e.i(52926);function c({kolomDef:e,kolomIndex:r,blockId:o,tokens:n,selected:i,kolomItems:l,onKolomClick:s,isCompact:d}){let u=n.edu("sortir-game",d),m=(0,a.useInlineEditor)({blockId:o,fieldKey:`kolom.${r}.label`,value:e.label??"",tag:"span"});return(0,t.jsxs)("div",{onClick:s,role:"button",tabIndex:0,"aria-label":e.label||"Kolom","aria-pressed":i===e.id,onKeyDown:e=>{("Enter"===e.key||" "===e.key)&&(e.preventDefault(),s?.())},className:"rounded-xl p-3.5 min-h-[70px] border-2 transition-[background-color,border-color,box-shadow] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent",style:{borderColor:i?n.colorAlpha(e.color,.5):n.colorAlpha(e.color,.2),background:i?n.colorAlpha(e.color,.08):n.colorAlpha(e.color,.04),boxShadow:i?"0 0 16px "+n.colorAlpha(e.color,.15):u.shadow("card")},children:[(0,t.jsxs)("div",{className:"flex items-center gap-2 mb-2",children:[(0,t.jsx)("div",{className:"w-7 h-7 rounded-full flex items-center justify-center",style:{background:n.colorAlpha(e.color,.2)},children:(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"12px"},children:"folder_open"})}),(0,t.jsx)("div",{className:"font-extrabold uppercase tracking-wider min-w-0",style:{...u.caption(),color:n.color(e.color),overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:(0,t.jsx)(a.InlineTextEditor,{...m,className:"font-extrabold uppercase tracking-wider",style:{color:n.color(e.color),...u.micro()},placeholder:"Ketik label kolom..."})})]}),(0,t.jsx)("div",{className:"flex flex-wrap gap-1.5",children:l.map((a,i)=>(0,t.jsx)("span",{className:`px-2.5 py-1 rounded-full font-bold min-w-0 ${d?"canvas-truncate-1":""}`,style:{...u.micro(),background:n.colorAlpha(e.color,.2),color:n.color(e.color),border:"1px solid "+n.colorAlpha(e.color,.3),wordBreak:"break-word",overflowWrap:"break-word",maxWidth:"100%"},children:a},`sortir-item-${o}-${r}-${i}`))})]})}let d=r.default.memo(function({block:e,tokens:d,interactive:u,isCompact:m,isEditing:p,pageIndex:f}){let h=d.edu("sortir-game",m),x=e.accentColor||"y",y=e.pool||[],g=e.kolom||[],[b,v]=r.default.useState(y.map(e=>({...e,placed:!1}))),[k,w]=r.default.useState(()=>{let e={};return g.forEach(t=>{e[t.id]=[]}),e}),[M,S]=r.default.useState(null),[$,j]=r.default.useState(null),[C,T]=r.default.useState({}),N=(0,o.useInteractiveStore)(e=>e.replayGeneration);r.default.useEffect(()=>{v(y.map(e=>({...e,placed:!1})));let e={};g.forEach(t=>{e[t.id]=[]}),w(e),S(null),j(null),T({})},[N]);let I=(0,o.useInteractiveStore)(e=>e.reportScore);(0,a.useInlineEditor)({blockId:e.id,fieldKey:"title",value:e.title??"",tag:"span"});let B=r.default.useMemo(()=>b.filter(e=>e.placed).length,[b]),E=r.default.useMemo(()=>b.filter(e=>!e.placed),[b]),A=y.length,z=A>0&&B>=A,R=r.default.useRef(!1);if(r.default.useEffect(()=>{if(z&&u&&e.id&&!R.current){R.current=!0;let t=Object.values(C).reduce((e,t)=>e+t,0),r=t>0?Math.round(A/t*100):100;I({elementId:e.id,pageIndex:f??0,score:r,maxScore:100,completed:!0}),t<=A?((0,n.playSound)("complete"),(0,i.fireConfettiCelebration)()):((0,n.playSound)("complete"),(0,i.fireConfetti)({count:50})),(0,l.announceToScreenReader)(`Game selesai! Skor kamu: ${r} dari ${A}`,"assertive")}z||(R.current=!1)},[z,u,e.id,C,A,I,f]),r.default.useEffect(()=>{if($){let e=setTimeout(()=>j(null),2500);return()=>clearTimeout(e)}},[$]),z){let e=Object.values(C).reduce((e,t)=>e+t,0),r=e<=A;return(0,t.jsx)(s.PremiumBlockWrapper,{tokens:d,accent:x,staggerIndex:0,gradientBorder:!0,children:(0,t.jsxs)("div",{className:"text-center p-5 rounded-2xl",style:{background:h.pageBg(),border:"2px solid "+h.accentAlpha(.3),boxShadow:h.shadow("elevated")},children:[(0,t.jsx)(s.ReadingProgressIndicator,{progress:1,tokens:d,accent:x,height:3,position:"top"}),(0,t.jsx)("div",{className:"text-3xl mb-3",style:{animation:"float 3s ease-in-out infinite"},children:r?"🌟":"🎮"}),(0,t.jsx)("div",{className:"font-black text-lg mb-1",style:{fontFamily:d.fontFamily("display"),color:h.accent()},children:r?"Sempurna!":"Semua Benar!"}),(0,t.jsxs)("div",{className:"mb-2",style:{...h.body(),color:h.mutedText(.8)},children:[A," item berhasil dikelompokkan dengan tepat!"]}),e>A&&(0,t.jsxs)(s.PremiumBadge,{tokens:d,accent:"c",variant:"glass",children:[e," percobaan — akurasi ",Math.round(A/e*100),"%"]}),u&&(0,t.jsx)(s.MicroInteraction,{tokens:d,accent:x,effect:"squish",children:(0,t.jsxs)("button",{className:"mt-3 px-5 py-2 rounded-xl font-extrabold"+d.iosButtonTw(u),onClick:()=>{v(y.map(e=>({...e,placed:!1})));let e={};g.forEach(t=>{e[t.id]=[]}),w(e),S(null),j(null),T({}),R.current=!1,(0,n.playSound)("click")},style:{...h.caption(),background:"linear-gradient(135deg, "+h.accent()+", "+d.color("o")+")",color:d.color("bg"),boxShadow:"0 4px 16px "+h.accentAlpha(.35)},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"refresh"})," Ulangi Game"]})})]})})}return(0,t.jsx)(s.PremiumBlockWrapper,{tokens:d,accent:x,staggerIndex:0,children:(0,t.jsxs)("div",{className:"game-block",...u?{role:"application"}:{},"aria-label":`Sortir: ${B} dari ${A} item ditempatkan`,"aria-describedby":`sortir-instructions-${e.id||"sortir"}`,"data-interactive":!0,children:[(0,t.jsx)(s.ReadingProgressIndicator,{progress:A>0?B/A:0,tokens:d,accent:x,height:3,position:"top"}),(0,t.jsx)("span",{id:`sortir-instructions-${e.id||"sortir"}`,className:"sr-only",children:"Pilih item dari kolam, lalu klik kolom yang tepat untuk mengelompokkannya"}),(0,t.jsx)("div",{className:"sr-only","aria-live":"polite",role:"status",children:M?`Item ${M} dipilih. Pilih kolom yang tepat.`:""}),$&&(0,t.jsxs)("div",{className:"mb-3 p-3 rounded-xl flex items-start gap-2",style:{background:d.colorAlpha("r",.12),border:"1px solid "+d.colorAlpha("r",.35),boxShadow:"0 4px 16px "+d.colorAlpha("r",.15),animation:"fadeIn 0.3s ease-out"},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline flex-shrink-0 mt-0.5",style:{fontSize:"14px"},children:"cancel"}),(0,t.jsx)("div",{className:"leading-relaxed",style:{...h.caption(),color:d.color("r")},children:$.message})]}),(0,t.jsxs)("div",{className:"flex flex-wrap gap-2.5 min-h-[50px] p-4 border-2 border-dashed rounded-xl mb-4 premium-card-glow",style:{borderColor:h.accentAlpha(.25),background:h.accentAlpha(.04)},children:[(0,t.jsxs)("div",{className:"w-full font-extrabold uppercase tracking-wider mb-2",style:{...h.micro(),color:h.accent()},children:[(0,t.jsx)("span",{className:"material-symbols-outlined inline",style:{fontSize:"14px"},children:"inventory_2"})," Pilih Item ",(0,t.jsxs)(s.PremiumBadge,{tokens:d,accent:x,variant:"glass",children:[B,"/",A]})]}),E.map(e=>(0,t.jsx)("button",{onClick:()=>{var t;return t=e.id,void(u&&(S(e=>e===t?null:t),(0,n.playSound)("tap")))},"aria-selected":M===e.id,className:`px-3.5 py-2 rounded-full font-extrabold ${d.iosGameButtonTw(u)} min-w-0 ${m?"canvas-truncate-1":""}`,style:{background:M===e.id?h.accentAlpha(.2):d.subtleBg(.07),border:"2px solid "+(M===e.id?h.accent():d.subtleBorder(.15)),boxShadow:M===e.id?"0 0 16px "+h.accentAlpha(.35):h.shadow("card"),...h.caption(),animation:M===e.id?"pulse 1.5s ease-in-out infinite":"none",wordBreak:"break-word",overflowWrap:"break-word"},children:e.text},e.id))]}),(0,t.jsx)("div",{className:"grid grid-cols-2 gap-3",children:g.map((r,a)=>(0,t.jsx)(c,{kolomDef:r,kolomIndex:a,blockId:e.id,tokens:d,selected:M,kolomItems:k[r.id]||[],onKolomClick:()=>(e=>{if(!u||!M)return;let t=b.find(e=>e.id===M);if(t){if(t.category===e)v(e=>e.map(e=>e.id===M?{...e,placed:!0}:e)),w(r=>({...r,[e]:[...r[e]||[],t.text]})),(0,n.playSound)("correct"),(0,l.announceToScreenReader)("Item benar!","assertive");else{let r=g.find(e=>e.id===t.category),a=g.find(t=>t.id===e);r?.label;let o=a?.label??e;j({itemId:t.id,kolomId:e,message:`"${t.text}" bukan termasuk ${o}. Coba pindahkan ke kolom yang tepat!`}),T(e=>({...e,[t.id]:(e[t.id]||0)+1})),(0,n.playSound)("incorrect"),(0,l.announceToScreenReader)("Kolom salah","assertive")}S(null)}})(r.id),isCompact:m},r.id))})]})})});e.s(["SortirGameRenderer",0,d])}]);