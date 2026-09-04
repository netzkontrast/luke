/* LUKE.motion — Bewegungs-Renderer für die Seite.
   1. Sanftes Scrollen: Mausrad-Eingaben werden geglättet (Lerp), Touch, Tastatur und Anker bleiben nativ.
   2. 3D-Parallaxe: eine three.js-Bühne hinter der Seite (echte Tuschblätter in der Tiefe),
      Kamera folgt dem geglätteten Scrollwert, Zeiger neigt die Kamera. Rote Punkte trieben
      hier früher mit; sie sind raus, das Rot der Seite ist die Tropfspur.
   3. DOM-Parallaxe: Elemente mit data-depth (Tiefe, z. B. 0.1) bewegen sich relativ zur Bildmitte,
      Elemente mit data-tilt (Grad) neigen sich zum Zeiger.
   Respektiert „reduzierte Bewegung“ und das Bedienfeld (bewegung: aus / dezent / voll). */
(function () {
  'use strict';
  const L = window.LUKE = window.LUKE || {};
  const app = document.querySelector('.app');
  if (!app) return;
  const SELF = document.currentScript && document.currentScript.src;
  const LOCAL = SELF ? new URL('../vendor/three.module.min.js', SELF).href : 'vendor/three.module.min.js';
  const CDN = 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
  const prm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const strength = () => ({ aus: 0, dezent: 0.55, voll: 1 })[app.dataset.bewegung] ?? 1;
  const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- Scroll-Manager ---------- */
  const M = {
    y: scrollY, target: scrollY, wheel: false, lerp: 0.11,
    pointer: { x: 0, y: 0, tx: 0, ty: 0 },
    subs: [],
    on(fn) { this.subs.push(fn); return () => { this.subs = this.subs.filter(f => f !== fn); }; },
    get progress() { const m = maxScroll(); return m ? this.y / m : 0; },
    scrollTo(top, sofort) {
      top = clamp(top, 0, maxScroll());
      if (sofort || prm || strength() === 0) { window.scrollTo({ top, left: 0, behavior: 'instant' }); M.y = M.target = top; M.wheel = false; return; }
      M.target = top; M.wheel = true;
    }
  };
  L.motion = M;

  addEventListener('wheel', e => {
    if (prm || coarse || strength() < 1 || e.ctrlKey || e.defaultPrevented) return;
    if (e.target && e.target.closest && e.target.closest('.ov-card, [data-layout="schiene"], textarea, select, .panel, [data-native-scroll]')) return;
    e.preventDefault();
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    if (!M.wheel) { M.target = scrollY; M.y = scrollY; }
    M.wheel = true;
    M.target = clamp(M.target + dy, 0, maxScroll());
  }, { passive: false });
  addEventListener('scroll', () => { if (M.wheel && Math.abs(scrollY - M.y) > 2) M.wheel = false; }, { passive: true });
  addEventListener('pointermove', e => { M.pointer.tx = e.clientX / innerWidth - 0.5; M.pointer.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  let last = 0;
  function frame(t) {
    const dt = clamp((t - last) || 16.7, 1, 48) / 16.7; last = t;
    const k = 1 - Math.pow(1 - M.lerp, dt);
    if (M.wheel) {
      M.y += (M.target - M.y) * k;
      if (Math.abs(M.target - M.y) < 0.3) { M.y = M.target; M.wheel = false; }
      window.scrollTo({ top: M.y, left: 0, behavior: 'instant' });
    } else {
      M.target = scrollY;
      M.y += (M.target - M.y) * Math.min(1, k * 1.7);
      if (Math.abs(M.target - M.y) < 0.05) M.y = M.target;
    }
    M.pointer.x += (M.pointer.tx - M.pointer.x) * 0.06;
    M.pointer.y += (M.pointer.ty - M.pointer.y) * 0.06;
    for (const fn of M.subs) fn(M.y, t / 1000);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- DOM-Parallaxe ---------- */
  const px = [];
  function collect() {
    px.length = 0;
    document.querySelectorAll('[data-depth],[data-tilt]').forEach(el => px.push({ el, depth: parseFloat(el.dataset.depth || '0') || 0, tilt: parseFloat(el.dataset.tilt || '0') || 0, top: 0, h: 0 }));
    measure();
  }
  function measure() {
    px.forEach(p => { p.el.style.transform = ''; });
    px.forEach(p => { const r = p.el.getBoundingClientRect(); p.top = r.top + scrollY; p.h = r.height; });
    parallax(M.y);
  }
  function parallax(y) {
    const s = strength(); const vh = innerHeight;
    for (const p of px) {
      const c = p.top + p.h / 2 - (y + vh / 2);
      if (Math.abs(c) > vh * 1.6) continue;
      const ty = -c * p.depth * s;
      let tf = '';
      if (p.tilt) tf = `perspective(1200px) rotateY(${(M.pointer.x * p.tilt * s).toFixed(2)}deg) rotateX(${(-M.pointer.y * p.tilt * 0.7 * s).toFixed(2)}deg) `;
      tf += `translate3d(0,${ty.toFixed(2)}px,0)`;
      p.el.style.transform = tf;
    }
  }
  M.on(parallax);
  M.remeasure = measure; M.collect = collect;
  let rt = 0;
  const relayout = () => { clearTimeout(rt); rt = setTimeout(() => { measure(); if (stage) stage.layout(); }, 120); };
  addEventListener('resize', relayout);
  addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  if (typeof ResizeObserver === 'function') new ResizeObserver(relayout).observe(document.body);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', collect); else collect();

  /* ---------- 3D-Bühne ---------- */
  let stage = null;
  async function bootStage() {
    if (prm) return;
    let T = null;
    try { T = await import(LOCAL); } catch (e) { try { T = await import(CDN); } catch (e2) { return; } }
    if (!T || !T.WebGLRenderer) return;
    const cv = document.createElement('canvas'); cv.id = 'stage'; cv.setAttribute('aria-hidden', 'true');
    app.insertBefore(cv, app.firstChild);
    let renderer;
    try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: 'low-power' }); } catch (e) { cv.remove(); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2));
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 60);
    const DIST = 10; camera.position.z = DIST;
    const visH = () => 2 * Math.tan(camera.fov * Math.PI / 360) * DIST;
    const unit = () => visH() / innerHeight;
    const colors = () => { const cs = getComputedStyle(app); const g = n => cs.getPropertyValue(n).trim() || '#888'; return { bg: g('--bg') }; };

    /* Tuschblätter in der Tiefe */
    /* Nur echte Blätter. Vorher standen hier erzeugte Tuschflächen, wo die Aufnahmen nicht
       reichten — auf einer Werkschau haben erfundene Blätter nichts verloren, auch nicht
       blass im Hintergrund. Aufnahmen mit dunklem Grund bleiben draußen, sie wären hier
       schwarze Rechtecke. */
    const real = (L.helleAufnahmen ? L.helleAufnahmen('papier') : []).map(w => w.src);
    if (!real.length) { cv.remove(); return; }
    const N = Math.min(coarse ? 7 : 12, real.length * 3);
    const rnd = rng(7);
    const sheets = [];
    const loader = new T.TextureLoader();
    /* Zwölf Blätter, fünf Bilder: Ohne diesen Zwischenspeicher lädt und lädt der Browser
       dasselbe Bild mehrfach und legt für jedes eine eigene Textur auf der Grafikkarte an. */
    const texturen = new Map();
    function texHolen(url, fertig, schief) {
      const da = texturen.get(url);
      if (da) { da.then(fertig, schief); return; }
      const p = new Promise((ok, nein) => loader.load(url, tex => {
        tex.colorSpace = T.SRGBColorSpace; ok(tex);
      }, undefined, nein));
      texturen.set(url, p);
      p.catch(() => texturen.delete(url));
      p.then(fertig, schief);
    }
    for (let i = 0; i < N; i++) {
      const mat = new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const m = new T.Mesh(new T.PlaneGeometry(2.2, 2.75), mat);
      const side = rnd() < 0.5 ? -1 : 1;
      m.userData = { docP: (i + 0.3 + rnd() * 0.4) / N, xr: side * (0.4 + rnd() * 0.7), z: -2 - rnd() * 16, rz: (rnd() - 0.5) * 0.5, sp: 0.15 + rnd() * 0.2, ph: rnd() * 6.28, base: 0.26 + rnd() * 0.22, by: 0 };
      m.position.z = m.userData.z; m.rotation.z = m.userData.rz;
      texHolen(real[i % real.length], tex => {
        const asp = tex.image && tex.image.height ? tex.image.width / tex.image.height : 0.8;
        const w = asp >= 1 ? Math.min(4.6, 2.6 * asp) : 2.2;
        m.geometry.dispose(); m.geometry = new T.PlaneGeometry(w, w / asp);
        m.material.map = tex; m.material.needsUpdate = true;
      }, () => { m.visible = false; });
      scene.add(m); sheets.push(m);
    }

    function theme() {
      const c = colors();
      renderer.setClearColor(new T.Color(c.bg));
      cv.style.background = c.bg;
      scene.fog = new T.Fog(new T.Color(c.bg), 6, 26);
      const on = strength() > 0;
      cv.hidden = !on;
      document.documentElement.classList.toggle('has-stage', on);
      render(M.y, performance.now() / 1000, true);
    }
    function layout() {
      const u = unit(), docH = maxScroll() + innerHeight, halfW = visH() * camera.aspect / 2;
      sheets.forEach(m => { const d = m.userData; m.position.x = d.xr * halfW * ((DIST - d.z) / DIST); d.by = -d.docP * docH * u; });
    }
    function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); layout(); }
    function render(y, t, force) {
      if (!force && (cv.hidden || document.hidden)) return;
      const u = unit(), s = strength(), vh = visH();
      camera.position.y = -y * u;
      camera.position.x += (M.pointer.x * 0.8 * s - camera.position.x) * 0.05;
      camera.rotation.y = -M.pointer.x * 0.04 * s; camera.rotation.x = M.pointer.y * 0.03 * s;
      sheets.forEach(m => {
        const d = m.userData;
        m.position.y = d.by + Math.sin(t * d.sp + d.ph) * 0.15 * s;
        m.rotation.z = d.rz + Math.sin(t * d.sp * 1.3 + d.ph) * 0.02 * s;
        const dy = Math.abs(m.position.y - camera.position.y) / ((DIST - d.z) / DIST);
        m.material.opacity = d.base * clamp(1 - dy / (vh * 0.9), 0, 1);
      });
      renderer.render(scene, camera);
    }
    resize(); theme();
    addEventListener('resize', resize);
    new MutationObserver(theme).observe(app, { attributes: true, attributeFilter: ['data-richtung', 'data-bewegung', 'data-rot'] });
    M.on(render);
    stage = { layout, theme, render };
    L.stage = stage;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootStage); else bootStage();
})();
