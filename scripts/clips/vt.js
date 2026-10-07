// Reloj virtual para grabar: reemplaza performance.now, Date.now, requestAnimationFrame y timers
// para que la grabación avance cuadro a cuadro (30 fps perfectos, cámara lenta, sin saltos).
(() => {
  const realNow = performance.now.bind(performance);
  const realDate = Date.now;
  const base = realDate();
  let vt = realNow();
  performance.now = () => vt;
  Date.now = () => base + vt;
  let id = 0;
  let rafs = new Map();
  const timers = new Map();
  window.requestAnimationFrame = (cb) => {
    const i = ++id;
    rafs.set(i, cb);
    return i;
  };
  window.cancelAnimationFrame = (i) => rafs.delete(i);
  window.setTimeout = (cb, ms = 0, ...args) => {
    const i = ++id;
    timers.set(i, { due: vt + Math.max(0, +ms || 0), cb: typeof cb === 'function' ? cb : () => eval(cb), args });
    return i;
  };
  window.clearTimeout = (i) => timers.delete(i);
  window.setInterval = (cb, ms = 0, ...args) => {
    const i = ++id;
    const iv = Math.max(1, +ms || 1);
    timers.set(i, { due: vt + iv, cb, args, iv });
    return i;
  };
  window.clearInterval = (i) => timers.delete(i);
  const seen = new WeakSet();
  window.__vt = {
    /** avanza `ms` de tiempo de juego (un cuadro) */
    step(ms) {
      const target = vt + ms;
      // timers en orden
      for (let guard = 0; guard < 500; guard++) {
        let next = null;
        for (const [i, t] of timers) if (t.due <= target && (!next || t.due < next[1].due)) next = [i, t];
        if (!next) break;
        const [i, t] = next;
        vt = Math.max(vt, t.due);
        if (t.iv) t.due += t.iv;
        else timers.delete(i);
        try {
          t.cb(...t.args);
        } catch (e) {
          console.error(e);
        }
      }
      vt = target;
      const cbs = rafs;
      rafs = new Map();
      for (const cb of cbs.values()) {
        try {
          cb(vt);
        } catch (e) {
          console.error(e);
        }
      }
      // animaciones CSS (también siguen el reloj virtual)
      for (const a of document.getAnimations()) {
        try {
          if (!seen.has(a)) {
            seen.add(a);
            a.pause();
          } else a.currentTime = (a.currentTime || 0) + ms;
        } catch {}
      }
    },
    now: () => vt,
  };
})();
