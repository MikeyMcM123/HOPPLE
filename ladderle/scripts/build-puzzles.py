"""Rebuild the daily bank after dictionary edits: python scripts/build-puzzles.py.
No third-party dependencies. Distances use every accepted word; preferred-word
paths must be equally short. Never count reversed endpoints as a new puzzle.
"""
from pathlib import Path
from collections import defaultdict, deque, Counter
import json, random, re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'js' / 'words.js'
COUNT = 1000
SEED = 20261030


def build():
    source = SOURCE.read_text()
    def array(name):
        match = re.search(r'const ' + name + r' = (\[.*?\]);', source, re.S)
        if not match:
            raise ValueError('Missing ' + name)
        return json.loads(match.group(1))
    words = array('COMMON_WORDS')
    preferred = set(array('DAILY_WORDS'))
    wordset = set(words)
    assert len(words) == len(wordset) and all(re.fullmatch(r'[A-Z]{4}', w) for w in words)
    assert preferred <= wordset
    buckets = defaultdict(list)
    for word in words:
        for i in range(4):
            buckets[word[:i] + '*' + word[i+1:]].append(word)
    neighbors = {}
    for word in words:
        adjacent = set()
        for i in range(4):
            adjacent.update(buckets[word[:i] + '*' + word[i+1:]])
        adjacent.discard(word)
        neighbors[word] = sorted(adjacent)

    def bfs(start, allowed=None):
        distance, parent, queue = {start: 0}, {start: None}, deque([start])
        while queue:
            word = queue.popleft()
            if distance[word] >= 6:
                continue
            for nxt in neighbors[word]:
                if nxt in distance or (allowed is not None and nxt not in allowed):
                    continue
                distance[nxt] = distance[word] + 1
                parent[nxt] = word
                queue.append(nxt)
        return distance, parent

    rng = random.Random(SEED)
    candidates = {4: [], 5: [], 6: []}
    for start in sorted(preferred):
        full, _ = bfs(start)
        friendly, parents = bfs(start, preferred)
        for moves in [4, 5, 6]:
            targets = [w for w in sorted(friendly) if w > start and friendly[w] == moves and full.get(w) == moves]
            rng.shuffle(targets)
            for target in targets[:16]:
                solution, cursor = [], target
                while cursor is not None:
                    solution.append(cursor)
                    cursor = parents[cursor]
                candidates[moves].append({'start': start, 'target': target, 'minSteps': moves,
                    'difficulty': {4: 'Easy', 5: 'Medium', 6: 'Hard'}[moves], 'solution': solution[::-1]})
    selected, usage = [], Counter()
    for moves, required in [(4, 334), (5, 333), (6, 333)]:
        rng.shuffle(candidates[moves])
        pool = sorted(candidates[moves], key=lambda p: usage[p['start']] + usage[p['target']])
        chosen = 0
        for puzzle in pool:
            if usage[puzzle['start']] >= 6 or usage[puzzle['target']] >= 6:
                continue
            selected.append(puzzle)
            usage.update([puzzle['start'], puzzle['target']])
            chosen += 1
            if chosen == required:
                break
        if chosen != required:
            raise ValueError(f'Not enough {moves}-move pairs: {chosen}/{required}')
    assert len(selected) == COUNT
    assert len({tuple(sorted([p['start'], p['target']])) for p in selected}) == COUNT
    # Interleave route lengths and avoid repeated endpoints on neighboring days.
    rng.shuffle(selected)
    schedule = []
    while selected:
        previous = {schedule[-1]['start'], schedule[-1]['target']} if schedule else set()
        for i, puzzle in enumerate(selected):
            if not previous.intersection([puzzle['start'], puzzle['target']]):
                schedule.append(selected.pop(i))
                break
        else:
            schedule.append(selected.pop())
    literal = '[\n' + ',\n'.join('  ' + json.dumps(p, separators=(',', ':')) for p in schedule) + '\n]'
    updated, replacements = re.subn(r'const CURATED_PUZZLES = \[.*?\];', lambda _: 'const CURATED_PUZZLES = ' + literal + ';', source, flags=re.S)
    assert replacements == 1
    SOURCE.write_text(updated)
    print(json.dumps({'dictionary': len(words), 'dailyPuzzles': len(schedule),
        'lengths': dict(Counter(p['minSteps'] for p in schedule)),
        'distinctEndpoints': len(usage), 'maxEndpointUses': max(usage.values())}))


if __name__ == '__main__':
    build()
