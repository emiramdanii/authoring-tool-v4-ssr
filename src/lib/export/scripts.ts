// ═══════════════════════════════════════════════════════════════════════
// EXPORT SCRIPTS — All JavaScript for the exported standalone HTML
// Sprint 6.4-C: Step-reveal flow + completion screen + replay
// Sprint 6.4-E1-Patch: Close XSS — all feedback uses textContent, no innerHTML with user content
// Sprint 6.4-E1-Patch-2: Non-scorable TF questions — invalid correct values give neutral feedback
// ═══════════════════════════════════════════════════════════════════════

export function getJs(): string {
  return `
    // ── State ──
    let currentPage = 0;
    let totalPages = 0;

    // ── Quiz state (per-block, isolated) ──
    var quizState = {};   // keyed by blockId: { correct, total, currentStep, totalSteps, completed }
    var tfState = {};     // keyed by gameId:  { correct, total, currentStep, totalSteps, completed }
    var fbState = {};     // keyed by gameId:  { checked, completed }

    // ── Safe feedback helper (Sprint 6.4-E1-Patch) ──
    // NEVER use innerHTML with user-controlled content.
    // This helper builds DOM nodes safely — textContent is immune to XSS.
    function setFeedback(el, icon, color, message, strongText) {
      if (!el) return;
      el.textContent = '';
      var span = document.createElement('span');
      span.style.color = color;
      span.textContent = icon + ' ' + message;
      if (strongText) {
        var strong = document.createElement('strong');
        strong.textContent = String(strongText);
        span.appendChild(strong);
      }
      el.appendChild(span);
    }

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

      // Initialize quiz step states
      document.querySelectorAll('.kuis-block').forEach(function(block) {
        var blockId = block.dataset.blockId;
        var total = parseInt(block.dataset.total) || 0;
        quizState[blockId] = { correct: 0, total: 0, currentStep: 0, totalSteps: total, completed: false };
        showKuisStep(blockId, 0);
      });
      document.querySelectorAll('.true-false-block').forEach(function(block) {
        var gameId = block.dataset.game;
        var total = parseInt(block.dataset.total) || 0;
        tfState[gameId] = { correct: 0, total: 0, currentStep: 0, totalSteps: total, completed: false };
        showTFStep(gameId, 0);
      });
      document.querySelectorAll('.fill-blank-game-block').forEach(function(block) {
        var gameId = block.dataset.game;
        fbState[gameId] = { checked: false, completed: false };
      });

      updateCounter();
      scaleCanvas();
      window.addEventListener('resize', scaleCanvas);
    })();

    // ── Navigation ──
    function goPage(idx) {
      if (idx < 0 || idx >= totalPages || idx === currentPage) return;
      const pages = document.querySelectorAll('.page');
      const direction = idx > currentPage ? 1 : -1;

      // Reset quiz state on the page being left
      resetPageQuizState(pages[currentPage]);

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

    // ═══════════════════════════════════════════════════════════════════
    // KUIS: Step-reveal answer check
    // ═══════════════════════════════════════════════════════════════════
    function checkAnswer(btn, qi, oi, ans) {
      var question = btn.closest('.kuis-question') || btn.closest('.roda-question');
      if (!question) return;

      // Guard: already answered — prevent double scoring
      if (question.dataset.answered === 'true') return;
      question.dataset.answered = 'true';

      var block = btn.closest('.kuis-block');
      var blockId = block ? block.dataset.blockId : '';
      if (!quizState[blockId]) return;
      var st = quizState[blockId];

      var allBtns = question.querySelectorAll('.q-opt');
      // Disable all
      allBtns.forEach(function(b) { b.classList.add('disabled'); });

      // Mark correct/wrong
      st.total++;
      if (oi === ans) {
        st.correct++;
        btn.classList.add('correct');
        var fb = question.querySelector('.q-feedback');
        setFeedback(fb, '✓', '#34d399', 'Benar!');
      } else {
        btn.classList.add('wrong');
        if (allBtns[ans]) allBtns[ans].classList.add('correct');
        var fb = question.querySelector('.q-feedback');
        setFeedback(fb, '✗', '#ff6b6b', 'Salah. Jawaban benar: ' + String.fromCharCode(65 + ans));
      }

      // Show explanation if present
      var exEl = question.querySelector('.q-explanation');
      if (exEl && exEl.textContent.trim()) {
        exEl.style.display = 'block';
      }

      // Show next button (or completion)
      var nextBtn = question.querySelector('.q-next-btn');
      if (st.currentStep >= st.totalSteps - 1) {
        // Last question — next button triggers completion
        if (nextBtn) {
          nextBtn.textContent = 'Lihat Hasil →';
          nextBtn.style.display = 'block';
          nextBtn.onclick = function() { showKuisCompletion(blockId); };
        }
      } else {
        if (nextBtn) nextBtn.style.display = 'block';
      }

      // SCORM: Report score after each quiz answer
      if (window.__SCORM && st.total > 0) {
        window.__SCORM.reportScore(st.correct, st.total);
      }
    }

    // ── Kuis step navigation ──
    function nextKuisStep(blockId, currentIdx) {
      if (!quizState[blockId]) return;
      var nextIdx = currentIdx + 1;
      quizState[blockId].currentStep = nextIdx;
      showKuisStep(blockId, nextIdx);
    }

    function showKuisStep(blockId, idx) {
      var block = document.querySelector('.kuis-block[data-block-id="' + blockId + '"]');
      if (!block) return;
      var steps = block.querySelectorAll('.kuis-step');
      var activeStep = null;
      steps.forEach(function(step, i) {
        if (i === idx) {
          step.classList.add('step-active');
          activeStep = step;
        } else {
          step.classList.remove('step-active');
        }
      });
      // Update progress
      var total = quizState[blockId] ? quizState[blockId].totalSteps : steps.length;
      var pfill = document.getElementById('kuis-pfill-' + blockId);
      var ptext = document.getElementById('kuis-ptext-' + blockId);
      var pbar = document.getElementById('kuis-pbar-' + blockId);
      if (pfill) pfill.style.width = Math.round(((idx + 1) / total) * 100) + '%';
      if (ptext) ptext.textContent = 'Soal ' + (idx + 1) + ' dari ' + total;
      // Update ARIA progressbar semantics
      if (pbar) {
        pbar.setAttribute('aria-valuenow', String(idx + 1));
        pbar.setAttribute('aria-valuetext', 'Soal ' + (idx + 1) + ' dari ' + total);
      }
      // Focus management: move focus to active step container
      if (activeStep) {
        requestAnimationFrame(function() {
          activeStep.focus();
        });
      }
    }

    function showKuisCompletion(blockId) {
      if (!quizState[blockId]) return;
      quizState[blockId].completed = true;
      var st = quizState[blockId];
      var block = document.querySelector('.kuis-block[data-block-id="' + blockId + '"]');
      if (!block) return;

      // Hide all steps and progress
      block.querySelectorAll('.kuis-step').forEach(function(s) { s.classList.remove('step-active'); });
      var progress = document.getElementById('kuis-progress-' + blockId);
      if (progress) progress.style.display = 'none';

      // Show completion
      var done = document.getElementById('kuis-done-' + blockId);
      if (done) done.style.display = 'block';

      var pct = st.totalSteps > 0 ? Math.round((st.correct / st.totalSteps) * 100) : 0;
      var iconEl = document.getElementById('kuis-done-icon-' + blockId);
      var titleEl = document.getElementById('kuis-done-title-' + blockId);
      var scoreEl = document.getElementById('kuis-done-score-' + blockId);
      var msgEl = document.getElementById('kuis-done-msg-' + blockId);

      if (iconEl) iconEl.textContent = pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📚';
      if (titleEl) titleEl.textContent = pct >= 80 ? 'Luar Biasa!' : pct >= 50 ? 'Bagus!' : 'Terus Belajar!';
      if (scoreEl) scoreEl.textContent = st.correct + ' dari ' + st.totalSteps + ' benar (' + pct + '%)';
      if (msgEl) msgEl.textContent = pct >= 80 ? 'Kamu menguasai materi ini!' : pct >= 50 ? 'Coba lagi untuk hasil lebih baik!' : 'Jangan menyerah, coba lagi ya!';

      if (pct >= 80) launchConfetti();

      // Focus management: move focus to completion screen
      if (done) {
        requestAnimationFrame(function() {
          done.focus();
        });
      }

      // SCORM
      if (window.__SCORM) {
        window.__SCORM.reportScore(st.correct, st.totalSteps);
      }
    }



    function replayKuis(blockId) {
      if (!quizState[blockId]) return;
      quizState[blockId] = { correct: 0, total: 0, currentStep: 0, totalSteps: quizState[blockId].totalSteps, completed: false };

      var block = document.querySelector('.kuis-block[data-block-id="' + blockId + '"]');
      if (!block) return;

      // Hide completion
      var done = document.getElementById('kuis-done-' + blockId);
      if (done) done.style.display = 'none';

      // Show progress
      var progress = document.getElementById('kuis-progress-' + blockId);
      if (progress) progress.style.display = '';

      // Reset all questions
      block.querySelectorAll('.kuis-question').forEach(function(q) {
        q.dataset.answered = 'false';
        var fb = q.querySelector('.q-feedback');
        if (fb) fb.innerHTML = '';
        var ex = q.querySelector('.q-explanation');
        if (ex) ex.style.display = 'none';
        var nextBtn = q.querySelector('.q-next-btn');
        if (nextBtn) {
          nextBtn.style.display = 'none';
          nextBtn.textContent = 'Lanjut →';
          // Restore onclick
          var idx = parseInt(q.dataset.idx);
          nextBtn.onclick = function() { nextKuisStep(blockId, idx); };
        }
        q.querySelectorAll('.q-opt').forEach(function(b) {
          b.classList.remove('disabled', 'correct', 'wrong');
        });
      });

      // Show first step (which also moves focus)
      showKuisStep(blockId, 0);
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
    // GAME: Fill-in-the-Blank (with completion screen + replay)
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
      var block = document.querySelector('.fill-blank-game-block[data-game="' + fbId + '"]');
      if (!block || block.dataset.checked === 'true') return;
      block.dataset.checked = 'true';

      var inputs = block.querySelectorAll('.fb-input');
      var correct = 0;
      inputs.forEach(function(input) {
        checkFillBlank(input);
        if (input.classList.contains('correct')) correct++;
        // Show per-question feedback
        var idx = input.dataset.idx;
        var fb = document.getElementById('fb-fb-' + fbId + '-' + idx);
        if (fb) {
          if (input.classList.contains('correct')) {
            setFeedback(fb, '✓', '#34d399', 'Benar!');
          } else {
            // P0 FIX: input.dataset.answer is user-controlled content.
            // DOM auto-decodes HTML entities in data attributes,
            // so innerHTML would execute <img onerror> payloads.
            // textContent is immune to XSS.
            setFeedback(fb, '✗', '#ff6b6b', 'Salah. Jawaban: ', input.dataset.answer);
          }
        }
      });

      var total = inputs.length;
      fbState[fbId] = { checked: true, completed: true, correct: correct, total: total };

      // Show completion screen
      var done = document.getElementById('fb-done-' + fbId);
      if (done) done.style.display = 'block';

      // Focus management: move focus to completion screen
      if (done) {
        requestAnimationFrame(function() {
          done.focus();
        });
      }

      // Hide check button
      var checkBtn = block.querySelector('.game-check-btn');
      if (checkBtn) checkBtn.style.display = 'none';

      var pct = total > 0 ? Math.round((correct / total) * 100) : 0;
      var iconEl = document.getElementById('fb-done-icon-' + fbId);
      var titleEl = document.getElementById('fb-done-title-' + fbId);
      var scoreEl = document.getElementById('fb-done-score-' + fbId);
      var msgEl = document.getElementById('fb-done-msg-' + fbId);

      if (iconEl) iconEl.textContent = pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📚';
      if (titleEl) titleEl.textContent = pct >= 80 ? 'Luar Biasa!' : pct >= 50 ? 'Bagus!' : 'Terus Belajar!';
      if (scoreEl) scoreEl.textContent = correct + ' dari ' + total + ' benar (' + pct + '%)';
      if (msgEl) msgEl.textContent = pct >= 80 ? 'Kamu menguasai materi ini!' : pct >= 50 ? 'Coba lagi untuk hasil lebih baik!' : 'Jangan menyerah, coba lagi ya!';

      if (pct >= 80) launchConfetti();
    }

    function replayFB(fbId) {
      var block = document.querySelector('.fill-blank-game-block[data-game="' + fbId + '"]');
      if (!block) return;

      fbState[fbId] = { checked: false, completed: false };
      block.dataset.checked = 'false';

      // Hide completion
      var done = document.getElementById('fb-done-' + fbId);
      if (done) done.style.display = 'none';

      // Show check button
      var checkBtn = block.querySelector('.game-check-btn');
      if (checkBtn) checkBtn.style.display = '';

      // Reset inputs
      var firstInput = null;
      block.querySelectorAll('.fb-input').forEach(function(input, i) {
        input.value = '';
        input.classList.remove('correct', 'wrong');
        if (i === 0) firstInput = input;
      });
      block.querySelectorAll('.fb-feedback').forEach(function(fb) { fb.innerHTML = ''; });

      // Focus management: move focus to first input
      if (firstInput) {
        requestAnimationFrame(function() {
          firstInput.focus();
        });
      }
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
    // GAME: True/False (step-reveal, anti-double-score, explanation)
    // Sprint 6.4-E1-Patch-2: Non-scorable support — invalid correct
    //   values are marked data-scorable="false" in the HTML. The check
    //   function detects this and gives neutral feedback without scoring.
    // ═══════════════════════════════════════════════════════════════════
    function checkTrueFalse(btn, userAnswer) {
      var idx = btn.dataset.idx;
      var game = btn.dataset.game;
      var qEl = document.getElementById('tf-q-' + game + '-' + idx);
      if (!qEl) return;

      // Guard: already answered — prevent double scoring
      if (qEl.dataset.answered === 'true') return;
      qEl.dataset.answered = 'true';

      if (!tfState[game]) return;
      var st = tfState[game];

      var btns = qEl.querySelectorAll('.tf-btn');
      btns.forEach(function(b) { b.classList.add('disabled'); });

      // Non-scorable question: no valid correct answer
      var isScorable = btn.dataset.scorable !== 'false';
      if (!isScorable) {
        var fb = qEl.querySelector('.tf-feedback');
        setFeedback(fb, '⚠', '#fbbf24', 'Soal ini tidak dapat dinilai (kunci jawaban tidak valid).');
        // Don't update st.correct or st.total — skip scoring entirely
      } else {
        var correct = btn.dataset.correct === 'true';
        if (userAnswer === correct) {
          btn.classList.add('correct-answer');
          var fb = qEl.querySelector('.tf-feedback');
          setFeedback(fb, '✓', '#34d399', 'Benar!');
          st.correct++;
        } else {
          btn.classList.add('wrong-answer');
          btns.forEach(function(b) {
            if ((correct && b.classList.contains('tf-true')) || (!correct && b.classList.contains('tf-false'))) b.classList.add('correct-answer');
          });
          var fb = qEl.querySelector('.tf-feedback');
          setFeedback(fb, '✗', '#ff6b6b', 'Salah. Jawaban: ' + (correct ? 'Benar' : 'Salah'));
        }
        st.total++;
      }

      // Show explanation if present
      var exEl = qEl.querySelector('.tf-explanation');
      if (exEl && exEl.textContent.trim()) {
        exEl.style.display = 'block';
      }

      // Show next button (or completion)
      var nextBtn = qEl.querySelector('.tf-next-btn');
      if (st.currentStep >= st.totalSteps - 1) {
        // Last question
        if (nextBtn) {
          nextBtn.textContent = 'Lihat Hasil →';
          nextBtn.style.display = 'block';
          nextBtn.onclick = function() { showTFCompletion(game); };
        }
      } else {
        if (nextBtn) nextBtn.style.display = 'block';
      }
    }

    // ── TF step navigation ──
    function nextTFStep(gameId, currentIdx) {
      if (!tfState[gameId]) return;
      var nextIdx = currentIdx + 1;
      tfState[gameId].currentStep = nextIdx;
      showTFStep(gameId, nextIdx);
    }

    function showTFStep(gameId, idx) {
      var block = document.querySelector('.true-false-block[data-game="' + gameId + '"]');
      if (!block) return;
      var steps = block.querySelectorAll('.tf-step');
      var activeStep = null;
      steps.forEach(function(step, i) {
        if (i === idx) {
          step.classList.add('step-active');
          activeStep = step;
        } else {
          step.classList.remove('step-active');
        }
      });
      // Update progress
      var total = tfState[gameId] ? tfState[gameId].totalSteps : steps.length;
      var pfill = document.getElementById('tf-pfill-' + gameId);
      var ptext = document.getElementById('tf-ptext-' + gameId);
      var pbar = document.getElementById('tf-pbar-' + gameId);
      if (pfill) pfill.style.width = Math.round(((idx + 1) / total) * 100) + '%';
      if (ptext) ptext.textContent = 'Soal ' + (idx + 1) + ' dari ' + total;
      // Update ARIA progressbar semantics
      if (pbar) {
        pbar.setAttribute('aria-valuenow', String(idx + 1));
        pbar.setAttribute('aria-valuetext', 'Soal ' + (idx + 1) + ' dari ' + total);
      }
      // Focus management: move focus to active step container
      if (activeStep) {
        requestAnimationFrame(function() {
          activeStep.focus();
        });
      }
    }

    function showTFCompletion(gameId) {
      if (!tfState[gameId]) return;
      tfState[gameId].completed = true;
      var st = tfState[gameId];
      var block = document.querySelector('.true-false-block[data-game="' + gameId + '"]');
      if (!block) return;

      // Hide all steps and progress
      block.querySelectorAll('.tf-step').forEach(function(s) { s.classList.remove('step-active'); });
      var progress = document.getElementById('tf-progress-' + gameId);
      if (progress) progress.style.display = 'none';

      // Show completion
      var done = document.getElementById('tf-done-' + gameId);
      if (done) done.style.display = 'block';

      var pct = st.totalSteps > 0 ? Math.round((st.correct / st.totalSteps) * 100) : 0;
      var iconEl = document.getElementById('tf-done-icon-' + gameId);
      var titleEl = document.getElementById('tf-done-title-' + gameId);
      var scoreEl = document.getElementById('tf-done-score-' + gameId);
      var msgEl = document.getElementById('tf-done-msg-' + gameId);

      if (iconEl) iconEl.textContent = pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📚';
      if (titleEl) titleEl.textContent = pct >= 80 ? 'Luar Biasa!' : pct >= 50 ? 'Bagus!' : 'Terus Belajar!';
      if (scoreEl) scoreEl.textContent = st.correct + ' dari ' + st.totalSteps + ' benar (' + pct + '%)';
      if (msgEl) msgEl.textContent = pct >= 80 ? 'Kamu menguasai materi ini!' : pct >= 50 ? 'Coba lagi untuk hasil lebih baik!' : 'Jangan menyerah, coba lagi ya!';

      if (pct >= 80) launchConfetti();

      // Focus management: move focus to completion screen
      if (done) {
        requestAnimationFrame(function() {
          done.focus();
        });
      }
    }

    function replayTF(gameId) {
      if (!tfState[gameId]) return;
      tfState[gameId] = { correct: 0, total: 0, currentStep: 0, totalSteps: tfState[gameId].totalSteps, completed: false };

      var block = document.querySelector('.true-false-block[data-game="' + gameId + '"]');
      if (!block) return;

      // Hide completion
      var done = document.getElementById('tf-done-' + gameId);
      if (done) done.style.display = 'none';

      // Show progress
      var progress = document.getElementById('tf-progress-' + gameId);
      if (progress) progress.style.display = '';

      // Reset all questions
      block.querySelectorAll('.tf-question').forEach(function(q) {
        q.dataset.answered = 'false';
        var fb = q.querySelector('.tf-feedback');
        if (fb) fb.innerHTML = '';
        var ex = q.querySelector('.tf-explanation');
        if (ex) ex.style.display = 'none';
        var nextBtn = q.querySelector('.tf-next-btn');
        if (nextBtn) {
          nextBtn.style.display = 'none';
          nextBtn.textContent = 'Lanjut →';
          var idx = parseInt(q.dataset.idx);
          nextBtn.onclick = function() { nextTFStep(gameId, idx); };
        }
        q.querySelectorAll('.tf-btn').forEach(function(b) {
          b.classList.remove('disabled', 'correct-answer', 'wrong-answer');
        });
      });

      // Show first step (which also moves focus)
      showTFStep(gameId, 0);
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
    // QUIZ RESET — Per-block state reset on page navigation
    // ═══════════════════════════════════════════════════════════════════
    function resetQuizBlock(block) {
      var blockId = block.dataset.blockId;
      var total = parseInt(block.dataset.total) || 0;
      quizState[blockId] = { correct: 0, total: 0, currentStep: 0, totalSteps: total, completed: false };

      // Hide completion
      var done = document.getElementById('kuis-done-' + blockId);
      if (done) done.style.display = 'none';

      // Show progress
      var progress = document.getElementById('kuis-progress-' + blockId);
      if (progress) progress.style.display = '';

      // Reset all questions
      block.querySelectorAll('.kuis-question').forEach(function(q) {
        q.dataset.answered = 'false';
        var fb = q.querySelector('.q-feedback');
        if (fb) fb.innerHTML = '';
        var ex = q.querySelector('.q-explanation');
        if (ex) ex.style.display = 'none';
        var nextBtn = q.querySelector('.q-next-btn');
        if (nextBtn) {
          nextBtn.style.display = 'none';
          nextBtn.textContent = 'Lanjut →';
          var idx = parseInt(q.dataset.idx);
          nextBtn.onclick = function() { nextKuisStep(blockId, idx); };
        }
        q.querySelectorAll('.q-opt').forEach(function(b) {
          b.classList.remove('disabled', 'correct', 'wrong');
        });
      });

      // Show first step
      showKuisStep(blockId, 0);
    }

    function resetTFBlock(block) {
      var gameId = block.dataset.game;
      var total = parseInt(block.dataset.total) || 0;
      tfState[gameId] = { correct: 0, total: 0, currentStep: 0, totalSteps: total, completed: false };

      // Hide completion
      var done = document.getElementById('tf-done-' + gameId);
      if (done) done.style.display = 'none';

      // Show progress
      var progress = document.getElementById('tf-progress-' + gameId);
      if (progress) progress.style.display = '';

      // Reset all questions
      block.querySelectorAll('.tf-question').forEach(function(q) {
        q.dataset.answered = 'false';
        var fb = q.querySelector('.tf-feedback');
        if (fb) fb.innerHTML = '';
        var ex = q.querySelector('.tf-explanation');
        if (ex) ex.style.display = 'none';
        var nextBtn = q.querySelector('.tf-next-btn');
        if (nextBtn) {
          nextBtn.style.display = 'none';
          nextBtn.textContent = 'Lanjut →';
          var idx = parseInt(q.dataset.idx);
          nextBtn.onclick = function() { nextTFStep(gameId, idx); };
        }
        q.querySelectorAll('.tf-btn').forEach(function(b) {
          b.classList.remove('disabled', 'correct-answer', 'wrong-answer');
        });
      });

      // Show first step
      showTFStep(gameId, 0);
    }

    function resetFBBlock(block) {
      var gameId = block.dataset.game;
      fbState[gameId] = { checked: false, completed: false };
      block.dataset.checked = 'false';

      // Hide completion
      var done = document.getElementById('fb-done-' + gameId);
      if (done) done.style.display = 'none';

      // Show check button
      var checkBtn = block.querySelector('.game-check-btn');
      if (checkBtn) checkBtn.style.display = '';

      // Reset inputs
      block.querySelectorAll('.fb-input').forEach(function(input) {
        input.value = '';
        input.classList.remove('correct', 'wrong');
      });
      block.querySelectorAll('.fb-feedback').forEach(function(fb) { fb.innerHTML = ''; });
    }

    function resetPageQuizState(pageEl) {
      if (!pageEl) return;
      pageEl.querySelectorAll('.kuis-block').forEach(resetQuizBlock);
      pageEl.querySelectorAll('.true-false-block').forEach(resetTFBlock);
      pageEl.querySelectorAll('.fill-blank-game-block').forEach(resetFBBlock);
    }
  `;
}
