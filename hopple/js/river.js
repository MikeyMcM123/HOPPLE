/* River celebration. Artwork is replaceable; hop timing and positions live here. */
const River = {
  // Shore samples from the actual background, from its top edge to its bottom.
  shore: [[0.48,0.92],[0.48,0.92],[0.46,0.88],[0.46,0.88],[0.44,0.86],[0.44,0.86],[0.42,0.86],[0.42,0.86],[0.4,0.84],[0.4,0.84],[0.4,0.82],[0.4,0.82],[0.38,0.8],[0.38,0.8],[0.38,0.8],[0.38,0.8],[0.38,0.78],[0.38,0.78],[0.38,0.76],[0.38,0.76],[0.36,0.74],[0.36,0.74],[0.36,0.72],[0.36,0.72],[0.36,0.72],[0.36,0.72],[0.34,0.7],[0.34,0.7],[0.34,0.7],[0.34,0.7],[0.34,0.68],[0.34,0.68],[0.32,0.66],[0.32,0.66],[0.32,0.66],[0.32,0.66],[0.32,0.66],[0.32,0.66],[0.32,0.66],[0.32,0.66],[0.32,0.66],[0.32,0.66],[0.32,0.66],[0.32,0.66],[0.32,0.66],[0.32,0.66],[0.32,0.66],[0.32,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.66],[0.34,0.64],[0.34,0.64],[0.34,0.64],[0.34,0.64],[0.34,0.64],[0.34,0.64],[0.34,0.64],[0.34,0.64],[0.32,0.64],[0.32,0.64],[0.32,0.64],[0.32,0.64],[0.3,0.64],[0.3,0.64],[0.3,0.64],[0.3,0.64],[0.28,0.64],[0.28,0.64],[0.28,0.6],[0.28,0.6],[0.26,0.58],[0.26,0.58],[0.24,0.56],[0.24,0.56],[0.22,0.56],[0.22,0.56],[0.2,0.56],[0.2,0.56],[0.18,0.54],[0.18,0.54],[0.16,0.52],[0.16,0.52],[0.14,0.5],[0.14,0.5]],
  token: 0, animations: new Set(), timers: new Map(), busy: false,
  elements() {
    return { stage: document.getElementById('river-scene'), frog: document.getElementById('river-frog'),
      replay: document.getElementById('btn-replay-crossing') };
  },
  viewportHeight() {
    const viewport = window.visualViewport;
    return viewport && (!viewport.scale || viewport.scale === 1) && viewport.height > 0 ? viewport.height : window.innerHeight;
  },
  shoreAt(screenY, width = window.innerWidth, height = this.viewportHeight()) {
    // Phones zoom the landscape horizontally to give the word rows more water.
    // This matches the 150% x 100% CSS background; desktop uses a cover crop.
    const phone = width <= 700;
    const size = Math.max(width, height);
    const sourceY = phone ? screenY / height : (screenY + (size - height) / 2) / size;
    const sample = Math.max(0, Math.min(this.shore.length - 1, sourceY * (this.shore.length - 1)));
    const i = Math.floor(sample), next = Math.min(i + 1, this.shore.length - 1), fraction = sample - i;
    const edge = n => this.shore[i][n] + (this.shore[next][n] - this.shore[i][n]) * fraction;
    const scaled = phone ? width * 1.5 : size, crop = phone ? width * .25 : (size - width) / 2;
    return { left:edge(0) * scaled - crop, right:edge(1) * scaled - crop };
  },
  layout() {
    const { stage } = this.elements();
    if (!stage || !Number.isFinite(window.innerWidth) || !stage.getBoundingClientRect) return;
    const width = window.innerWidth, height = this.viewportHeight();
    if (height !== this.lastViewportHeight) {
      document.documentElement?.style?.setProperty('--viewport-height', height + 'px');
      this.lastViewportHeight = height;
    }
    const bounds = stage.getBoundingClientRect();
    for (const row of stage.querySelectorAll('.word-row')) {
      const rect = row.getBoundingClientRect();
      const shore = this.shoreAt(rect.top + rect.height / 2, width, height);
      const span = Math.max(124, shore.right - shore.left - 12);
      const rowWidth = Math.min(width - 70, span);
      const left = Math.max(50, Math.min(width - rowWidth - 10, (shore.left + shore.right - rowWidth) / 2));
      row.style.width = rowWidth + 'px'; row.style.marginLeft = (left - bounds.left) + 'px';
      if (row.classList.contains('row-current')) {
        const frog = this.elements().frog;
        if (frog?.classList.contains('frog-following')) {
          const frogSize = width <= 700 ? 38 : 52;
          frog.style.left = Math.max(8, shore.left - frogSize - 10) - left + 'px';
        }
      }
    }
    const header = document.querySelector?.('.puzzle-header');
    if (header && width <= 700) { header.style.transform = ''; }
    else if (header) {
      const rect = header.getBoundingClientRect();
      const shore = this.shoreAt(rect.top + rect.height / 2, width, height);
      const center = Math.max(rect.width / 2 + 6, Math.min(width - rect.width / 2 - 6, (shore.left + shore.right) / 2));
      header.style.transform = `translateX(${center - width / 2}px)`;
    }
  },
  reduced() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; },
  cancel() {
    this.token++; this.busy = false;
    for (const animation of this.animations) animation.cancel();
    this.animations.clear();
    for (const [timer, resolve] of this.timers) { clearTimeout(timer); resolve(); }
    this.timers.clear();
    const { stage, frog } = this.elements();
    stage?.classList.remove('is-crossing');
    stage?.querySelectorAll('.hop-ripple').forEach(el => el.remove());
    if (frog) frog.classList.remove('frog-landed');
    this.idle();
  },
  wait(ms) {
    return new Promise(resolve => {
      const timer = setTimeout(() => { this.timers.delete(timer); resolve(); }, ms);
      this.timers.set(timer, resolve);
    });
  },
  detach() {
    const { stage, frog } = this.elements();
    if (!stage || !frog) return;
    stage.appendChild(frog);
    frog.classList.remove('frog-following');
  },
  idle() {
    const { stage, frog, replay } = this.elements();
    if (!stage || !frog) return;
    const row = stage.querySelector('.row-current');
    if (row) {
      row.appendChild(frog); frog.hidden = false;
      frog.classList.add('frog-following');
      frog.style.left = ''; frog.style.top = ''; frog.style.bottom = ''; frog.style.transform = ''; frog.style.transformOrigin = '';
    } else { frog.hidden = true; }
    if (replay) replay.hidden = !game.isGameOver || game.revealed;
    this.layout();
  },
  ripple(x, y) {
    const { stage } = this.elements();
    const ripple = document.createElement('span'); ripple.className = 'hop-ripple';
    ripple.style.left = x + 'px'; ripple.style.top = y + 'px'; stage.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  },
  async turn(frog, point, token) {
    if (token !== this.token) return;
    const at = `translate3d(${point.x}px,${point.y}px,0)`;
    const animation = frog.animate([
      { transform:at + ' rotate(0deg)' },
      { transform:at + ' rotate(45deg)' },
      { transform:at + ' rotate(90deg)' }
    ], { duration:240, easing:'steps(3, end)', fill:'forwards' });
    this.animations.add(animation);
    try { await animation.finished; } catch { return; }
    if (token !== this.token) return;
    frog.style.transform = at + ' rotate(90deg)';
    animation.cancel(); this.animations.delete(animation);
  },
  async hop(frog, from, to, token) {
    if (token !== this.token) return;
    const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 30 };
    const transform = p => `translate3d(${p.x}px,${p.y}px,0) rotate(90deg)`;
    const animation = frog.animate([
      { transform: transform(from) + ' scale(1.08,.9)', offset: 0 },
      { transform: transform(mid) + ' scale(.96,1.08)', offset: .48 },
      { transform: transform(to) + ' scale(1.08,.9)', offset: .88 },
      { transform: transform(to) + ' scale(1)', offset: 1 }
    ], { duration: 300, easing: 'ease-in-out', fill: 'forwards' });
    this.animations.add(animation);
    try { await animation.finished; } catch { return; }
    if (token !== this.token) return;
    frog.style.transform = transform(to);
    animation.cancel(); this.animations.delete(animation);
    const size = frog.getBoundingClientRect?.().width || 52;
    this.ripple(to.x + size / 2, to.y + size * .86);
    await this.wait(65);
  },
  async celebrate(onComplete = () => {}) {
    this.cancel();
    const token = this.token, key = game.key;
    const { stage, frog } = this.elements();
    const finish = () => {
      if (this.token !== token || game.key !== key || !game.isGameOver || game.revealed) return;
      this.busy = false; stage?.classList.remove('is-crossing'); onComplete();
    };
    if (!stage || !frog || this.reduced() || typeof frog.animate !== 'function') { finish(); return; }
    // The latest completed word is kept in view, including on long routes.
    const board = document.getElementById('board-wrapper'); board.scrollTop = board.scrollHeight;
    const row = stage.querySelector('.row-target-achieved');
    if (!row) { finish(); return; }
    this.layout();
    const bounds = stage.getBoundingClientRect();
    const frogRect = frog.getBoundingClientRect?.();
    const frogSize = frogRect?.width || 52;
    const pads = [...row.querySelectorAll('.tile')].map(pad => {
      const r = pad.getBoundingClientRect();
      return { x: r.left + r.width / 2 - bounds.left - frogSize / 2, y: r.top + r.height / 2 - bounds.top - frogSize * .7 };
    });
    const y = Math.max(10, Math.min(bounds.height - frogSize - 3, pads[0].y));
    // Clamp the hop row so the entire frog remains visible on short screens.
    pads.forEach(p => { p.y = y; });
    const shore = Number.isFinite(window.innerWidth) ? this.shoreAt(bounds.top + y + frogSize / 2) : null;
    const startX = frogRect ? Math.max(0, frogRect.left - bounds.left) : 0;
    const endX = shore ? Math.max(0, Math.min(bounds.width - frogSize, shore.right - bounds.left + 10)) : Math.max(0, bounds.width - frogSize);
    const points = [{ x: startX, y }, ...pads, { x: endX, y }];
    this.detach();
    frog.style.transformOrigin = 'center center';
    frog.hidden = false; frog.style.left = '0px'; frog.style.top = '0px'; frog.style.bottom = '';
    frog.style.transform = `translate3d(${points[0].x}px,${y}px,0)`;
    stage.classList.add('is-crossing'); this.busy = true;
    try {
      await this.turn(frog, points[0], token);
      if (token !== this.token) return;
      for (let i = 1; i < points.length; i++) {
        if (token !== this.token) return;
        await this.hop(frog, points[i - 1], points[i], token);
      }
      if (token !== this.token) return;
      frog.classList.add('frog-landed'); await this.wait(240); finish();
    } catch {
      // A decorative animation failure must never block the recorded result.
      finish();
    }
  }
};
