// ═══════════════════════════════════════════════════════════════════════
// EXPORT SCRIPTS — All JavaScript for the exported standalone HTML
// ═══════════════════════════════════════════════════════════════════════

export function getJs(): string {
  return `
    // ── State ──
    let currentPage = 0;
    let totalPages = 0;

    // ── Init ──
    (function init() {
      const data = window.__EXPORT_DATA__;
      if (!data || !data.pages) { document.getElementById('canvas').innerHTML = '<div class="empty-page"><p>Data export tidak ditemukan.</p></div>'; return; }

      totalPages = data.pages.length;
      const ratioW = data.ratioW || 1280;
      const ratioH = data.ratioH || 720;

      // Render all pages
      const canvas = document.getElementById('canvas');
      canvas.style.width = ratioW + 'px';
      canvas.style.height = ratioH + 'px';
      canvas.innerHTML = data.pagesHtml.map((html, i) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        const page = div.firstElementChild;
        if (page) {
          page.classList.toggle('active', i === 0);
        }
        return div.innerHTML;
      }).join('');

      updateCounter();
      scaleCanvas();
      window.addEventListener('resize', scaleCanvas);
    })();

    // ── Navigation ──
    function goPage(idx) {
      if (idx < 0 || idx >= totalPages || idx === currentPage) return;
      const pages = document.querySelectorAll('.page');
      const direction = idx > currentPage ? 1 : -1;

      // Exit current
      pages[currentPage]?.classList.remove('active');
      pages[currentPage]?.classList.add(direction > 0 ? 'exit-left' : 'exit-right');

      // Enter new
      currentPage = idx;
      var liveEl = document.getElementById('a11y-live');
      if (liveEl) liveEl.textContent = 'Halaman ' + (idx+1) + ' dari ' + pages.length;
      pages[currentPage]?.classList.remove('exit-left', 'exit-right', 'enter-left', 'enter-right');
      pages[currentPage]?.classList.add(direction > 0 ? 'enter-right' : 'enter-left');

      // Trigger animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          pages[currentPage]?.classList.remove('enter-left', 'enter-right');
          pages[currentPage]?.classList.add('active');
          // Clean up old page after transition
          setTimeout(() => {
            pages.forEach((p, i) => {
              if (i !== currentPage) {
                p.classList.remove('exit-left', 'exit-right', 'active');
              }
            });
          }, 400);
        });
      });

      updateCounter();

      // Confetti on last page
      if (currentPage === totalPages - 1) {
        launchConfetti();
      }

      // SCORM: Report completion when reaching last page
      if (currentPage === totalPages - 1 && window.__SCORM) {
        window.__SCORM.reportComplete();
      }
    }

    function nextPage() { goPage(currentPage + 1); }
    function prevPage() { goPage(currentPage - 1); }

    function updateCounter() {
      const counter = document.getElementById('page-counter');
      if (counter) counter.textContent = (currentPage + 1) + '/' + totalPages;
    }

    // ── Scale canvas to fit viewport ──
    function scaleCanvas() {
      const container = document.getElementById('canvas-container');
      const canvas = document.getElementById('canvas');
      if (!container || !canvas) return;

      const aW = (container.clientWidth || 800) - 40;
      const aH = (container.clientHeight || 500) - 40;
      const cW = parseInt(canvas.style.width) || 1280;
      const cH = parseInt(canvas.style.height) || 720;
      const scale = Math.min(aW / cW, aH / cH, 1);

      canvas.style.transform = 'scale(' + scale + ')';
    }

    // ── Keyboard shortcuts ──
    document.addEventListener('keydown', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextPage(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevPage(); }
      if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
      if (e.key === 'Escape') { if (document.fullscreenElement) document.exitFullscreen(); }
    });

    // ── Touch/swipe ──
    let touchStartX = 0;
    document.addEventListener('touchstart', function(e) { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    document.addEventListener('touchend', function(e) {
      const dx = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) nextPage();
        else prevPage();
      }
    }, { passive: true });

    // ── Fullscreen ──
    function toggleFullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen().catch(function() {});
      }
    }

    // ── Kuis answer check ──
    var kuisCorrect = 0;
    var kuisTotal = 0;

    function checkAnswer(btn, qi, oi, ans) {
      const question = btn.closest('.kuis-question') || btn.closest('.roda-question');
      if (!question) return;

      const allBtns = question.querySelectorAll('.q-opt');
      // Disable all
      allBtns.forEach(function(b) { b.classList.add('disabled'); });

      // Mark correct/wrong
      kuisTotal++;
      if (oi === ans) {
        kuisCorrect++;
        btn.classList.add('correct');
        const fb = document.getElementById('qfb-' + qi);
        if (fb) fb.innerHTML = '<span style="color:#34d399;">✓ Benar!</span>';
      } else {
        btn.classList.add('wrong');
        allBtns[ans]?.classList.add('correct');
        const fb = document.getElementById('qfb-' + qi);
        if (fb) fb.innerHTML = '<span style="color:#ff6b6b;">✗ Salah. Jawaban benar: ' + String.fromCharCode(65 + ans) + '</span>';
      }
      // SCORM: Report score after each quiz answer
      if (window.__SCORM && kuisTotal > 0) {
        window.__SCORM.reportScore(kuisCorrect, kuisTotal);
      }
    }

    // ── Ftab switcher ──
    function switchFtab(tabId, idx) {
      var btns = document.querySelectorAll('#' + tabId + ' .ftab-btn');
      btns.forEach(function(b, i) { b.classList.toggle('active', i === idx); });

      var panels = document.querySelectorAll('[data-ftab="' + tabId + '"]');
      panels.forEach(function(p) { p.classList.toggle('active', parseInt(p.dataset.idx) === idx); });
    }

    // ── Confetti ──
    function launchConfetti() {
      var colors = ['#fbbf24', '#3ecfcf', '#34d399', '#a78bfa', '#ff6b6b', '#fb923c'];
      for (var i = 0; i < 40; i++) {
        var piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.cssText = 'left:' + (Math.random() * 100) + '%;top:-10px;width:' + (4 + Math.random() * 6) + 'px;height:' + (4 + Math.random() * 6) + 'px;background:' + colors[Math.floor(Math.random() * colors.length)] + ';border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';animation-duration:' + (1.5 + Math.random() * 2) + 's;animation-delay:' + (Math.random() * 0.5) + 's;';
        document.body.appendChild(piece);
        setTimeout(function(p) { p.remove(); }.bind(null, piece), 3500);
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // GAME: Memory Game
    // ═══════════════════════════════════════════════════════════════════
    var memFlipped = [];
    var memMatched = 0;

    function flipMemoryCard(card) {
      if (card.classList.contains('flipped') || card.classList.contains('matched') || memFlipped.length >= 2) return;
      card.classList.add('flipped');
      memFlipped.push(card);
      if (memFlipped.length === 2) {
        var c1 = memFlipped[0], c2 = memFlipped[1];
        var samePair = c1.dataset.pair === c2.dataset.pair && c1.dataset.side !== c2.dataset.side;
        if (samePair) {
          c1.classList.add('matched');
          c2.classList.add('matched');
          memMatched++;
          var block = card.closest('.memory-game-block');
          var game = block ? block.dataset.game : '';
          var scoreEl = document.getElementById('mem-score-' + game);
          var totalPairs = block ? block.querySelectorAll('.memory-card').length / 2 : 0;
          if (scoreEl) scoreEl.textContent = '👀 ' + memMatched + '/' + totalPairs + ' pasangan';
          if (memMatched >= totalPairs && totalPairs > 0) { launchConfetti(); if (scoreEl) scoreEl.textContent = '🎉 Semua pasangan ditemukan!'; }
          memFlipped = [];
        } else {
          setTimeout(function() {
            c1.classList.add('wrong'); c2.classList.add('wrong');
            setTimeout(function() {
              c1.classList.remove('flipped', 'wrong');
              c2.classList.remove('flipped', 'wrong');
              memFlipped = [];
            }, 600);
          }, 500);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // GAME: Matching Game
    // ═══════════════════════════════════════════════════════════════════
    var matchSelectedLeft = null;
    var matchCorrect = 0;

    function selectMatchLeft(btn) {
      if (btn.classList.contains('matched-correct')) return;
      document.querySelectorAll('.match-left.selected').forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      matchSelectedLeft = btn;
    }

    function selectMatchRight(btn) {
      if (!matchSelectedLeft || btn.classList.contains('matched-correct')) return;
      if (btn.classList.contains('matched-correct')) return;
      var leftIdx = matchSelectedLeft.dataset.idx;
      var rightIdx = btn.dataset.idx;
      if (leftIdx === rightIdx) {
        matchSelectedLeft.classList.remove('selected');
        matchSelectedLeft.classList.add('matched-correct');
        btn.classList.add('matched-correct');
        matchCorrect++;
        matchSelectedLeft = null;
        var block = btn.closest('.matching-game-block');
        var game = block ? block.dataset.game : '';
        var scoreEl = document.getElementById('match-score-' + game);
        var total = block ? block.querySelectorAll('.match-left').length : 0;
        if (scoreEl) scoreEl.textContent = '🔗 ' + matchCorrect + '/' + total + ' cocok';
        if (matchCorrect >= total && total > 0) { launchConfetti(); if (scoreEl) scoreEl.textContent = '🎉 Semua cocok!'; }
      } else {
        matchSelectedLeft.classList.remove('selected');
        matchSelectedLeft.classList.add('matched-wrong');
        btn.classList.add('matched-wrong');
        var ml = matchSelectedLeft, mr = btn;
        setTimeout(function() { ml.classList.remove('matched-wrong'); mr.classList.remove('matched-wrong'); }, 500);
        matchSelectedLeft = null;
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // GAME: Fill-in-the-Blank
    // ═══════════════════════════════════════════════════════════════════
    function checkFillBlank(input) {
      var userAns = input.value.trim().toLowerCase();
      var correctAns = input.dataset.answer.toLowerCase();
      // Support multiple accepted answers separated by /
      var accepted = correctAns.split('/');
      if (accepted.some(function(a) { return a.trim() === userAns; })) {
        input.classList.add('correct');
        input.classList.remove('wrong');
      } else {
        input.classList.add('wrong');
        input.classList.remove('correct');
      }
    }

    function checkAllFillBlanks(fbId) {
      var inputs = document.querySelectorAll('.fb-input[data-game="' + fbId + '"]');
      var correct = 0;
      inputs.forEach(function(input) {
        checkFillBlank(input);
        if (input.classList.contains('correct')) correct++;
      });
      if (correct === inputs.length && inputs.length > 0) launchConfetti();
    }

    // ═══════════════════════════════════════════════════════════════════
    // GAME: Word Search
    // ═══════════════════════════════════════════════════════════════════
    var wsSelectedCells = [];
    var wsFoundWords = [];

    function toggleWsCell(cell) {
      cell.classList.toggle('selected');
      if (cell.classList.contains('selected')) {
        wsSelectedCells.push(cell);
      } else {
        wsSelectedCells = wsSelectedCells.filter(function(c) { return c !== cell; });
      }
      // Check if selected cells form a word
      var game = cell.dataset.game;
      var wordEls = document.querySelectorAll('.ws-word[data-game="' + game + '"]');
      var selectedText = wsSelectedCells.map(function(c) { return c.textContent; }).join('');
      var selectedReverse = wsSelectedCells.map(function(c) { return c.textContent; }).reverse().join('');
      wordEls.forEach(function(we) {
        var word = we.dataset.word;
        if ((selectedText === word || selectedReverse === word) && wsFoundWords.indexOf(word) === -1) {
          wsFoundWords.push(word);
          we.classList.add('found');
          wsSelectedCells.forEach(function(c) { c.classList.remove('selected'); c.classList.add('found'); });
          wsSelectedCells = [];
          if (wsFoundWords.length === wordEls.length) launchConfetti();
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // GAME: True/False
    // ═══════════════════════════════════════════════════════════════════
    var tfCorrect = 0;
    var tfTotal = 0;

    function checkTrueFalse(btn, userAnswer) {
      var correct = btn.dataset.correct === 'true';
      var idx = btn.dataset.idx;
      var game = btn.dataset.game;
      var qEl = document.getElementById('tf-q-' + game + '-' + idx);
      if (!qEl) return;
      var btns = qEl.querySelectorAll('.tf-btn');
      btns.forEach(function(b) { b.classList.add('disabled'); });
      if (userAnswer === correct) {
        btn.classList.add('correct-answer');
        var fb = document.getElementById('tf-fb-' + game + '-' + idx);
        if (fb) fb.innerHTML = '<span style="color:#34d399;">✓ Benar!</span>';
        tfCorrect++;
      } else {
        btn.classList.add('wrong-answer');
        btns.forEach(function(b) { if (b.dataset.correct === String(!userAnswer) || (correct && b.classList.contains('tf-true')) || (!correct && b.classList.contains('tf-false'))) b.classList.add('correct-answer'); });
        var fb = document.getElementById('tf-fb-' + game + '-' + idx);
        if (fb) fb.innerHTML = '<span style="color:#ff6b6b;">✗ Salah. Jawaban: ' + (correct ? 'Benar' : 'Salah') + '</span>';
      }
      tfTotal++;
      if (tfTotal >= document.querySelectorAll('.tf-question').length) {
        if (tfCorrect >= tfTotal * 0.8) launchConfetti();
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // GAME: Drag & Drop
    // ═══════════════════════════════════════════════════════════════════
    var draggedItem = null;

    function dragStart(e) {
      draggedItem = e.target;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', e.target.id);
    }

    function touchDragStart(e, el) {
      draggedItem = el;
    }

    function dropItem(e, ddId) {
      e.preventDefault();
      e.currentTarget.classList.remove('dd-hover');
      if (!draggedItem) return;
      var targetItems = e.currentTarget.querySelector('.dd-target-items');
      if (targetItems) {
        targetItems.appendChild(draggedItem);
      }
      draggedItem = null;
    }

    function checkDragDrop(ddId) {
      var targets = document.querySelectorAll('.dd-target[data-game="' + ddId + '"]');
      var correct = 0;
      var total = 0;
      targets.forEach(function(target) {
        var tid = target.dataset.tid;
        var items = target.querySelectorAll('.dd-item');
        items.forEach(function(item) {
          total++;
          if (item.dataset.target === tid) {
            item.classList.add('correct');
            correct++;
          } else {
            item.classList.add('wrong');
          }
        });
      });
      // Also check pool items (not yet placed)
      var poolItems = document.querySelectorAll('#dd-pool-' + ddId + ' .dd-item');
      poolItems.forEach(function(item) { total++; item.classList.add('wrong'); });
      if (correct === total && total > 0) launchConfetti();
    }

    // ═══════════════════════════════════════════════════════════════════
    // GAME: Crossword
    // ═══════════════════════════════════════════════════════════════════
    function cwInput(input, cwId) {
      var val = input.value.toUpperCase();
      input.value = val;
      if (val.length === 1) {
        // Auto-advance to next input
        var r = parseInt(input.dataset.r);
        var c = parseInt(input.dataset.c);
        var next = document.querySelector('.cw-input[data-r="' + r + '"][data-c="' + (c + 1) + '"][data-game="' + cwId + '"]');
        if (next) next.focus();
      }
    }

    function cwKeyDown(e, input, cwId) {
      var r = parseInt(input.dataset.r);
      var c = parseInt(input.dataset.c);
      if (e.key === 'Backspace' && !input.value) {
        var prev = document.querySelector('.cw-input[data-r="' + r + '"][data-c="' + (c - 1) + '"][data-game="' + cwId + '"]');
        if (prev) { prev.focus(); prev.value = ''; }
      } else if (e.key === 'ArrowRight') {
        var next = document.querySelector('.cw-input[data-r="' + r + '"][data-c="' + (c + 1) + '"][data-game="' + cwId + '"]');
        if (next) next.focus();
      } else if (e.key === 'ArrowLeft') {
        var prev = document.querySelector('.cw-input[data-r="' + r + '"][data-c="' + (c - 1) + '"][data-game="' + cwId + '"]');
        if (prev) prev.focus();
      } else if (e.key === 'ArrowDown') {
        var next = document.querySelector('.cw-input[data-r="' + (r + 1) + '"][data-c="' + c + '"][data-game="' + cwId + '"]');
        if (next) next.focus();
      } else if (e.key === 'ArrowUp') {
        var prev = document.querySelector('.cw-input[data-r="' + (r - 1) + '"][data-c="' + c + '"][data-game="' + cwId + '"]');
        if (prev) prev.focus();
      }
    }

    function checkCrossword(cwId) {
      var inputs = document.querySelectorAll('.cw-input[data-game="' + cwId + '"]');
      var correct = 0;
      var total = 0;
      inputs.forEach(function(input) {
        total++;
        var cell = input.closest('.cw-cell');
        if (cell && input.value.toUpperCase() === cell.dataset.answer) {
          input.classList.add('correct');
          input.classList.remove('wrong');
          correct++;
        } else {
          input.classList.add('wrong');
          input.classList.remove('correct');
        }
      });
      if (correct === total && total > 0) launchConfetti();
    }

    // ═══════════════════════════════════════════════════════════════════
    // GAME: Team Buzzer
    // ═══════════════════════════════════════════════════════════════════
    var tbScoreA = 0;
    var tbScoreB = 0;

    function buzzTeam(tbId, team, qIdx, poin) {
      var qEl = document.getElementById('tb-q-' + tbId + '-' + qIdx);
      if (!qEl || qEl.classList.contains('answered')) return;
      qEl.classList.add('answered');
      if (team === 'a') {
        tbScoreA += poin;
        var sA = document.getElementById('tb-score-a-' + tbId);
        if (sA) sA.textContent = tbScoreA;
      } else {
        tbScoreB += poin;
        var sB = document.getElementById('tb-score-b-' + tbId);
        if (sB) sB.textContent = tbScoreB;
      }
    }

    function skipQuestion(tbId, qIdx) {
      var qEl = document.getElementById('tb-q-' + tbId + '-' + qIdx);
      if (qEl) qEl.classList.add('answered');
    }

    // ═══════════════════════════════════════════════════════════════════
    // GAME: Sortir (Drag-to-category)
    // ═══════════════════════════════════════════════════════════════════
    function checkSortir(sortirId) {
      var koloms = document.querySelectorAll('.sortir-kolom[data-game="' + sortirId + '"]');
      var correct = 0;
      var total = 0;
      koloms.forEach(function(kolom) {
        var kid = kolom.dataset.kid;
        var items = kolom.querySelectorAll('.sortir-item');
        items.forEach(function(item) {
          total++;
          if (item.dataset.category === kid) {
            item.classList.add('correct');
            correct++;
          } else {
            item.classList.add('wrong');
          }
        });
      });
      // Also check pool for unsorted items
      var poolItems = document.querySelectorAll('.sortir-pool[data-game="' + sortirId + '"] .sortir-item');
      poolItems.forEach(function(item) { total++; item.classList.add('wrong'); });
      if (correct === total && total > 0) launchConfetti();
      var scoreEl = document.getElementById('sortir-score-' + sortirId);
      if (scoreEl) scoreEl.textContent = correct + '/' + total + ' benar';
    }

    // ═══════════════════════════════════════════════════════════════════
    // GAME: True/False — Final score display
    // ═══════════════════════════════════════════════════════════════════
    function checkTrueFalseScore(tfId) {
      var questions = document.querySelectorAll('.tf-question[data-game="' + tfId + '"]');
      var correct = 0;
      var total = questions.length;
      questions.forEach(function(q) {
        if (q.querySelector('.correct-answer')) correct++;
      });
      var scoreEl = document.getElementById('tf-score-' + tfId);
      if (scoreEl) scoreEl.textContent = correct + '/' + total + ' benar';
      if (correct >= total * 0.8 && total > 0) launchConfetti();
    }
  `;
}
