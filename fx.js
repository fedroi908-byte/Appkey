'use strict';
/* Effektlar: konfetti/portlash, 3D burilish (tilt), sanash animatsiyasi, ekran silkinishi */
const FX = (() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cv, cx, parts = [], raf = 0;
  function init() { if (cv) return; cv = document.createElement('canvas'); cv.id = 'fxc'; cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:200'; document.body.appendChild(cv); cx = cv.getContext('2d'); size(); addEventListener('resize', size); }
  function size() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }
  function burst(x, y, colors, n = 70, power = 11) {
    if (reduced) return; init(); const d = devicePixelRatio, cs = Array.isArray(colors) ? colors : [colors];
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = (.35 + Math.random()) * power; parts.push({ x: x * d, y: y * d, vx: Math.cos(a) * s * d, vy: (Math.sin(a) * s - 3) * d, g: .28 * d, w: (4 + Math.random() * 6) * d, h: (3 + Math.random() * 5) * d, r: Math.random() * 6, vr: (Math.random() - .5) * .5, c: cs[i % cs.length], life: 1, dec: .008 + Math.random() * .012, round: Math.random() < .3 }); }
    loop();
  }
  function rain(colors, n = 90) {
    if (reduced) return; init(); const d = devicePixelRatio, cs = Array.isArray(colors) ? colors : [colors];
    for (let i = 0; i < n; i++) parts.push({ x: Math.random() * innerWidth * d, y: -20 * d - Math.random() * 300 * d, vx: (Math.random() - .5) * 3 * d, vy: (2 + Math.random() * 4) * d, g: .05 * d, w: (5 + Math.random() * 6) * d, h: (4 + Math.random() * 6) * d, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cs[i % cs.length], life: 1, dec: .004, round: false });
    loop();
  }
  function loop() {
    if (raf) return;
    const step = () => {
      cx.clearRect(0, 0, cv.width, cv.height); parts = parts.filter(p => p.life > 0 && p.y < cv.height + 50);
      for (const p of parts) { p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= .992; p.r += p.vr; p.life -= p.dec; cx.save(); cx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6)); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; if (p.round) { cx.beginPath(); cx.arc(0, 0, p.w / 2, 0, 7); cx.fill(); } else cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore(); }
      if (parts.length) raf = requestAnimationFrame(step); else { raf = 0; cx.clearRect(0, 0, cv.width, cv.height); }
    };
    raf = requestAnimationFrame(step);
  }
  function shake(ms = 500) { if (reduced) return; document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), ms); }
  function count(el, from, to, ms = 900) {
    if (reduced || from === to) { el.textContent = fmtN(to); return; }
    const t0 = performance.now(), ease = t => 1 - Math.pow(1 - t, 3);
    const f = now => { const k = Math.min(1, (now - t0) / ms); el.textContent = fmtN(from + (to - from) * ease(k)); if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }
  const fmtN = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  // 3D burilish: barmoq/sichqoncha bo'yicha kartani egadi, yaltiroq nur (glare) ergashadi
  function bind() {
    if (reduced) return;
    document.querySelectorAll('.tilt:not([data-b])').forEach(el => {
      el.dataset.b = 1;
      const mv = e => { const r = el.getBoundingClientRect(), p = e.touches ? e.touches[0] : e, x = (p.clientX - r.left) / r.width - .5, y = (p.clientY - r.top) / r.height - .5;
        el.classList.add('tilting'); el.style.setProperty('--rx', (-y * 22).toFixed(1) + 'deg'); el.style.setProperty('--ry', (x * 26).toFixed(1) + 'deg'); el.style.setProperty('--gx', (x * 100 + 50).toFixed(0) + '%'); el.style.setProperty('--gy', (y * 100 + 50).toFixed(0) + '%'); };
      const lv = () => { el.classList.remove('tilting'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); };
      el.addEventListener('pointermove', mv); el.addEventListener('touchmove', mv, { passive: true }); el.addEventListener('pointerleave', lv); el.addEventListener('touchend', lv); el.addEventListener('pointerup', lv);
    });
  }
  // Tugmalar bosilganda ovoz + to'lqin
  addEventListener('pointerdown', e => {
    const b = e.target.closest && e.target.closest('.btn,.pbtn,.chip,.case,.ic,.tabs button,.pill button,.menu,.mi,.seg button,.qty button,.task button,.banner,.gcard');
    if (!b) return; SFX.click();
    const r = b.getBoundingClientRect(), s = document.createElement('i'); s.className = 'rip'; const d = Math.max(r.width, r.height) * 1.6;
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`; if (getComputedStyle(b).position === 'static') b.style.position = 'relative'; b.style.overflow = b.style.overflow || 'hidden'; b.appendChild(s); setTimeout(() => s.remove(), 600);
  }, { passive: true });
  return { burst, rain, shake, count, bind };
})();
