/**
 * map.js — Peta Misi Indonesia
 * Menggunakan gambar "Home.png" sebagai background peta
 * Misi Penjelajah Pancasila
 */

/* ══════════════════════════════════════════════
   NODE POSITIONS (percentage-based on map canvas)
══════════════════════════════════════════════ */
const MAP_NODES = [
  { sila: 1, left: 18, top: 35 },   // Sila 1 - Sumatera area
  { sila: 2, left: 35, top: 48 },   // Sila 2 - Jawa area
  { sila: 3, left: 50, top: 38 },   // Sila 3 - Bali/NTT area
  { sila: 4, left: 65, top: 44 },   // Sila 4 - Kalimantan area
  { sila: 5, left: 80, top: 50 },   // Sila 5 - Papua area
];

// Titik awal pelabuhan (start)
const MAP_START = { left: 8, top: 58 };

/* ══════════════════════════════════════════════
   MAP OBJECT
══════════════════════════════════════════════ */
const MAP = {
  render() {
    // Set background image
    this._setBackground();

    // Render paspor bar
    this._renderPaspor();

    // Render nodes
    this._renderNodes();

    // Render route lines
    this._renderRoutes();

    // Update stats
    this._updateStats();

    // Move avatar
    this._moveAvatar();
  },

  _setBackground() {
    const canvas = document.getElementById('map-canvas');
    if (!canvas) return;

    // Use uploaded Home.png as background
    canvas.style.backgroundImage = `url('Home.png')`;
    canvas.style.backgroundSize = 'cover';
    canvas.style.backgroundPosition = 'center';
    canvas.style.backgroundRepeat = 'no-repeat';

    // Remove the old SVG approach — hide it
    const svgEl = document.getElementById('indonesia-svg');
    if (svgEl) svgEl.style.display = 'none';
  },

  _renderPaspor() {
    const bar = document.getElementById('paspor-bar');
    if (!bar) return;

    bar.innerHTML = '';
    const silaEmojis = ['⭐','⛓️','🌳','🐂','🌾'];

    for (let i = 1; i <= 5; i++) {
      const stamp = document.createElement('div');
      stamp.className = 'paspor-stamp' + (S.missions.has(i) ? ' stamped' : '');
      stamp.setAttribute('data-sila', i);
      if (S.missions.has(i)) {
        stamp.innerHTML = `${silaEmojis[i-1]}✓`;
      } else {
        stamp.innerHTML = `<span style="color:rgba(139,90,43,.3);">⬜</span>`;
      }
      bar.appendChild(stamp);
    }
  },

  _renderNodes() {
    const container = document.getElementById('map-nodes');
    if (!container) return;

    container.innerHTML = '';

    MAP_NODES.forEach(node => {
      const sila = DATA.sila[node.sila - 1];
      const isDone = S.missions.has(node.sila);
      const isAvailable = this._isAvailable(node.sila);
      const isLocked = !isDone && !isAvailable;

      const nodeEl = document.createElement('div');
      nodeEl.className = 'map-node';
      nodeEl.style.left = node.left + '%';
      nodeEl.style.top = node.top + '%';

      let cardClass = 'node-card';
      if (isDone) cardClass += ' done-node';
      else if (isAvailable) cardClass += ' available-node';
      else cardClass += ' locked-node';

      const borderColor = isDone ? 'var(--g)' : isLocked ? 'rgba(100,100,100,.3)' : sila.warna;

      nodeEl.innerHTML = `
        <div class="${cardClass}" style="border-color:${borderColor};">
          ${isDone ? '<div class="node-check">✓</div>' : ''}
          <span class="node-emoji">${sila.emoji}</span>
          <span class="node-num">${node.sila}</span>
          <span class="node-lbl">${sila.lambang}</span>
        </div>
      `;

      if (!isLocked) {
        nodeEl.onclick = () => this._onNodeClick(node.sila);
      } else {
        nodeEl.onclick = () => {
          MODAL.show('🔒 Pulau Terkunci', `Selesaikan Pulau ${node.sila - 1} terlebih dahulu untuk membuka pulau ini!`, null, { type: 'lock' });
        };
        nodeEl.style.opacity = '0.5';
        nodeEl.style.cursor = 'not-allowed';
      }

      container.appendChild(nodeEl);
    });
  },

  _renderRoutes() {
    const pathEl = document.getElementById('map-svg-path');
    if (!pathEl) return;

    // Build a path connecting start → available/completed nodes
    let d = '';
    let prevPt = MAP_START; // mulai dari pelabuhan

    // Selalu gambar garis dari start ke node pertama yang available
    const firstAvailable = MAP_NODES.findIndex(n => this._isAvailable(n.sila) || S.missions.has(n.sila));
    if (firstAvailable >= 0) {
      d = `M ${MAP_START.left} ${MAP_START.top}`;
    }

    MAP_NODES.forEach((node, i) => {
      const isDone = S.missions.has(node.sila);
      const isAvailable = this._isAvailable(node.sila);

      // Only draw route up to the available node
      if (isDone || isAvailable) {
        if (d === '') {
          d = `M ${node.left} ${node.top}`;
        } else {
          // Curved jalur laut
          const midX = (prevPt.left + node.left) / 2;
          const midY = Math.min(prevPt.top, node.top) - 4; // curve ke atas (laut)
          d += ` Q ${midX} ${midY} ${node.left} ${node.top}`;
        }
        prevPt = node;
      }
    });

    pathEl.setAttribute('d', d);
  },

  _isAvailable(silaNo) {
    // Misi 1 selalu tersedia
    if (silaNo === 1) return true;
    // Misi berikutnya tersedia jika misi sebelumnya selesai
    return S.missions.has(silaNo - 1);
  },

  _onNodeClick(silaNo) {
    const sila = DATA.sila[silaNo - 1];
    const isDone = S.missions.has(silaNo);

    if (isDone) {
      MODAL.show('✅ Pulau Sudah Selesai', `Kamu sudah menyelesaikan Pulau ${silaNo}: "${sila.nama}". Ingin mengulang?`, () => {
        goto(`s-sila${silaNo}`);
        showMateri(silaNo);
      }, { type: 'info' });
      return;
    }

    // Show mission start modal
    MISI_MODAL.show(silaNo, () => {
      goto(`s-sila${silaNo}`);
      showMateri(silaNo);

      // Init challenge based on type
      const t = sila.tantangan;
      if (t.tipe === 'hotspot') HOTSPOT.init(silaNo);
      else if (t.tipe === 'dragdrop') DND.init(silaNo);
      else if (t.tipe === 'pilgan') PILGAN.init(silaNo);
    });
  },

  _moveAvatar() {
    const avatar = document.getElementById('map-avatar');
    if (!avatar) return;

    // Find the latest completed mission node
    let targetNode;
    if (S.missions.size === 0) {
      // Before first mission — di pelabuhan start
      targetNode = MAP_START;
    } else {
      // Position at the last completed mission
      const lastDone = Math.max(...S.missions);
      targetNode = MAP_NODES.find(n => n.sila === lastDone) || MAP_START;
    }

    // Kapal offset: sedikit ke kanan-bawah dari node
    avatar.style.left = (targetNode.left + 2) + '%';
    avatar.style.top = (targetNode.top + 3) + '%';
  },

  _updateStats() {
    // Map score
    const mapScore = document.getElementById('map-score');
    if (mapScore) mapScore.textContent = S.score;

    // Map mission count
    const mapMission = document.getElementById('map-mission');
    if (mapMission) mapMission.textContent = `${S.missions.size}/5`;

    // Eval button — "Pendakian Akhir"
    const evalBtn = document.getElementById('btn-eval-map');
    if (evalBtn) {
      const done = S.missions.size;
      evalBtn.textContent = done >= 5 ? '⛰️ Pendakian Akhir' : `⛰️ Pendakian Akhir (${done}/5 pulau)`;
      evalBtn.disabled = done < 5;
    }
  }
};
