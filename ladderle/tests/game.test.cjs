const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function fixture(storage = new Map()) {
  const calls = [];
  const UI = new Proxy({}, { get: (_, name) => (...args) => calls.push([name, ...args]) });
  const context = vm.createContext({ console, URLSearchParams, Date, Math, setInterval() {},
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
    location: { hash: '', pathname: '/', search: '', origin: 'https://example.test', protocol: 'https:' },
    history: { replaceState() {} }, document: { querySelector() { return null; } },
    window: { addEventListener() {}, matchMedia() { return { matches: true }; } }, UI, launchConfetti() {} });
  for (const file of ['words', 'solver', 'game']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/' + file + '.js'), 'utf8'), context);
  return { storage, context, calls, run: source => vm.runInContext(source, context) };
}
const custom = `game.startCustomGame('COLD','WARM');`;
function submit(f, word) { f.run(`game.currentInput = '${word}'; game.submitCurrentWord();`); }
test('all accepted words are four letters; shortest routes match independent BFS', () => {
  const f = fixture();
  assert.equal(f.run('FULL_DICTIONARY.every(w => /^[A-Z]{4}$/.test(w))'), true);
  assert.equal(f.run('FULL_DICTIONARY.length'), 2052);
  f.run(`globalThis.independent = (start, target) => {
    const q = [[start, 0]], seen = new Set([start]);
    for (let i = 0; i < q.length; i++) {
      const [word, depth] = q[i]; if (word === target) return depth;
      for (const candidate of FULL_DICTIONARY) {
        if (!seen.has(candidate) && [...word].filter((c,j) => c !== candidate[j]).length === 1) { seen.add(candidate); q.push([candidate,depth+1]); }
      }
    }
    return null;
  };`);
  for (const [a, b] of [['COLD', 'WARM'], ['LOVE', 'HATE'], ['TREE', 'WOOD'], ['BOOK', 'READ']]) {
    assert.equal(f.run(`solver.findShortestPath('${a}','${b}')?.length - 1 || null`), f.run(`independent('${a}','${b}')`));
  }
});
test('exactly two undos, deletion is free and invalid submissions preserve input', () => {
  const f = fixture(); f.run(custom);
  submit(f, 'CORD'); f.run('game.undoLastStep()');
  submit(f, 'CORD'); f.run('game.undoLastStep()');
  submit(f, 'CORD'); f.run('game.undoLastStep()');
  assert.equal(f.run('game.undosUsed'), 2); assert.equal(f.run('game.ladder.length'), 2);
  f.run("game.currentInput='C';game.handleBackspace();game.handleBackspace()");
  assert.equal(f.run('game.undosUsed'), 2); assert.equal(f.run('game.ladder.length'), 2);
  submit(f, 'WARM'); assert.equal(f.run('game.currentInput'), 'WARM'); assert.equal(f.run('game.ladder.length'), 2);
});
test('undo count, input and route survive a fresh game instance and reselecting daily', () => {
  const f = fixture(); f.run('game.startDailyGame()');
  f.run('game.currentInput=game.optimalPath[1];game.submitCurrentWord();game.undoLastStep();game.currentInput="AB";game.save()');
  const g = fixture(f.storage); g.run('game.init()');
  assert.equal(g.run('game.undosUsed'), 1); assert.equal(g.run('game.currentInput'), 'AB');
  g.run('game.startDailyGame()'); assert.equal(g.run('game.undosUsed'), 1);
});
test('daily completion counts once after reload; reveal is not a solve', () => {
  const f = fixture(); f.run('game.startDailyGame()');
  f.run('for (const word of game.optimalPath.slice(1)) {game.currentInput=word;game.submitCurrentWord();}');
  assert.equal(f.run('game.getStats().solved'), 1);
  const g = fixture(f.storage); g.run('game.init();game.recordResult();game.startDailyGame()');
  assert.equal(g.run('game.getStats().solved'), 1);
  const h = fixture(); h.run('game.startDailyGame();game.confirmReveal()');
  assert.equal(h.run('game.getStats().completed'), 1); assert.equal(h.run('game.getStats().solved'), 0);
  assert.equal(h.run('game.isGameOver'), true);
});
test('practice resumes after reload, and statistics remain separate', () => {
  const f = fixture(); f.run("game.startRandomGame('easy',true);game.currentInput='AB';game.save()");
  const g = fixture(f.storage); g.run('game.init()');
  assert.equal(g.run('game.gameMode'), 'unlimited'); assert.equal(g.run('game.currentInput'), 'AB');
  g.run('for(const word of game.optimalPath.slice(1)){game.currentInput=word;game.submitCurrentWord();}');
  assert.equal(g.run("game.getStats('unlimited').solved"), 1); assert.equal(g.run('game.getStats().solved'), 0);
});
test('daily date is UTC, number is sequential, and only solvable curated pairs enter rotation', () => {
  const f = fixture();
  assert.equal(f.run("solver.getDailyPuzzle(new Date('2026-10-29T23:59:00Z')).dateKey"), '2026-10-29');
  assert.equal(f.run("solver.getDailyPuzzle(new Date('2026-10-30T01:00:00+02:00')).dateKey"), '2026-10-29');
  assert.equal(f.run("solver.getDailyPuzzle(new Date('2026-10-30T00:00:00Z')).puzzleNumber - solver.getDailyPuzzle(new Date('2026-10-29T00:00:00Z')).puzzleNumber"), 1);
  assert.equal(f.run('solver.dailyPool.length'), 1000);
});
test('practice difficulty always agrees with actual shortest distance', () => {
  const f = fixture();
  for (const [difficulty, min, max] of [['easy', 4, 4], ['medium', 5, 5], ['hard', 6, 6]]) {
    for (let i = 0; i < 12; i++) {
      const n = f.run(`{const p=solver.generatePuzzle('${difficulty}');solver.findShortestPath(p.start,p.target).length-1;}`);
      assert.ok(n >= min && n <= max, difficulty + ': ' + n);
    }
  }
});
test('custom validation rejects identical, unconnected and unsafe words without changing puzzle', () => {
  const f = fixture(); f.run('game.startDailyGame()'); const key = f.run('game.key');
  for (const source of ["game.startCustomGame('COLD','COLD')", "game.startCustomGame('ABLE','COLD')", "game.startCustomGame('<img','WARM')"]) {
    assert.equal(f.run(source), false); assert.equal(f.run('game.key'), key);
  }
});
test('hints follow current detours, survive reload, and do not submit a word', () => {
  const f = fixture(); f.run(custom); submit(f, 'CORD'); f.run('game.getHint();game.getHint()');
  assert.equal(f.run('game.hintsUsed'), 2); assert.equal(f.run('game.ladder.length'), 2);
  const g = fixture(f.storage); g.run(custom); assert.equal(g.run('game.hintsUsed'), 2); assert.equal(g.run('game.hintLevel'), 2);
});
test('blocked or corrupt storage does not prevent play', () => {
  const f = fixture(); f.run("localStorage.getItem=()=>{throw new Error('blocked')};localStorage.setItem=()=>{throw new Error('blocked')};game.startDailyGame()");
  assert.ok(f.run('game.ladder.length') > 0); assert.equal(f.run('game.storageWarned'), true);
  const g = fixture(new Map([['stepple_results','{invalid']])); g.run('game.startDailyGame()'); assert.equal(g.run('game.getStats().solved'), 0);
});
test('malformed saved ladders are rejected', () => {
  const f = fixture(); f.run(custom);
  assert.equal(f.run('game.restore(game.key,{...game.snapshot(),ladder:["COLD",{}]})'), false);
  assert.equal(f.run('game.restore(game.key,{...game.snapshot(),undos:3})'), false);
});
test('share results contain no intermediate answer words or old branding', () => {
  const f = fixture(); f.run(custom); submit(f, 'CORD');
  const text = f.run('game.getShareText()');
  assert.ok(text.includes('Ladderle')); assert.ok(!text.includes('CORD')); assert.ok(!/par|stepple|birdie|eagle/i.test(text));
});
test('an unfinished earlier daily resumes until the player switches to today', () => {
  const f = fixture();
  f.run(`{const d=new Date(Date.now()-86400000), p=solver.getDailyPuzzle(d);game.setupPuzzle(p.start,p.target,'daily','medium','daily:'+p.dateKey,p.dateKey,p.puzzleNumber);game.currentInput=game.optimalPath[1];game.submitCurrentWord();game.undoLastStep();}`);
  const earlier = f.run('game.dateKey');
  const g = fixture(f.storage); g.run('game.init()');
  assert.equal(g.run('game.dateKey'), earlier); assert.equal(g.run('game.undosUsed'), 1);
  g.run('game.startDailyGame()'); assert.notEqual(g.run('game.dateKey'), earlier); assert.equal(g.run('game.undosUsed'), 0);
});
test('daily streak survives an unfinished today and ends when today is revealed', () => {
  const f = fixture();
  f.run(`{const records={};for(const n of [1,2]){const date=new Date(Date.now()-n*86400000).toISOString().slice(0,10);records['daily:'+date]={mode:'daily',date,solved:true,moves:4,shortest:4,hints:0,undos:0};}Store.set('results',records);game.startDailyGame();}`);
  assert.equal(f.run('game.getStats().streak'), 2);
  f.run('game.confirmReveal()'); assert.equal(f.run('game.getStats().streak'), 0);
});

test('every daily pair is unique and has a 4–6 move shortest route using familiar words', () => {
  const f = fixture();
  const summary = f.run(`{
    const seen=new Set(), cache=new Map(), preferred=new Set(DAILY_WORDS);
    for(const p of CURATED_PUZZLES){
      const key=[p.start,p.target].sort().join(':');
      if(seen.has(key))throw new Error('Repeated pair '+key);seen.add(key);
      if(!cache.has(p.start))cache.set(p.start,solver.search(p.start,6).distances);
      const moves=cache.get(p.start).get(p.target);
      if(moves!==p.minSteps || moves<4 || moves>6)throw new Error('Wrong distance '+key);
      if(p.solution.length!==moves+1 || p.solution[0]!==p.start || p.solution.at(-1)!==p.target)throw new Error('Wrong solution '+key);
      for(let i=0;i<p.solution.length;i++){
        if(!preferred.has(p.solution[i]))throw new Error('Unfamiliar solution word');
        if(i && !solver.validateStep(p.solution[i-1],p.solution[i]).valid)throw new Error('Invalid solution move');
      }
    }
    ({count:seen.size, lengths:[4,5,6].map(n=>CURATED_PUZZLES.filter(p=>p.minSteps===n).length)});
  }`);
  assert.equal(summary.count,1000); assert.deepEqual(Array.from(summary.lengths),[334,333,333]);
});
test('the daily rotation contains 1,000 different days before repeating', () => {
  const f=fixture();
  assert.equal(f.run(`{const pairs=new Set();for(let i=0;i<1000;i++){const p=solver.getDailyPuzzle(new Date(Date.UTC(2026,9,29+i)));pairs.add([p.start,p.target].sort().join(':'));}pairs.size;}`),1000);
  assert.equal(f.run(`{const first=solver.getDailyPuzzle(new Date(Date.UTC(2026,9,29))),repeat=solver.getDailyPuzzle(new Date(Date.UTC(2026,9,1029)));first.start===repeat.start&&first.target===repeat.target;}`),true);
});
