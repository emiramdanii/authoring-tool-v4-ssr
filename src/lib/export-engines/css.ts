export const GAME_ENGINE_CSS = `
/* ── Quiz Engine ── */
.qe-wrap{height:100%;display:flex;flex-direction:column;background:rgba(245,200,66,.06);border-radius:10px;padding:12px;overflow:hidden}
.qe-bar{height:3px;background:rgba(245,200,66,.15);border-radius:2px;overflow:hidden;margin-bottom:8px}
.qe-bar-fill{height:100%;background:#f5c842;transition:width .4s ease}
.qe-head{display:flex;justify-content:space-between;font-size:10px;color:#f5c842;margin-bottom:6px;font-weight:700}
.qe-q{font-size:13px;font-weight:700;color:#f5c842;margin-bottom:8px;line-height:1.3}
.qe-opt{display:block;width:100%;text-align:left;padding:7px 10px;margin:3px 0;border-radius:7px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(245,200,66,.9);font-size:11px;cursor:pointer;transition:all .2s;font-family:inherit}
.qe-opt:hover{background:rgba(255,255,255,.1)}
.qe-opt.correct{background:rgba(52,211,153,.2);border-color:rgba(52,211,153,.4);color:#6ee7b7}
.qe-opt.wrong{background:rgba(239,68,68,.2);border-color:rgba(239,68,68,.4);color:#fca5a5}
.qe-opt.dim{opacity:.3;cursor:default}
.qe-ex{font-size:10px;color:#60a5fa;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);border-radius:6px;padding:4px 8px;margin-top:6px}
.qe-result{text-align:center;padding:16px;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center}
.qe-result .score{font-size:32px;font-weight:900}
.qe-result .level{font-size:12px;margin-top:2px}
.qe-btn{margin-top:10px;padding:6px 18px;border:1px solid rgba(245,200,66,.3);border-radius:8px;background:rgba(245,200,66,.15);color:#f5c842;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .2s}
.qe-btn:hover{background:rgba(245,200,66,.3)}

/* ── True/False Engine ── */
.tf-wrap{height:100%;display:flex;flex-direction:column;background:rgba(62,207,207,.06);border-radius:10px;padding:12px}
.tf-head{display:flex;justify-content:space-between;font-size:10px;color:#3ecfcf;margin-bottom:6px;font-weight:700}
.tf-q{font-size:13px;font-weight:700;color:#3ecfcf;flex:1;min-height:0;overflow-y:auto;line-height:1.3;margin-bottom:8px}
.tf-btns{display:flex;gap:8px}
.tf-btn{flex:1;padding:10px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;border:1px solid;font-family:inherit}
.tf-yes{background:rgba(52,211,153,.15);border-color:rgba(52,211,153,.3);color:#34d399}
.tf-yes:hover{background:rgba(52,211,153,.3)}
.tf-no{background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.3);color:#f87171}
.tf-no:hover{background:rgba(239,68,68,.3)}
.tf-btn.picked-correct{background:rgba(52,211,153,.3);border-color:rgba(52,211,153,.5)}
.tf-btn.picked-wrong{background:rgba(239,68,68,.3);border-color:rgba(239,68,68,.5)}
.tf-btn.show-correct{background:rgba(52,211,153,.25);border-color:rgba(52,211,153,.4)}
.tf-btn.dim{opacity:.3;cursor:default}

/* ── Memory Game Engine ── */
.mem-wrap{height:100%;display:flex;flex-direction:column;background:rgba(62,207,207,.06);border-radius:10px;padding:12px}
.mem-head{display:flex;justify-content:space-between;font-size:10px;color:#3ecfcf;margin-bottom:6px;font-weight:700}
.mem-grid{flex:1;min-height:0;display:grid;gap:6px}
.mem-card{border-radius:8px;border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .3s;font-size:11px;text-align:center;padding:4px;font-weight:600;user-select:none}
.mem-card.face-down{background:rgba(255,255,255,.06)}
.mem-card.face-down:hover{background:rgba(255,255,255,.12)}
.mem-card.face-up{background:rgba(62,207,207,.2);border-color:rgba(62,207,207,.35);color:#3ecfcf}
.mem-card.matched{background:rgba(52,211,153,.15);border-color:rgba(52,211,153,.3);color:#34d399;transform:scale(.95)}

/* ── Matching Engine ── */
.match-wrap{height:100%;display:flex;flex-direction:column;background:rgba(62,207,207,.06);border-radius:10px;padding:12px}
.match-head{font-size:10px;color:#3ecfcf;margin-bottom:6px;font-weight:700}
.match-cols{flex:1;min-height:0;display:flex;gap:8px;overflow:hidden}
.match-col{flex:1;display:flex;flex-direction:column;gap:4px;overflow-y:auto}
.match-item{padding:6px 8px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(62,207,207,.9);font-size:10px;cursor:pointer;transition:all .2s;text-align:left;font-weight:600}
.match-item:hover{background:rgba(255,255,255,.1)}
.match-item.selected{background:rgba(62,207,207,.2);border-color:rgba(62,207,207,.4)}
.match-item.matched{background:rgba(52,211,153,.15);border-color:rgba(52,211,153,.3);color:#34d399;text-decoration:line-through;opacity:.5;cursor:default}
.match-item.wrong{background:rgba(239,68,68,.2);border-color:rgba(239,68,68,.4);color:#fca5a5}

/* ── Sorting Engine ── */
.sort-wrap{height:100%;display:flex;flex-direction:column;background:rgba(62,207,207,.06);border-radius:10px;padding:12px}
.sort-head{font-size:10px;color:#3ecfcf;margin-bottom:6px;font-weight:700}
.sort-items{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}
.sort-tag{font-size:9px;padding:3px 8px;border-radius:4px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#3ecfcf;cursor:pointer;transition:all .2s}
.sort-tag:hover{background:rgba(255,255,255,.15)}
.sort-tag.placed{opacity:.3;cursor:default}
.sort-cats{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:6px}
.sort-cat{border-radius:8px;border:1px solid rgba(255,255,255,.08);padding:8px;min-height:36px;background:rgba(255,255,255,.03)}
.sort-cat.wrong{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.3)}
.sort-cat-label{font-size:10px;font-weight:700;margin-bottom:4px}
.sort-cat-items{display:flex;flex-wrap:wrap;gap:3px}
.sort-cat-item{font-size:8px;padding:2px 6px;border-radius:3px;background:rgba(52,211,153,.15);border:1px solid rgba(52,211,153,.25);color:#34d399}
.sort-cat-btns{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px}
.sort-cat-btn{font-size:8px;padding:2px 5px;border-radius:3px;background:rgba(255,255,255,.04);border:1px dashed rgba(255,255,255,.1);color:rgba(255,255,255,.35);cursor:pointer;transition:all .15s}
.sort-cat-btn:hover{background:rgba(255,255,255,.1);color:rgba(255,255,255,.6)}

/* ── Roda/SpinWheel Engine ── */
.roda-wrap{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(62,207,207,.06);border-radius:10px;padding:12px;gap:8px}
.roda-svg{transition:transform 2.5s cubic-bezier(.17,.67,.12,.99)}
.roda-result{font-size:13px;font-weight:700;color:#f9c82e;text-align:center;max-width:100%;overflow:hidden}
.roda-spin{padding:8px 20px;border-radius:8px;background:rgba(62,207,207,.2);border:1px solid rgba(62,207,207,.3);color:#3ecfcf;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
.roda-spin:hover{background:rgba(62,207,207,.35)}
.roda-spin:disabled{opacity:.4;cursor:default}

/* ── TeamBuzzer Engine ── */
.tb-wrap{height:100%;display:flex;flex-direction:column;background:rgba(62,207,207,.06);border-radius:10px;padding:12px}
.tb-head{display:flex;justify-content:space-between;font-size:10px;color:#3ecfcf;margin-bottom:6px;font-weight:700}
.tb-q{font-size:12px;font-weight:700;color:#3ecfcf;flex:1;min-height:0;overflow-y:auto;line-height:1.3;margin-bottom:8px}
.tb-teams{display:flex;gap:8px;margin-bottom:8px}
.tb-team{flex:1;padding:10px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;border:1px solid;text-align:center;font-family:inherit}
.tb-team-a{background:rgba(96,165,250,.15);border-color:rgba(96,165,250,.3);color:#60a5fa}
.tb-team-a:hover{background:rgba(96,165,250,.3)}
.tb-team-b{background:rgba(251,146,60,.15);border-color:rgba(251,146,60,.3);color:#fb923c}
.tb-team-b:hover{background:rgba(251,146,60,.3)}
.tb-team.buzzed{opacity:.4;cursor:default}
.tb-team.correct-team{background:rgba(52,211,153,.2);border-color:rgba(52,211,153,.4);color:#34d399}
.tb-judge{display:flex;gap:6px}
.tb-judge-btn{flex:1;padding:6px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;border:1px solid;font-family:inherit;transition:all .2s}
.tb-judge-yes{background:rgba(52,211,153,.15);border-color:rgba(52,211,153,.3);color:#34d399}
.tb-judge-no{background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.3);color:#f87171}

/* ── WordSearch Engine ── */
.ws-wrap{height:100%;display:flex;flex-direction:column;background:rgba(62,207,207,.06);border-radius:10px;padding:12px}
.ws-head{font-size:10px;color:#3ecfcf;margin-bottom:6px;font-weight:700}
.ws-body{flex:1;min-height:0;display:flex;gap:8px;overflow:hidden}
.ws-grid{flex-shrink:0;display:grid;gap:2px}
.ws-cell{width:100%;aspect-ratio:1;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;cursor:pointer;transition:all .15s;background:rgba(255,255,255,.05);color:rgba(255,255,255,.6)}
.ws-cell:hover{background:rgba(255,255,255,.12)}
.ws-cell.sel{background:rgba(245,200,66,.3);color:#f9c82e}
.ws-cell.found{background:rgba(52,211,153,.2);color:#34d399}
.ws-words{display:flex;flex-direction:column;gap:3px;min-width:50px}
.ws-word{font-size:8px;padding:2px 6px;border-radius:3px}
.ws-word.pending{background:rgba(255,255,255,.05);color:rgba(255,255,255,.35)}
.ws-word.found-w{background:rgba(52,211,153,.15);color:#34d399;text-decoration:line-through}

/* ── Flashcard Engine ── */
.fc-wrap{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(62,207,207,.06);border-radius:10px;padding:12px;gap:8px}
.fc-head{font-size:10px;color:#3ecfcf;font-weight:700}
.fc-card{flex:1;width:100%;min-height:0;border-radius:12px;border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;padding:16px;cursor:pointer;transition:all .3s;background:rgba(255,255,255,.04);font-size:14px;font-weight:700;color:#3ecfcf;text-align:center;line-height:1.3}
.fc-card:hover{border-color:rgba(62,207,207,.3)}
.fc-card.flipped{background:rgba(62,207,207,.12)}
.fc-nav{display:flex;gap:8px}
.fc-nav-btn{padding:6px 14px;border-radius:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7);font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
.fc-nav-btn:hover{background:rgba(255,255,255,.12)}

/* ── Common result ── */
.game-result{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;background:rgba(62,207,207,.06);border-radius:10px;padding:16px}
.game-result-icon{font-size:28px}
.game-result-text{font-size:12px;font-weight:700;color:#3ecfcf}
.game-result-sub{font-size:10px;color:rgba(62,207,207,.6)}

/* ── Game Tabs ── */
.game-tab-btn{outline:none}

/* ── Crossword Engine ── */
.cw-wrap{height:100%;display:flex;flex-direction:column;background:rgba(62,207,207,.06);border-radius:10px;padding:12px}
.cw-head{display:flex;justify-content:space-between;font-size:10px;color:#3ecfcf;margin-bottom:6px;font-weight:700}
.cw-body{flex:1;min-height:0;display:flex;gap:8px;overflow:hidden}
.cw-grid{flex-shrink:0;display:grid;gap:1px}
.cw-cell{width:100%;aspect-ratio:1;border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;transition:all .15s;border:1px solid rgba(255,255,255,.1)}
.cw-cell.empty{background:rgba(0,0,0,.3);border-color:transparent;pointer-events:none}
.cw-cell.filled{background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);cursor:pointer}
.cw-cell.filled:focus{outline:2px solid #3ecfcf;outline-offset:-1px}
.cw-cell.correct{background:rgba(52,211,153,.2);border-color:rgba(52,211,153,.4);color:#34d399}
.cw-cell.wrong{background:rgba(239,68,68,.2);border-color:rgba(239,68,68,.4);color:#fca5a5}
.cw-cell.revealed{background:rgba(249,193,46,.15);border-color:rgba(249,193,46,.3);color:#f9c82e}
.cw-cell-num{position:absolute;top:1px;left:2px;font-size:5px;color:rgba(255,255,255,.4);font-weight:700}
.cw-clues{flex:1;min-width:60px;overflow-y:auto;display:flex;flex-direction:column;gap:2px}
.cw-clue-title{font-size:8px;font-weight:700;color:rgba(62,207,207,.6);text-transform:uppercase;letter-spacing:.5px;margin-top:4px}
.cw-clue{font-size:8px;padding:2px 4px;border-radius:3px;color:rgba(255,255,255,.5);cursor:pointer;transition:all .15s}
.cw-clue:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.8)}
.cw-clue.done{text-decoration:line-through;opacity:.4}
.cw-clue.active{background:rgba(62,207,207,.15);color:#3ecfcf}
.cw-check{margin-top:6px;padding:5px 14px;border-radius:6px;background:rgba(62,207,207,.2);border:1px solid rgba(62,207,207,.3);color:#3ecfcf;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;align-self:center}
.cw-check:hover{background:rgba(62,207,207,.35)}

/* ── Fill-in-the-Blank Engine ── */
.fib-wrap{height:100%;display:flex;flex-direction:column;background:rgba(62,207,207,.06);border-radius:10px;padding:12px}
.fib-bar{height:3px;background:rgba(62,207,207,.15);border-radius:2px;overflow:hidden;margin-bottom:8px}
.fib-bar-fill{height:100%;background:#3ecfcf;transition:width .4s ease}
.fib-head{display:flex;justify-content:space-between;font-size:10px;color:#3ecfcf;margin-bottom:6px;font-weight:700}
.fib-q{font-size:12px;font-weight:700;color:#3ecfcf;margin-bottom:8px;line-height:1.4}
.fib-blank{display:inline-block;min-width:50px;border-bottom:2px dashed rgba(62,207,207,.4);padding:0 4px;margin:0 2px;color:transparent;transition:all .2s}
.fib-blank.active{border-color:#3ecfcf;color:transparent}
.fib-input-wrap{margin-top:8px}
.fib-input{width:100%;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff;font-size:12px;font-family:inherit;outline:none;transition:all .2s}
.fib-input:focus{border-color:rgba(62,207,207,.5);background:rgba(255,255,255,.1)}
.fib-input.correct{border-color:rgba(52,211,153,.5);background:rgba(52,211,153,.1)}
.fib-input.wrong{border-color:rgba(239,68,68,.5);background:rgba(239,68,68,.1)}
.fib-hint{font-size:9px;color:rgba(249,193,46,.7);margin-top:4px;font-style:italic}
.fib-btn{margin-top:8px;padding:6px 16px;border-radius:8px;background:rgba(62,207,207,.2);border:1px solid rgba(62,207,207,.3);color:#3ecfcf;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .2s}
.fib-btn:hover{background:rgba(62,207,207,.35)}
.fib-btn:disabled{opacity:.4;cursor:default}

/* ── Drag & Drop Engine ── */
.dd-wrap{height:100%;display:flex;flex-direction:column;background:rgba(62,207,207,.06);border-radius:10px;padding:12px}
.dd-head{font-size:10px;color:#3ecfcf;margin-bottom:6px;font-weight:700}
.dd-items{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;min-height:24px}
.dd-item{font-size:10px;padding:5px 10px;border-radius:6px;background:rgba(62,207,207,.15);border:1px solid rgba(62,207,207,.25);color:#3ecfcf;cursor:grab;transition:all .2s;user-select:none;font-weight:600}
.dd-item:hover{background:rgba(62,207,207,.3);transform:translateY(-1px)}
.dd-item.dragging{opacity:.5;cursor:grabbing}
.dd-item.placed{opacity:.3;cursor:default;pointer-events:none}
.dd-targets{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:8px}
.dd-target{border-radius:8px;border:2px dashed rgba(255,255,255,.12);padding:8px;min-height:36px;background:rgba(255,255,255,.03);transition:all .2s}
.dd-target.drag-over{border-color:rgba(62,207,207,.4);background:rgba(62,207,207,.06)}
.dd-target.wrong{border-color:rgba(239,68,68,.4);background:rgba(239,68,68,.06)}
.dd-target.correct{border-color:rgba(52,211,153,.4);background:rgba(52,211,153,.06)}
.dd-target-label{font-size:10px;font-weight:700;margin-bottom:4px;color:rgba(255,255,255,.5)}
.dd-target-content{min-height:20px;display:flex;flex-wrap:wrap;gap:4px;align-items:center}
.dd-placed-item{font-size:9px;padding:3px 8px;border-radius:4px;background:rgba(62,207,207,.2);border:1px solid rgba(62,207,207,.3);color:#3ecfcf;font-weight:600;cursor:pointer;transition:all .15s}
.dd-placed-item:hover{background:rgba(239,68,68,.2);border-color:rgba(239,68,68,.3);color:#fca5a5}
.dd-drop-hint{font-size:8px;color:rgba(255,255,255,.2);font-style:italic}
`;
