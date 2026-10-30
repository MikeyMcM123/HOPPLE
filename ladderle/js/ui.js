/* DOM rendering and accessible modal navigation. */
const UI = {
  toastTimeout: null, returnFocus: null, statsMode: 'daily',
  init() {
    this.bindButtons(); this.renderKeyboard(); this.applySavedTheme();
    document.getElementById('sound-toggle').checked = game.soundEnabled;
    document.addEventListener('keydown', e => this.trapFocus(e));
    window.addEventListener('pagehide', () => { if (game.key) game.save(); });
  },
  announce(message) { document.getElementById('move-announcement').textContent = message; },
  renderAll() {
    this.updateStatsHeader(); this.renderLadder(); this.updateDayNotice();
  },
  updateStatsHeader() {
    document.getElementById('target-start-word').textContent = game.startWord;
    document.getElementById('target-goal-word').textContent = game.targetWord;
    const moves = game.ladder.length - 1;
    document.getElementById('header-steps').textContent = moves + (moves === 1 ? ' move' : ' moves');
    document.getElementById('header-mode').textContent = game.gameMode === 'daily' ? 'Daily #' + game.puzzleNumber :
      game.gameMode === 'custom' ? 'Custom puzzle' : game.difficulty[0].toUpperCase() + game.difficulty.slice(1) + ' practice';
    const undo = document.getElementById('btn-undo'), left = game.maxUndos - game.undosUsed;
    document.getElementById('undo-count').textContent = left;
    undo.disabled = left === 0 || game.ladder.length <= 1 || game.isGameOver;
    undo.setAttribute('aria-label', 'Undo last move. ' + left + ' remaining.');
    undo.title = left === 0 ? 'Both undos have been used' : 'Undo last move (' + left + ' left)';
    document.getElementById('btn-hint').hidden = game.isGameOver;
    document.getElementById('btn-results').hidden = !game.isGameOver;
    document.getElementById('btn-solution').textContent = game.isGameOver ? 'View shortest route' : 'Reveal solution';
    for (const id of ['tab-daily', 'tab-practice']) {
      const active = (id === 'tab-daily') === (game.gameMode === 'daily');
      const el = document.getElementById(id);
      if (active) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
    }
    document.getElementById('save-status').textContent = game.storageWarned ? 'Progress is not being saved' : 'Saved on this device';
    document.querySelectorAll('.key-btn').forEach(key => { key.disabled = game.isGameOver; });
  },
  updateDayNotice() {
    const old = game.gameMode === 'daily' && game.dateKey !== new Date().toISOString().slice(0, 10);
    document.getElementById('day-notice').hidden = !old;
  },
  renderLadder() {
    const container = document.getElementById('ladder-container'); container.replaceChildren();
    for (let r = 0; r < game.ladder.length; r++) {
      const word = game.ladder[r], previous = game.ladder[r - 1];
      const row = document.createElement('div');
      row.className = 'word-row' + (r === 0 ? ' row-start' : '') + (word === game.targetWord ? ' row-target-achieved' : '');
      row.setAttribute('role', 'group');
      const changed = previous ? [...word].findIndex((letter, c) => letter !== previous[c]) : -1;
      const matches = [...word].filter((letter, c) => letter === game.targetWord[c]).length;
      row.setAttribute('aria-label', (r === 0 ? 'Start' : 'Move ' + r) + ': ' + word +
        (changed >= 0 ? '. Changed letter ' + (changed + 1) + ' to ' + word[changed] : '') + '. ' + matches + ' letters match the goal.');
      for (let c = 0; c < game.wordLength; c++) {
        const tile = document.createElement('span'); tile.className = 'tile'; tile.textContent = word[c]; tile.setAttribute('aria-hidden', 'true');
        if (word[c] === game.targetWord[c]) tile.classList.add('tile-match-target');
        if (c === changed) tile.classList.add('tile-changed');
        row.appendChild(tile);
      }
      const badge = document.createElement('span'); badge.className = 'row-badge'; badge.setAttribute('aria-hidden', 'true');
      badge.textContent = r === 0 ? 'Start' : word === game.targetWord ? 'Goal' : String(r).padStart(2, '0');
      row.appendChild(badge); container.appendChild(row);
    }
    if (!game.isGameOver) {
      const row = document.createElement('div'); row.className = 'word-row row-active'; row.id = 'active-input-row'; row.setAttribute('role', 'group');
      for (let c = 0; c < game.wordLength; c++) {
        const tile = document.createElement('span'); tile.className = 'tile tile-input'; tile.id = 'input-tile-' + c; tile.setAttribute('aria-hidden', 'true'); row.appendChild(tile);
      }
      const badge = document.createElement('span'); badge.className = 'row-badge'; badge.textContent = String(game.ladder.length).padStart(2, '0'); badge.setAttribute('aria-hidden', 'true');
      row.appendChild(badge); container.appendChild(row); this.updateInputRow();
    }
    const wrapper = document.getElementById('board-wrapper'); wrapper.scrollTop = wrapper.scrollHeight;
  },
  updateInputRow() {
    const row = document.getElementById('active-input-row'); if (!row) return;
    row.setAttribute('aria-label', 'Next word: ' + (game.currentInput || 'empty') + '. ' + game.currentInput.length + ' of 4 letters.');
    for (let c = 0; c < game.wordLength; c++) {
      const tile = document.getElementById('input-tile-' + c); tile.textContent = game.currentInput[c] || '';
      tile.classList.toggle('tile-focus', c === Math.min(game.currentInput.length, game.wordLength - 1));
    }
  },
  shakeInputRow() {
    const row = document.getElementById('active-input-row');
    if (row) { row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake'); }
  },
  highlightHintPosition(position) {
    const tile = document.getElementById('input-tile-' + position);
    if (tile) { tile.classList.add('hint-glow'); setTimeout(() => tile.classList.remove('hint-glow'), 4000); }
  },
  renderKeyboard() {
    const container = document.getElementById('keyboard-container'); container.replaceChildren();
    const rows = ['QWERTYUIOP'.split(''), 'ASDFGHJKL'.split(''), ['ENTER', ...'ZXCVBNM', 'BACK']];
    for (const keys of rows) {
      const row = document.createElement('div'); row.className = 'keyboard-row';
      for (const key of keys) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'key-btn'; button.dataset.key = key;
        button.setAttribute('aria-label', key === 'BACK' ? 'Delete typed letter' : key === 'ENTER' ? 'Submit word' : key);
        if (key === 'BACK') { button.classList.add('key-wide'); button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 5H8l-6 7 6 7h13V5zM11 9l6 6m0-6-6 6"/></svg>'; }
        else { button.textContent = key === 'ENTER' ? 'ENTER' : key; if (key === 'ENTER') button.classList.add('key-wide'); }
        button.addEventListener('click', () => {
          if (key === 'ENTER') game.submitCurrentWord(); else if (key === 'BACK') game.handleBackspace(); else game.addLetter(key);
          if (!document.querySelector('.modal-overlay.active')) document.getElementById('board-wrapper').focus({ preventScroll: true });
        });
        row.appendChild(button);
      }
      container.appendChild(row);
    }
  },
  showToast(message, duration = 3000) {
    clearTimeout(this.toastTimeout);
    const container = document.getElementById('toast-container'); container.replaceChildren();
    const toast = document.createElement('div'); toast.className = 'toast'; toast.textContent = message; container.appendChild(toast);
    this.toastTimeout = setTimeout(() => container.replaceChildren(), duration);
  },
  bindButtons() {
    const on = (id, fn) => document.getElementById(id).addEventListener('click', fn);
    on('btn-help', () => this.openModal('modal-help'));
    on('btn-settings', () => this.openModal('modal-settings'));
    on('btn-undo', () => { game.undoLastStep(); this.focusBoard(); });
    on('btn-hint', () => { game.getHint(); this.focusBoard(); });
    on('btn-more', () => this.openModal('modal-options'));
    on('btn-solution', () => game.revealSolution());
    on('btn-confirm-reveal', () => game.confirmReveal());
    on('btn-new-game', () => this.openDifficultyModal());
    on('btn-stats', () => this.openStatsModal());
    on('btn-results', () => this.openWinModal());
    on('btn-win-share', () => this.shareResult());
    on('btn-win-next', () => { this.closeAllModals(); game.startRandomGame('medium', true); this.focusBoard(); });
    on('tab-daily', () => { game.startDailyGame(); this.focusBoard(); });
    on('btn-today', () => { game.startDailyGame(); this.focusBoard(); });
    on('tab-practice', () => {
      if (game.gameMode !== 'daily') { this.openDifficultyModal(); return; }
      const saved = Store.get('practice');
      if (saved && !saved.over) { game.startRandomGame(saved.difficulty, false); this.focusBoard(); } else this.openDifficultyModal();
    });
    on('btn-challenge-link', () => {
      if (location.protocol === 'file:') { this.showToast('Deploy the site to share a playable puzzle link.'); return; }
      this.copyText(location.origin + location.pathname + '#start=' + game.startWord + '&target=' + game.targetWord, 'Puzzle link copied.');
    });
    on('stats-daily', () => this.openStatsModal('daily'));
    on('stats-practice', () => this.openStatsModal('unlimited'));
    document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => this.openModal(button.dataset.open)));
    document.querySelectorAll('[data-difficulty]').forEach(button => button.addEventListener('click', () => {
      const difficulty = button.dataset.difficulty; this.closeAllModals(); game.startRandomGame(difficulty, true); this.focusBoard();
    }));
    document.querySelectorAll('.modal-close').forEach(button => button.addEventListener('click', () => this.closeAllModals()));
    document.querySelectorAll('.modal-overlay').forEach(overlay => overlay.addEventListener('click', e => { if (e.target === overlay) this.closeAllModals(); }));
    document.getElementById('theme-toggle').addEventListener('change', e => this.setTheme(e.target.checked ? 'dark' : 'light'));
    document.getElementById('sound-toggle').addEventListener('change', e => { game.soundEnabled = e.target.checked; Store.set('sound', game.soundEnabled); });
    document.getElementById('form-custom-puzzle').addEventListener('submit', e => {
      e.preventDefault();
      if (game.startCustomGame(document.getElementById('input-custom-start').value, document.getElementById('input-custom-target').value)) {
        this.closeAllModals(); this.focusBoard(); this.showToast('Puzzle ready. Copy its link from the options menu.');
      }
    });
  },
  focusBoard() { document.getElementById('board-wrapper').focus({ preventScroll: true }); },
  openModal(id) {
    const modal = document.getElementById(id); if (!modal) return;
    if (!document.querySelector('.modal-overlay.active')) this.returnFocus = document.activeElement;
    document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
    modal.classList.add('active'); document.querySelector('.site-shell').inert = true;
    document.body.style.overflow = 'hidden'; modal.querySelector('[role="dialog"]').focus({ preventScroll: true });
  },
  closeAllModals() {
    const hadModal = document.querySelector('.modal-overlay.active');
    document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
    document.querySelector('.site-shell').inert = false; document.body.style.overflow = '';
    if (hadModal) {
      const target = this.returnFocus;
      if (target?.isConnected && !target.disabled && !target.hidden && target.getClientRects().length) target.focus({ preventScroll: true });
      else this.focusBoard();
    }
    this.returnFocus = null;
  },
  trapFocus(e) {
    const modal = document.querySelector('.modal-overlay.active'); if (!modal) return;
    if (e.key === 'Escape') { e.preventDefault(); this.closeAllModals(); return; }
    if (e.key !== 'Tab') return;
    const items = [...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href],[tabindex="0"]')].filter(el => !el.hidden && el.getClientRects().length);
    if (!items.length) { e.preventDefault(); return; }
    const first = items[0], last = items.at(-1);
    if (e.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) { e.preventDefault(); first.focus(); }
  },
  openDifficultyModal() { this.openModal('modal-new-game'); },
  openStatsModal(mode = this.statsMode) {
    this.statsMode = mode;
    const stats = game.getStats(mode);
    for (const [id, value] of [['stat-completed', stats.completed], ['stat-solved', stats.solved], ['stat-perfect', stats.perfect], ['stat-streak', mode === 'daily' ? stats.streak : '—']]) document.getElementById(id).textContent = value;
    document.getElementById('streak-label').textContent = mode === 'daily' ? 'Day streak' : 'No streak';
    document.getElementById('stats-daily').setAttribute('aria-pressed', mode === 'daily');
    document.getElementById('stats-practice').setAttribute('aria-pressed', mode === 'unlimited');
    const container = document.getElementById('stats-distribution'); container.replaceChildren();
    const max = Math.max(1, ...stats.distribution);
    for (let i = 0; i < 4; i++) {
      const row = document.createElement('div'); row.className = 'dist-row';
      const label = document.createElement('span'); label.className = 'dist-label'; label.textContent = i === 0 ? 'Shortest route' : '+' + i + (i === 3 ? ' or more' : ' move' + (i === 1 ? '' : 's'));
      const track = document.createElement('div'); track.className = 'dist-bar-track';
      const fill = document.createElement('div'); fill.className = 'dist-bar-fill'; fill.style.width = (stats.distribution[i] / max * 100) + '%';
      const count = document.createElement('span'); count.className = 'dist-count'; count.textContent = stats.distribution[i];
      track.append(fill, count); row.append(label, track); container.appendChild(row);
    }
    this.openModal('modal-stats');
  },
  openWinModal() {
    const steps = game.ladder.length - 1, perfect = steps === game.shortest && game.hintsUsed === 0;
    document.getElementById('win-title').textContent = game.revealed ? 'Answer shown' : perfect ? 'Nailed it!' : 'Nice!';
    document.getElementById('win-badge').textContent = game.revealed ? 'Try another one in Practice.' : steps === game.shortest ? 'That’s the fewest moves possible.' : 'Solved in ' + steps + ' moves.';
    const container = document.getElementById('win-steps-info'); container.replaceChildren();
    for (const [value, label] of [[game.revealed ? '—' : steps, 'Your moves'], [game.shortest, 'Shortest route']]) {
      const card = document.createElement('div'), number = document.createElement('strong'), caption = document.createElement('span');
      number.textContent = value; caption.textContent = label; card.append(number, caption); container.appendChild(card);
    }
    document.getElementById('win-assistance').textContent = game.hintsUsed + ' hints used · ' + game.undosUsed + ' of 2 undos used';
    document.getElementById('next-daily').textContent = game.gameMode === 'daily' ? 'New daily at 00:00 UTC. More puzzles in Practice.' : '';
    this.openModal('modal-win');
  },
  openSolutionModal(path) {
    const container = document.getElementById('solution-path-list'); container.replaceChildren();
    for (let r = 0; r < (path || []).length; r++) {
      const row = document.createElement('div'); row.className = 'solution-step-row';
      const label = document.createElement('span'); label.className = 'sol-num'; label.textContent = r === 0 ? 'Start' : r === path.length - 1 ? 'Goal' : 'Move ' + r;
      const tiles = document.createElement('div'); tiles.className = 'sol-tiles';
      for (let c = 0; c < path[r].length; c++) {
        const tile = document.createElement('span'); tile.className = 'sol-tile'; tile.textContent = path[r][c];
        if (r > 0 && path[r - 1][c] !== path[r][c]) tile.classList.add('sol-changed'); tiles.appendChild(tile);
      }
      row.append(label, tiles); container.appendChild(row);
    }
    this.openModal('modal-solution');
  },
  async shareResult() {
    const text = game.getShareText();
    if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      try { await navigator.share({ text }); return; } catch (error) { if (error.name === 'AbortError') return; }
    }
    await this.copyText(text, 'Result copied. Share it with a friend.');
  },
  async copyText(text, success) {
    try { if (!navigator.clipboard) throw new Error(); await navigator.clipboard.writeText(text); this.showToast(success); }
    catch {
      const textarea = document.createElement('textarea'); textarea.value = text; textarea.style.cssText = 'position:fixed;opacity:0;left:0;top:0';
      const parent = document.querySelector('.modal-overlay.active .modal-card') || document.body;
      const focused = document.activeElement; parent.appendChild(textarea); textarea.select();
      let copied = false; try { copied = document.execCommand('copy'); } catch {}
      textarea.remove(); focused?.focus({ preventScroll: true });
      if (copied) this.showToast(success); else this.showToast('Copy is unavailable. Use your browser’s sharing options.', 4500);
    }
  },
  setTheme(theme) {
    document.documentElement.dataset.theme = theme; Store.set('theme', theme);
    document.getElementById('theme-toggle').checked = theme === 'dark';
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#202329' : '#f6f1e8';
  },
  applySavedTheme() {
    const saved = Store.get('theme');
    this.setTheme(saved === 'dark' || saved === 'light' ? saved : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
};
document.addEventListener('DOMContentLoaded', () => {
  try {
    UI.init(); game.init();
    if (!Store.get('seen_help', false)) { UI.openModal('modal-help'); Store.set('seen_help', true); }
  } catch (error) {
    console.error('Ladderle failed to start', error);
    const message = document.createElement('p'); message.textContent = 'Ladderle could not load. Refresh the page or try again shortly.';
    document.getElementById('ladder-container').replaceChildren(message);
    UI.showToast('The puzzle could not load. Please refresh.', 8000);
  }
});
