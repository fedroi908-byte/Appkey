'use strict';
/* Ovozlar: WebAudio bilan sintez qilinadi (fayl kerak emas). Sozlamalardan o'chirish mumkin. */
const SFX = (() => {
  let ac, on = localStorage.getItem('sfx') !== '0'; const vol = .7;
  const ctx = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (ac.state === 'suspended') ac.resume().catch(() => {}); return ac; };
  function tone(f, d = .1, type = 'sine', v = .12, at = 0, f2) {
    if (!on) return; const c = ctx(); if (!c) return; const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, v * vol), t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .03);
  }
  function noise(d = .4, v = .1, at = 0, f1 = 300, f2 = 3000) {
    if (!on) return; const c = ctx(); if (!c) return; const t = c.currentTime + at, n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; fl.type = 'bandpass'; fl.Q.value = 1.2;
    fl.frequency.setValueAtTime(f1, t); fl.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v * vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(c.destination); s.start(t);
  }
  const hap = (k, s) => { try { const h = window.Telegram && Telegram.WebApp && Telegram.WebApp.HapticFeedback; if (!h) return; k === 'n' ? h.notificationOccurred(s) : k === 's' ? h.selectionChanged() : h.impactOccurred(s); } catch (e) {} };
  const SCALES = { mil: [523, 659], res: [523, 659, 784], cla: [523, 659, 784, 1047], cov: [523, 659, 784, 1047, 1319], gold: [392, 523, 659, 784, 1047, 1319, 1568] };
  return {
    get on() { return on; },
    set(v) { on = !!v; localStorage.setItem('sfx', v ? '1' : '0'); if (v) this.click(); },
    unlock() { ctx(); },
    click() { tone(720, .05, 'triangle', .09, 0, 460); hap('i', 'light'); },
    tick(p = 1) { tone(1250 * p, .03, 'square', .045); hap('s'); },
    coin() { tone(1175, .07, 'square', .06); tone(1568, .16, 'square', .06, .07); hap('n', 'success'); },
    whoosh() { noise(1.1, .16, 0, 250, 3500); tone(140, 1, 'sawtooth', .035, 0, 520); },
    win(r = 'mil') {
      const n = SCALES[r] || SCALES.mil; n.forEach((f, i) => { tone(f, .22, 'triangle', .13, i * .075); tone(f * 2, .3, 'sine', .05, i * .075 + .02); });
      if (r === 'cov' || r === 'gold') { noise(.7, .12, .05, 800, 6000); tone(80, .5, 'sine', .22, 0, 40); }
      hap('i', r === 'gold' || r === 'cov' ? 'heavy' : r === 'cla' ? 'medium' : 'light'); if (r !== 'mil') setTimeout(() => hap('n', 'success'), 150);
    },
    lose() { tone(330, .3, 'sawtooth', .08, 0, 110); hap('n', 'error'); },
    err() { tone(240, .16, 'square', .07, 0, 150); hap('n', 'error'); },
    boom() { noise(.6, .22, 0, 120, 60); tone(100, .6, 'sine', .25, 0, 38); hap('i', 'heavy'); },
    pop() { tone(500, .09, 'sine', .1, 0, 900); hap('i', 'light'); }
  };
})();
addEventListener('pointerdown', () => SFX.unlock(), { once: true });
