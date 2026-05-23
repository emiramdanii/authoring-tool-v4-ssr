// ═══════════════════════════════════════════════════════════════════════
// GAME RENDERERS — Interactive game block HTML rendering for export
// ═══════════════════════════════════════════════════════════════════════
// Handles: sortir-game, roda-game, memory-game, matching-game,
//          word-search-game, drag-drop-game, crossword-game,
//          team-buzzer-game
// ═══════════════════════════════════════════════════════════════════════

import { escapeHtml, resolveColor, type RenderBlockFn } from './utils';

/**
 * Render a game block. Returns null if the block type is not handled here.
 */
export function renderGameBlock(
  type: string,
  b: Record<string, unknown>,
  _renderBlock: RenderBlockFn,
): string | null {
  switch (type) {
    case 'sortir-game': return renderSortirGame(b);
    case 'roda-game': return renderRodaGame(b);
    case 'memory-game': return renderMemoryGame(b);
    case 'matching-game': return renderMatchingGame(b);
    case 'word-search-game': return renderWordSearchGame(b);
    case 'drag-drop-game': return renderDragDropGame(b);
    case 'crossword-game': return renderCrosswordGame(b);
    case 'team-buzzer-game': return renderTeamBuzzerGame(b);
    default: return null;
  }
}

function renderSortirGame(b: Record<string, unknown>): string {
  const title = b.title as string || 'Game Sortir';
  const pool = (b.pool as Array<{ id: string; text: string; category: string }>) || [];
  const kolom = (b.kolom as Array<{ id: string; label: string; color: string }>) || [];
  return `
    <div class="block sortir-block">
      <div class="block-header">
        <span class="block-icon">🔄</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="sortir-pool">
        ${pool.map(p => `<span class="sortir-item" draggable="true" data-cat="${escapeHtml(p.category)}">${escapeHtml(p.text)}</span>`).join('')}
      </div>
      <div class="sortir-kolom">
        ${kolom.map(k => `
          <div class="sortir-kolom-box" style="border: 2px dashed ${resolveColor(k.color, '#3ecfcf')}44;">
            <h4 style="color:${resolveColor(k.color, '#3ecfcf')};">${escapeHtml(k.label)}</h4>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderRodaGame(b: Record<string, unknown>): string {
  const title = b.title as string || 'Game Roda';
  const questions = (b.questions as Array<{ q: string; opts: Array<{ text: string; correct: boolean }>; feedbackCorrect?: string; feedbackWrong?: string }>) || [];
  return `
    <div class="block roda-block">
      <div class="block-header">
        <span class="block-icon">🎡</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      ${questions.map((q, qi) => `
        <div class="roda-question">
          <p><strong>${qi + 1}.</strong> ${escapeHtml(q.q)}</p>
          <div class="q-options">
            ${q.opts.map((opt, oi) => `
              <button class="q-opt" onclick="checkAnswer(this,${qi},${oi},${q.opts.findIndex(o => o.correct)})">
                <span class="q-letter">${String.fromCharCode(65 + oi)}</span>
                ${escapeHtml(opt.text)}
              </button>`).join('')}
          </div>
        </div>`).join('')}
    </div>`;
}

function renderMemoryGame(b: Record<string, unknown>): string {
  const title = b.title as string || 'Memory Game';
  const pairs = (b.pairs as Array<{ left: string; right: string }>) || [];
  const cardId = `mem-${Math.random().toString(36).slice(2, 8)}`;
  // Create card array: each pair produces 2 cards
  const cards: Array<{ pairIdx: number; side: 'left' | 'right'; text: string }> = [];
  pairs.forEach((p, i) => {
    cards.push({ pairIdx: i, side: 'left', text: p.left });
    cards.push({ pairIdx: i, side: 'right', text: p.right });
  });
  // Shuffle (Fisher-Yates seeded by cardId hash for determinism)
  const seed = cardId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = (seed * (i + 1) + i) % (i + 1);
    [cards[i]!, cards[j]!] = [cards[j]!!, cards[i]];
  }
  return `
    <div class="block memory-game-block" data-game="${cardId}">
      <div class="block-header">
        <span class="block-icon">🧠</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <p class="game-instruction">Temukan pasangan yang cocok!</p>
      <div class="memory-grid">
        ${cards.map((c, i) => `
          <div class="memory-card" data-pair="${c.pairIdx}" data-side="${c.side}" data-game="${cardId}" data-idx="${i}" onclick="flipMemoryCard(this)">
            <div class="memory-card-inner">
              <div class="memory-card-front">❓</div>
              <div class="memory-card-back">${escapeHtml(c.text)}</div>
            </div>
          </div>`).join('')}
      </div>
      <div class="game-score" id="mem-score-${cardId}">👀 0/${pairs.length} pasangan</div>
    </div>`;
}

function renderMatchingGame(b: Record<string, unknown>): string {
  const title = b.title as string || 'Matching Game';
  const pairs = (b.pairs as Array<{ left: string; right: string }>) || [];
  const matchId = `match-${Math.random().toString(36).slice(2, 8)}`;
  // Shuffle right side
  const rightIndices = pairs.map((_, i) => i);
  for (let i = rightIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rightIndices[i]!, rightIndices[j]!] = [rightIndices[j], rightIndices[i]];
  }
  return `
    <div class="block matching-game-block" data-game="${matchId}">
      <div class="block-header">
        <span class="block-icon">🔗</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <p class="game-instruction">Cocokkan kolom kiri dengan kolom kanan!</p>
      <div class="matching-columns">
        <div class="matching-col matching-left">
          ${pairs.map((p, i) => `
            <button class="match-item match-left" data-idx="${i}" data-game="${matchId}" onclick="selectMatchLeft(this)">${escapeHtml(p.left)}</button>`).join('')}
        </div>
        <div class="matching-col matching-right">
          ${rightIndices.map(ri => `
            <button class="match-item match-right" data-idx="${ri}" data-game="${matchId}" onclick="selectMatchRight(this)">${escapeHtml(pairs[ri]!.right)}</button>`).join('')}
        </div>
      </div>
      <div class="game-score" id="match-score-${matchId}">🔗 0/${pairs.length} cocok</div>
    </div>`;
}

function renderWordSearchGame(b: Record<string, unknown>): string {
  const title = b.title as string || 'Cari Kata';
  const words = (b.words as string[]) || [];
  const gridSize = (b.gridSize as number) || 10;
  const wsId = `ws-${Math.random().toString(36).slice(2, 8)}`;
  // Build a simple grid with words placed
  const grid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
  // Place words horizontally and vertically
  const placedWords: string[] = [];
  words.forEach(word => {
    const w = word.toUpperCase();
    let placed = false;
    for (let attempt = 0; attempt < 50 && !placed; attempt++) {
      const horizontal = Math.random() > 0.5;
      if (horizontal) {
        const row = Math.floor(Math.random() * gridSize);
        const col = Math.floor(Math.random() * (gridSize - w.length + 1));
        let canPlace = true;
        for (let c = 0; c < w.length; c++) {
          if (grid[row]![col + c] !== '' && grid[row]![col + c] !== w[c]) { canPlace = false; break; }
        }
        if (canPlace) {
          for (let c = 0; c < w.length; c++) grid[row]![col + c] = w[c];
          placed = true; placedWords.push(w);
        }
      } else {
        const row = Math.floor(Math.random() * (gridSize - w.length + 1));
        const col = Math.floor(Math.random() * gridSize);
        let canPlace = true;
        for (let r = 0; r < w.length; r++) {
          if (grid[row + r]![col] !== '' && grid[row + r]![col] !== w[r]) { canPlace = false; break; }
        }
        if (canPlace) {
          for (let r = 0; r < w.length; r++) grid[row + r]![col] = w[r];
          placed = true; placedWords.push(w);
        }
      }
    }
  });
  // Fill empty cells with random letters
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!grid[r]![c]!) grid[r]![c] = alphabet[Math.floor(Math.random() * 26)];
    }
  }
  return `
    <div class="block word-search-block" data-game="${wsId}">
      <div class="block-header">
        <span class="block-icon">🔍</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <p class="game-instruction">Temukan kata-kata tersembunyi!</p>
      <div class="ws-container">
        <div class="ws-grid" style="grid-template-columns: repeat(${gridSize}, 1fr);">
          ${grid.flatMap((row, r) => row.map((cell, c) => `
            <div class="ws-cell" data-r="${r}" data-c="${c}" data-game="${wsId}" onclick="toggleWsCell(this)">${cell}</div>`)).join('')}
        </div>
        <div class="ws-words">
          <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 6px;">Kata yang dicari:</div>
          ${words.map(w => `<div class="ws-word" data-word="${w.toUpperCase()}" data-game="${wsId}">${escapeHtml(w)}</div>`).join('')}
        </div>
      </div>
    </div>`;
}

function renderDragDropGame(b: Record<string, unknown>): string {
  const title = b.title as string || 'Drag & Drop';
  const items = (b.items as Array<{ text: string; target: string }>) || [];
  const targets = (b.targets as Array<{ id: string; label: string; color?: string }>) || [];
  const ddId = `dd-${Math.random().toString(36).slice(2, 8)}`;
  // Shuffle items
  const shuffledItems = [...items];
  for (let i = shuffledItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledItems[i]!, shuffledItems[j]!] = [shuffledItems[j]!, shuffledItems[i]];
  }
  return `
    <div class="block drag-drop-block" data-game="${ddId}">
      <div class="block-header">
        <span class="block-icon">🖱️</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <p class="game-instruction">Seret item ke kotak yang tepat!</p>
      <div class="dd-pool" id="dd-pool-${ddId}">
        ${shuffledItems.map((item, i) => `
          <div class="dd-item" draggable="true" data-target="${escapeHtml(item.target)}" data-game="${ddId}" id="dd-item-${ddId}-${i}"
               ondragstart="dragStart(event)" ontouchstart="touchDragStart(event, this)">${escapeHtml(item.text)}</div>`).join('')}
      </div>
      <div class="dd-targets">
        ${targets.map(t => `
          <div class="dd-target" data-tid="${escapeHtml(t.id)}" data-game="${ddId}"
               style="border-color: ${resolveColor(t.color, '#3ecfcf')}44;"
               ondragover="event.preventDefault(); this.classList.add('dd-hover')"
               ondragleave="this.classList.remove('dd-hover')"
               ondrop="dropItem(event, '${ddId}')">
            <h4 style="color:${resolveColor(t.color, '#3ecfcf')};">${escapeHtml(t.label)}</h4>
            <div class="dd-target-items"></div>
          </div>`).join('')}
      </div>
      <button class="game-check-btn" onclick="checkDragDrop('${ddId}')">✅ Periksa Jawaban</button>
    </div>`;
}

function renderCrosswordGame(b: Record<string, unknown>): string {
  const title = b.title as string || 'Teka-teki Silang';
  const words = (b.words as Array<{ teks: string; hint: string; arah?: string; baris?: number; kolom?: number }>) || [];
  const gridSize = (b.gridSize as number) || 12;
  const cwId = `cw-${Math.random().toString(36).slice(2, 8)}`;
  // Build grid with numbered cells
  const cwGrid: (string | null)[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
  const cellNumbers: Record<string, number> = {};
  let numCounter = 1;
  words.forEach((w, wi) => {
    const word = w.teks.toUpperCase();
    const arah = w.arah || (wi % 2 === 0 ? 'across' : 'down');
    let startRow = w.baris ?? (arah === 'across' ? Math.floor(wi / 2) * 2 + 1 : wi % 2 === 0 ? 0 : 1);
    let startCol = w.kolom ?? (arah === 'down' ? Math.floor(wi / 2) * 3 + 1 : wi % 2 === 0 ? 0 : 1);
    startRow = Math.min(startRow, gridSize - 1);
    startCol = Math.min(startCol, gridSize - 1);
    // Place word
    for (let ci = 0; ci < word.length; ci++) {
      const r = arah === 'down' ? startRow + ci : startRow;
      const c = arah === 'across' ? startCol + ci : startCol;
      if (r < gridSize && c < gridSize) {
        cwGrid[r]![c] = word[ci]!;
        // Assign number to start cell
        if (ci === 0) {
          const key = `${r}-${c}`;
          if (!cellNumbers[key]) cellNumbers[key] = numCounter++;
        }
      }
    }
  });
  return `
    <div class="block crossword-block" data-game="${cwId}">
      <div class="block-header">
        <span class="block-icon">🔤</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="cw-container">
        <div class="cw-grid" style="grid-template-columns: repeat(${gridSize}, 1fr);">
          ${cwGrid.flatMap((row, r) => row.map((cell, c) => {
            const key = `${r}-${c}`;
            const num = cellNumbers[key];
            return cell !== null
              ? `<div class="cw-cell" data-r="${r}" data-c="${c}" data-answer="${cell}">
                  ${num ? `<span class="cw-num">${num}</span>` : ''}
                  <input type="text" maxlength="1" class="cw-input" data-r="${r}" data-c="${c}" data-game="${cwId}"
                         oninput="cwInput(this, '${cwId}')" onkeydown="cwKeyDown(event, this, '${cwId}')">
                </div>`
              : '<div class="cw-cell cw-blank"></div>';
          })).join('')}
        </div>
        <div class="cw-clues">
          <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 6px;">Petunjuk:</div>
          ${words.map((w, i) => {
            const arah = w.arah || (i % 2 === 0 ? 'across' : 'down');
            const label = arah === 'across' ? 'Mendatar' : 'Menurun';
            return `<div class="cw-clue"><span class="cw-clue-dir">${label}</span> ${escapeHtml(w.hint)} (${w.teks.length} huruf)</div>`;
          }).join('')}
        </div>
      </div>
      <button class="game-check-btn" onclick="checkCrossword('${cwId}')">✅ Periksa Jawaban</button>
    </div>`;
}

function renderTeamBuzzerGame(b: Record<string, unknown>): string {
  const title = b.title as string || 'Kuis Tim';
  const teamA = b.teamA as string || 'Tim A';
  const teamB = b.teamB as string || 'Tim B';
  const questions = (b.questions as Array<{ teks: string; poin: number }>) || [];
  const tbId = `tb-${Math.random().toString(36).slice(2, 8)}`;
  return `
    <div class="block team-buzzer-block" data-game="${tbId}">
      <div class="block-header">
        <span class="block-icon">🏆</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="tb-scoreboard">
        <div class="tb-team tb-team-a" id="tb-team-a-${tbId}">
          <div class="tb-team-name">${escapeHtml(teamA)}</div>
          <div class="tb-team-score" id="tb-score-a-${tbId}">0</div>
        </div>
        <div class="tb-vs">VS</div>
        <div class="tb-team tb-team-b" id="tb-team-b-${tbId}">
          <div class="tb-team-name">${escapeHtml(teamB)}</div>
          <div class="tb-team-score" id="tb-score-b-${tbId}">0</div>
        </div>
      </div>
      <div class="tb-questions" id="tb-questions-${tbId}">
        ${questions.map((q, i) => `
          <div class="tb-question" id="tb-q-${tbId}-${i}">
            <p><strong>Soal ${i + 1}</strong> (${q.poin} poin)</p>
            <p>${escapeHtml(q.teks)}</p>
            <div class="tb-actions">
              <button class="tb-btn tb-btn-a" onclick="buzzTeam('${tbId}', 'a', ${i}, ${q.poin})">${escapeHtml(teamA)} 🔔</button>
              <button class="tb-btn tb-btn-b" onclick="buzzTeam('${tbId}', 'b', ${i}, ${q.poin})">${escapeHtml(teamB)} 🔔</button>
              <button class="tb-btn tb-skip" onclick="skipQuestion('${tbId}', ${i})">⏭️ Lewati</button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}
