/* Hopple state. Storage is local to this browser; it is not an anti-cheat system. */
const Store = {
  get(key, fallback = null) { try { const value = localStorage.getItem('stepple_' + key); return value === null ? fallback : JSON.parse(value); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem('stepple_' + key, JSON.stringify(value)); return true; } catch { return false; } }
};
class LadderGame {
  constructor() {
    this.wordLength = WORD_LENGTH; this.maxUndos = 2;
    this.ladder = []; this.currentInput = ''; this.gameMode = 'daily'; this.difficulty = 'medium';
    this.startWord = ''; this.targetWord = ''; this.shortest = 0; this.optimalPath = [];
    this.undosUsed = 0; this.hintsUsed = 0; this.hintLevel = 0; this.revealed = false; this.isGameOver = false;
    this.soundEnabled = Store.get('sound', false) === true; this.storageWarned = false;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }
  init() {
    const params = new URLSearchParams(location.hash.slice(1));
    if (params.has('start') || params.has('target')) {
      if (!this.startCustomGame(params.get('start') || '', params.get('target') || '')) this.startDailyGame();
    } else {
      const lastKey = Store.get('active');
      const last = typeof lastKey === 'string' ? Store.get('session_' + lastKey) : null;
      if (last && (last.mode !== 'daily' || !last.over || last.dateKey === new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })) && this.restore(lastKey, last)) UI.renderAll();
      else this.startDailyGame();
    }
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('hashchange', () => {
      const p = new URLSearchParams(location.hash.slice(1));
      if (p.has('start') || p.has('target')) this.startCustomGame(p.get('start') || '', p.get('target') || '');
    });
    setInterval(() => UI.updateDayNotice(), 60000);
  }
  startDailyGame() {
    this.clearChallengeHash();
    const p = solver.getDailyPuzzle();
    this.setupPuzzle(p.start, p.target, 'daily', 'medium', 'daily:' + p.dateKey, p.dateKey, p.puzzleNumber);
  }
  startRandomGame(difficulty = 'medium', fresh = false) {
    this.clearChallengeHash();
    if (!fresh) {
      const saved = Store.get('practice');
      if (saved && !saved.over && saved.difficulty === difficulty && this.restore(saved.key, saved)) { UI.renderAll(); return; }
    }
    try {
      const p = solver.generatePuzzle(difficulty);
      const id = 'practice:' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
      this.setupPuzzle(p.start, p.target, 'unlimited', difficulty, id);
    } catch (error) { UI.showToast(error.message); }
  }
  startCustomGame(start, target) {
    start = start.trim().toUpperCase(); target = target.trim().toUpperCase();
    if (!/^[A-Z]{4}$/.test(start) || !/^[A-Z]{4}$/.test(target) || !DICTIONARY_SET.has(start) || !DICTIONARY_SET.has(target)) {
      UI.showToast('Choose two valid four-letter dictionary words.'); return false;
    }
    if (start === target) { UI.showToast('Start and goal must be different words.'); return false; }
    if (!solver.findShortestPath(start, target)) { UI.showToast('These words have no connecting route. Try another pair.'); return false; }
    this.setupPuzzle(start, target, 'custom', 'custom', 'custom:' + start + ':' + target);
    const hash = '#start=' + start + '&target=' + target;
    try { history.replaceState(null, '', location.pathname + location.search + hash); } catch { /* file previews can restrict history */ }
    return true;
  }
  clearChallengeHash() { try { history.replaceState(null, '', location.pathname + location.search); } catch {} }
  setupPuzzle(start, target, mode, difficulty, key, dateKey = '', number = 0) {
    const saved = Store.get('session_' + key);
    if (saved && this.restore(key, saved)) { UI.renderAll(); return; }
    this.key = key; this.startWord = start; this.targetWord = target; this.gameMode = mode; this.difficulty = difficulty;
    this.dateKey = dateKey; this.puzzleNumber = number;
    this.optimalPath = solver.findShortestPath(start, target);
    if (!this.optimalPath) throw new Error('This puzzle has no connecting route.');
    this.shortest = this.optimalPath.length - 1; this.ladder = [start]; this.currentInput = '';
    this.undosUsed = 0; this.hintsUsed = 0; this.hintLevel = 0; this.revealed = false; this.isGameOver = false;
    this.save(); UI.renderAll();
  }
  snapshot() {
    return { version: 1, key: this.key, start: this.startWord, target: this.targetWord, mode: this.gameMode,
      difficulty: this.difficulty, dateKey: this.dateKey, number: this.puzzleNumber, ladder: this.ladder,
      input: this.currentInput, undos: this.undosUsed, hints: this.hintsUsed, hintLevel: this.hintLevel,
      revealed: this.revealed, over: this.isGameOver };
  }
  restore(key, s) {
    if (!s || s.version !== 1 || s.key !== key || !['daily', 'unlimited', 'custom'].includes(s.mode) ||
      !DICTIONARY_SET.has(s.start) || !DICTIONARY_SET.has(s.target) || s.start === s.target ||
      !Array.isArray(s.ladder) || s.ladder[0] !== s.start || s.ladder.length > 10000 || s.ladder.some(word => typeof word !== 'string' || !DICTIONARY_SET.has(word)) ||
      !Number.isInteger(s.undos) || s.undos < 0 || s.undos > 2 ||
      !Number.isInteger(s.hints) || s.hints < 0 || !/^[A-Z]{0,4}$/.test(s.input || '') ||
      (s.mode === 'daily' && (!/^\d{4}-\d{2}-\d{2}$/.test(s.dateKey) || key !== 'daily:' + s.dateKey))) return false;
    if (s.mode === 'daily') {
  const date = new Date(s.dateKey + 'T12:00:00Z');

  if (!Number.isFinite(date.getTime())) return false;

  const scheduled = solver.getDailyPuzzle(date);

  if (s.start !== scheduled.start || s.target !== scheduled.target) {
    return false;
  }
}  
    for (let i = 1; i < s.ladder.length; i++) {
      if (!solver.validateStep(s.ladder[i - 1], s.ladder[i]).valid || s.ladder[i - 1] === s.target) return false;
    }
    const path = solver.findShortestPath(s.start, s.target); if (!path) return false;
    this.key = key; this.startWord = s.start; this.targetWord = s.target; this.gameMode = s.mode;
    this.difficulty = s.difficulty; this.dateKey = s.dateKey; this.puzzleNumber = s.number;
    this.ladder = [...s.ladder]; this.currentInput = s.input || ''; this.undosUsed = s.undos;
    this.hintsUsed = s.hints; this.hintLevel = Number.isInteger(s.hintLevel) ? Math.max(0, Math.min(3, s.hintLevel)) : 0;
    this.revealed = s.revealed === true; this.isGameOver = this.revealed || this.ladder.at(-1) === s.target;
    this.optimalPath = path; this.shortest = path.length - 1;
    // Recover a terminal record if a previous storage write was interrupted.
    if (this.isGameOver) this.recordResult();
    Store.set('active', key); return true;
  }
  save() {
    const s = this.snapshot();
    const saved = Store.set('session_' + this.key, s);
    Store.set('active', this.key);
    if (this.gameMode === 'unlimited') Store.set('practice', s);
    if (!saved && !this.storageWarned) {
      this.storageWarned = true; UI.showToast('Progress cannot be saved in this browser. Keep this tab open.', 5000);
    }
  }
  handleKeyDown(e) {
    if (e.key === 'Escape') { UI.closeAllModals(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing ||
      document.querySelector('.modal-overlay.active') || e.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
    if (this.isGameOver) return;
    if (e.key === 'Enter') {
      // Preserve keyboard activation on focused controls.
      if (e.target.closest?.('button')) return;
      e.preventDefault(); this.submitCurrentWord();
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault(); this.handleBackspace();
    } else if (/^[a-z]$/i.test(e.key)) { e.preventDefault(); this.addLetter(e.key.toUpperCase()); }
  }
  addLetter(letter) {
    if (this.isGameOver || !/^[A-Z]$/.test(letter) || this.currentInput.length >= WORD_LENGTH) return;
    this.currentInput += letter; this.playSound('key'); this.save(); UI.updateInputRow();
  }
  handleBackspace() {
    if (this.isGameOver) return;
    this.currentInput = this.currentInput.slice(0, -1); this.save(); UI.updateInputRow();
  }
  undoLastStep() {
    if (this.isGameOver || this.ladder.length <= 1) return;
    if (this.undosUsed >= this.maxUndos) { UI.showToast('Both undos have been used. You can keep playing.'); return; }
    this.ladder.pop(); this.undosUsed++; this.currentInput = ''; this.hintLevel = 0;
    this.playSound('undo'); this.save(); UI.renderAll();
    UI.announce('Move undone. Current word: ' + this.ladder.at(-1) + '. ' + (2 - this.undosUsed) + ' undos left.');
    UI.showToast((2 - this.undosUsed) + ' undo' + (this.undosUsed === 1 ? '' : 's') + ' left.');
  }
  submitCurrentWord() {
    if (this.isGameOver) return;
    const word = this.currentInput;
    const validation = solver.validateStep(this.ladder.at(-1), word, this.ladder);
    if (!validation.valid) { UI.showToast(validation.reason); UI.shakeInputRow(); this.playSound('error'); return; }
    this.ladder.push(word); UI.announce('Move ' + (this.ladder.length - 1) + ': ' + word + (word === this.targetWord ? '. Goal reached.' : '.')); this.currentInput = ''; this.hintLevel = 0; this.playSound('enter');
    if (word === this.targetWord) {
      this.isGameOver = true; this.recordResult(); this.save(); UI.renderAll();
      this.playSound('win');
      UI.celebrateWin();
    } else { this.save(); UI.renderAll(); if (validation.warning) UI.showToast(validation.warning); }
  }
  getHint() {
    if (this.isGameOver) return;
    const current = this.ladder.at(-1), path = solver.findShortestPath(current, this.targetWord);
    if (!path || path.length < 2) return;
    this.hintLevel = Math.min(3, this.hintLevel + 1); this.hintsUsed++; this.save();
    const position = [...current].findIndex((c, i) => c !== path[1][i]);
    UI.highlightHintPosition(position);
    const messages = [
      'Try changing letter ' + (position + 1) + ' in ' + current + '.',
      'Change letter ' + (position + 1) + ' to ' + path[1][position] + '.',
      'One next step is ' + path[1] + '.'
    ];
    UI.showToast(messages[this.hintLevel - 1], 4500); UI.updateStatsHeader();
  }
  revealSolution() {
    if (!this.isGameOver) { UI.openModal('modal-confirm'); return; }
    UI.openSolutionModal(this.optimalPath);
  }
  confirmReveal() {
    if (!this.isGameOver) { this.revealed = true; this.isGameOver = true; this.currentInput = ''; this.recordResult(); this.save(); UI.renderAll(); }
    UI.openSolutionModal(this.optimalPath);
  }
  recordResult() {
    const records = Store.get('results', {});
    const safe = records && typeof records === 'object' && !Array.isArray(records) ? records : {};
    if (Object.prototype.hasOwnProperty.call(safe, this.key)) return;
    safe[this.key] = { mode: this.gameMode, date: this.dateKey, solved: !this.revealed && this.ladder.at(-1) === this.targetWord,
      moves: this.ladder.length - 1, shortest: this.shortest, hints: this.hintsUsed, undos: this.undosUsed };
    Store.set('results', safe);
  }
  getStats(mode = 'daily') {
    const stored = Store.get('results', {});
    const records = Object.values(stored && typeof stored === 'object' ? stored : {}).filter(r => r && r.mode === mode);
    const solved = records.filter(r => r.solved);
    const perfect = solved.filter(r => r.moves === r.shortest && r.hints === 0).length;
    let streak = 0;
    if (mode === 'daily') {
      const dates = new Set(solved.map(r => r.date));
      let day = Date.parse(
        new Date().toLocaleDateString('en-CA', {
          timeZone: 'America/New_York'
      }) + 'T00:00:00Z'
);
      const today = new Date(day).toISOString().slice(0, 10);
      const failedToday = records.some(r => r.date === today && !r.solved);
      if (!dates.has(today)) day -= 86400000;
      if (!failedToday) {
        while (dates.has(new Date(day).toISOString().slice(0, 10))) { streak++; day -= 86400000; }
      }
    }
    return { completed: records.length, solved: solved.length, perfect, streak,
      distribution: [0, 1, 2, 3].map(n => solved.filter(r => n === 3 ? r.moves - r.shortest >= 3 : r.moves - r.shortest === n).length) };
  }
  getShareText() {
    const label = this.gameMode === 'daily' ? 'Daily #' + this.puzzleNumber : this.startWord + ' → ' + this.targetWord;
    const score = this.revealed ? 'Solution revealed' : (this.ladder.length - 1) + ' moves · Shortest route: ' + this.shortest;
    const grid = this.ladder.map(w => [...w].map((c, i) => c === this.targetWord[i] ? '🟩' : '⬜').join('')).join('\n');
    const link = location.protocol === 'file:' ? '' : location.origin + location.pathname +
      (this.gameMode === 'daily' ? '' : '#start=' + this.startWord + '&target=' + this.targetWord);
    return 'Hopple · ' + label + '\n' + score + '\nHints: ' + this.hintsUsed + ' · Undos: ' + this.undosUsed + '/2\n\n' + grid + (link ? '\n\n' + link : '');
  }
  playSound(type) {
    if (!this.soundEnabled) return;
    try {
      this.audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const now = this.audioCtx.currentTime, osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain();
      osc.connect(gain); gain.connect(this.audioCtx.destination); osc.type = 'sine';
      const tones = { key: 300, enter: 580, error: 150, undo: 400, win: 880 };
      osc.frequency.setValueAtTime(tones[type] || 300, now);
      gain.gain.setValueAtTime(0.035, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } catch { /* Audio is optional. */ }
  }
}
const game = new LadderGame();
