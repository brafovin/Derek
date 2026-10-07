// ─── SCREEN MANAGER ───────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

window.gameShowResults = function(entries) {
  const winner = entries[0];
  document.getElementById('results-winner').textContent =
    winner.name === 'YOU' ? '🏆  DU GEWINNST!' : `🏆  ${winner.name} GEWINNT!`;
  document.getElementById('results-winner').style.color =
    winner.name === 'YOU' ? '#FFD700' : '#FF6400';

  const body = document.getElementById('results-body');
  body.innerHTML = '';
  entries.forEach((e, i) => {
    const row = document.createElement('div');
    row.className = 'result-row' + (e.name==='YOU' ? ' result-row--player' : '');
    row.innerHTML = `
      <span class="result-rank">#${i+1}</span>
      <span class="result-name">${e.name}</span>
      <span class="result-score">${e.score} pts</span>
      <span class="result-kills">${e.kills} kills</span>
    `;
    body.appendChild(row);
  });

  showScreen('results-screen');
  document.getElementById('btn-play-again').onclick = () => location.reload();
  document.getElementById('btn-lobby').onclick      = () => location.reload();
};

// Flow: Lobby → Matchmaking → Pre-Game Lobby → Game
window.addEventListener('load', () => {
  showScreen('lobby-screen');
  initLobby();
});

// Called by lobby PLAY button — go to matchmaking first
window.goToPregame = function() {
  stopLobby();
  showScreen('matchmaking-screen');
  initMatchmaking(activeMap, activeMode);
  setupMatchmakingInput();
};

// Called by pregame countdown — start the 3D game
window.startGame = function() {
  showScreen('game-screen');

  const overlay = document.getElementById('game-loading');
  const bar     = document.getElementById('load-bar');
  const subText = document.getElementById('load-sub-text');
  const errEl   = document.getElementById('load-error');
  const retryEl = document.getElementById('load-retry');

  // Show the loading overlay while we wait for Three.js + game3d.js
  if (overlay) overlay.classList.add('visible');
  if (errEl)   errEl.style.display   = 'none';
  if (retryEl) retryEl.style.display = 'none';

  const startedAt = Date.now();
  const TIMEOUT_MS = 20000; // give CDNs up to 20s

  function ready() {
    return typeof THREE !== 'undefined' && typeof initGame3D === 'function';
  }

  function launch() {
    if (overlay) overlay.classList.remove('visible');
    // Wait one frame so the canvas is laid out at full size before Three.js init
    requestAnimationFrame(() => {
      const canvas = document.getElementById('gameCanvas');
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      requestAnimationFrame(() => {
        try {
          initGame3D();
        } catch (err) {
          console.error('initGame3D failed:', err);
          showLoadError('Spiel konnte nicht gestartet werden. Bitte neu laden.');
        }
      });
    });
  }

  function showLoadError(msg) {
    if (overlay) overlay.classList.add('visible');
    if (subText) subText.textContent = '';
    if (errEl)   { errEl.style.display = 'block'; errEl.textContent = msg; }
    if (retryEl) retryEl.style.display = 'inline-block';
  }

  function poll() {
    const elapsed = Date.now() - startedAt;

    // Total CDN failure flagged by the loader in index.html
    if (window._threeLoadFailed && typeof THREE === 'undefined') {
      showLoadError('Grafik-Engine konnte nicht geladen werden (Netzwerk/CDN blockiert). Bitte Verbindung prüfen und neu laden.');
      return;
    }

    if (ready()) {
      if (bar) bar.style.width = '100%';
      if (subText) subText.textContent = 'Match wird gestartet…';
      setTimeout(launch, 120);
      return;
    }

    if (elapsed > TIMEOUT_MS) {
      showLoadError('Zeitüberschreitung beim Laden der Grafik-Engine. Bitte neu laden.');
      return;
    }

    // Fake-ish progress so the bar moves while waiting
    if (bar) bar.style.width = Math.min(90, (elapsed / TIMEOUT_MS) * 100) + '%';
    if (subText) {
      subText.textContent = typeof THREE === 'undefined'
        ? 'Lade Grafik-Engine…'
        : 'Lade Spielwelt…';
    }
    requestAnimationFrame(poll);
  }

  poll();
};
