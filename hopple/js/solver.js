
const DAILY_OVERRIDES = {
  '2026-11-09' : { start: 'POPE', target: 'OATH'},
  '2026-11-11' : { start: 'SKID', target: 'MARK'},
};
class WordLadderSolver {
  constructor() { this.buckets = new Map(); this.ready = false; this.dailyPool = null; this.preferredWords = new Set(DAILY_WORDS); }
  initialize() {
    if (this.ready) return;
    for (const word of FULL_DICTIONARY) {
      if (!/^[A-Z]{4}$/.test(word)) continue;
      for (let i = 0; i < WORD_LENGTH; i++) {
        const pattern = word.slice(0, i) + '*' + word.slice(i + 1);
        if (!this.buckets.has(pattern)) this.buckets.set(pattern, []);
        this.buckets.get(pattern).push(word);
      }
    }
    this.ready = true;
  }
  getNeighbors(word) {
    this.initialize();
    const result = new Set();
    for (let i = 0; i < WORD_LENGTH; i++) {
      for (const next of this.buckets.get(word.slice(0, i) + '*' + word.slice(i + 1)) || []) {
        if (next !== word) result.add(next);
      }
    }
    return [...result];
  }
  getHammingDistance(a, b) {
    if (!a || !b || a.length !== b.length) return Infinity;
    return [...a].reduce((n, c, i) => n + (c !== b[i] ? 1 : 0), 0);
  }
  validateStep(previous, word, used = []) {
    if (!/^[A-Z]{4}$/.test(word)) return { valid: false, reason: 'Enter four letters.' };
    if (!DICTIONARY_SET.has(word)) return { valid: false, reason: 'Word not in dictionary. Try another.' };
    if (this.getHammingDistance(previous, word) !== 1) return { valid: false, reason: 'Change exactly one letter from ' + previous + '.' };
    return { valid: true, warning: used.includes(word) ? 'You have visited this word before.' : '' };
  }
  search(start, maxDepth = Infinity, allowedWords = null) {
    const queue = [start], parents = new Map([[start, null]]), distances = new Map([[start, 0]]);
    for (let head = 0; head < queue.length; head++) {
      const current = queue[head], depth = distances.get(current);
      if (depth >= maxDepth) continue;
      for (const next of this.getNeighbors(current)) {
        if (parents.has(next) || (allowedWords && !allowedWords.has(next))) continue;
        parents.set(next, current); distances.set(next, depth + 1); queue.push(next);
      }
    }
    return { parents, distances };
  }
  pathFrom(parents, target) {
    if (!parents.has(target)) return null;
    const path = [];
    for (let word = target; word !== null; word = parents.get(word)) path.push(word);
    return path.reverse();
  }
  findShortestPath(start, target) {
    if (!DICTIONARY_SET.has(start) || !DICTIONARY_SET.has(target)) return null;
    const shortest = this.pathFrom(this.search(start).parents, target);
    if (!shortest || !this.preferredWords.has(start) || !this.preferredWords.has(target)) return shortest;
    // Prefer a familiar-word route only when it is just as short as the full-dictionary route.
    const familiar = this.pathFrom(this.search(start, shortest.length - 1, this.preferredWords).parents, target);
    return familiar && familiar.length === shortest.length ? familiar : shortest;
  }
  generatePuzzle(difficulty = 'medium') {
    const ranges = { easy: [4, 4], medium: [5, 5], hard: [6, 6] };
    if (!ranges[difficulty]) throw new Error('Unknown difficulty.');
    const [min, max] = ranges[difficulty];
    const words = [...this.preferredWords];
    // Fisher-Yates shuffle. All distances use the complete accepted dictionary.
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); [words[i], words[j]] = [words[j], words[i]];
    }
    for (const start of words) {
      const { distances } = this.search(start, max);
      const familiar = this.search(start, max, this.preferredWords).distances;
      const candidates = [...distances].filter(([word, d]) => d >= min && d <= max && familiar.get(word) === d);
      if (candidates.length) {
        const [target, minSteps] = candidates[Math.floor(Math.random() * candidates.length)];
        return { start, target, minSteps, difficulty };
      }
    }
    throw new Error('No puzzle available at this difficulty. Try another level.');
  }
  getDailyPuzzle(date = new Date()) {
    if (!this.dailyPool) {
      // The bank is exhaustively validated offline. Avoid solving 1,000 puzzles on page load.
      this.dailyPool = CURATED_PUZZLES.filter(p => p.start !== p.target && DICTIONARY_SET.has(p.start) &&
        DICTIONARY_SET.has(p.target) && p.minSteps >= 4 && p.minSteps <= 6);
    }
    if (!this.dailyPool.length) throw new Error('No valid daily puzzles are available.');
    const dateKey = date.toLocaleDateString('en-CA', { timeZone: 'America/New_York'});
    const day = Math.floor(Date.parse(dateKey + 'T00:00:00Z') / 86400000);
    const epoch = Math.floor(Date.UTC(2026, 9, 29) / 86400000);
    const custom = DAILY_OVERRIDES[dateKey];

if (custom) {
  const start = String(custom.start || '').trim().toUpperCase();
  const target = String(custom.target || '').trim().toUpperCase();
  const solution = this.findShortestPath(start, target);
  const moves = solution ? solution.length - 1 : 0;

  if (moves >= 4 && moves <= 6) {
    return {
      start,
      target,
      minSteps: moves,
      solution,
      dateKey,
      puzzleNumber: day - epoch + 1
    };
  }

  console.warn('Invalid override for ' + dateKey + '. Using automatic puzzle.');
}
    const index = ((day - epoch) % this.dailyPool.length + this.dailyPool.length) % this.dailyPool.length;
    const puzzle = this.dailyPool[index];
    const route = this.findShortestPath(puzzle.start, puzzle.target);
    if (!route || route.length - 1 !== puzzle.minSteps) throw new Error('Daily puzzle data needs updating.');
    return { ...puzzle, dateKey, puzzleNumber: day - epoch + 1 };
  }
}
const solver = new WordLadderSolver();
