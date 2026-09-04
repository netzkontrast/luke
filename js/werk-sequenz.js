/* <werk-sequenz> — scrollgetriebene 3D-Vorstellung der Kategorien (Haut / Papier / Flash).
   Liest Farben aus den CSS-Variablen der umgebenden .app, hört auf richtung/bewegung-Attribute.
   three.js wird lokal aus vendor/ geladen, mit CDN als Rückfallebene. Echte Werkbilder
   (LUKE.WERKE / LUKE.FLASH mit `src`) werden auf die ersten Blätter jeder Gruppe gelegt. */
(function () {
  const SELF = document.currentScript && document.currentScript.src;
  const LOCAL = SELF ? new URL('../vendor/three.module.min.js', SELF).href : 'vendor/three.module.min.js';
  const CDN = 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
  /* Alle Kapitel, die die Sequenz kennt. Gezeigt wird nur, wofür es Aufnahmen gibt:
     Ein Kapitel „Haut“ über generierten Tuschflächen behauptete Arbeiten, die auf der
     Seite nicht zu sehen sind. Sobald Fotos dazukommen, ist das Kapitel von selbst
     wieder da. */
  const ALLE_CH = [
    { key: 'haut', t: 'Haut', sub: 'Blackwork auf Arm, Rücken, Brust — seit 2012.', red: [0] },
    { key: 'papier', t: 'Papier', sub: 'Tusche, Originale — zuletzt „Befreiung der Körperlichkeit“.', red: [0, 3] },
    { key: 'flash', t: 'Flash', sub: 'Fertige Blätter, jedes wird genau einmal gestochen.', red: [] }
  ];
  const DIR = {
    a: { rot: 1, sway: 0.12, lerp: 0.09, cam: 1, wob: 0.004, fog: [12, 26], h: '260svh' },
    b: { rot: 0.35, sway: 0.05, lerp: 0.05, cam: 0.4, wob: 0.002, fog: [7, 19], h: '300svh' },
    c: { rot: 3, sway: 0.2, lerp: 0.16, cam: 1.7, wob: 0.03, fog: [13, 30], h: '220svh' }
  };
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* Tuschtextur für Blätter ohne echtes Foto: nur Striche, keine Flächen — breite Striche mit
     wenig Deckkraft lesen sich als Waschung, ohne harte Polygonkanten zu zeigen. */
  function realImages(key) {
    const L = window.LUKE || {};
    if (key === 'flash') return (L.FLASH || []).filter(f => f.src).map(f => f.src);
    /* Aufnahmen mit dunklem Grund bleiben draußen: In der Sequenz liegen Blätter auf
       hellem Grund, ein schwarzes Rechteck wäre dort ein Fremdkörper. */
    return (L.WERKE || []).filter(w => w.tr === key && w.src && w.grund !== 'foto').map(w => w.src);
  }
  const CH = ALLE_CH.filter(ch => realImages(ch.key).length);
  /* Die Kamera fährt an jeder Gruppe vorbei und ein Stück darüber hinaus. Bei drei
     Kapiteln sind das die 52 Einheiten, mit denen die Sequenz gebaut wurde. */
  const REISE = 18 * Math.max(0, CH.length - 1) + 16;
  class WerkSequenz extends HTMLElement {
    static get observedAttributes() { return ['richtung', 'bewegung']; }
    connectedCallback() {
      if (this._init) {
        addEventListener('scroll', this.onScroll, { passive: true });
        addEventListener('pointermove', this.onMove, { passive: true });
        if (this.io) this.io.observe(this);
        this.calc(); this.loop();
        return;
      }
      this._init = true;
      this.mobile = innerWidth < 700;
      this.style.cssText = 'display:block;position:relative;';
      this.stick = document.createElement('div');
      this.stick.style.cssText = 'position:sticky;top:0;height:100svh;overflow:hidden;';
      this.appendChild(this.stick);
      this.cv = document.createElement('canvas');
      this.cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
      this.stick.appendChild(this.cv);
      this.labels = CH.map(ch => {
        const el = document.createElement('div');
        el.style.cssText = 'position:absolute;left:clamp(20px,6vw,80px);bottom:clamp(64px,14vh,140px);max-width:min(78vw,420px);opacity:0;pointer-events:none;';
        el.innerHTML = '<div style="font-family:var(--fd);font-weight:var(--wtd);text-transform:var(--ttd);font-size:clamp(38px,6vw,72px);line-height:.95;color:var(--ink);">' + ch.t + '</div>' +
          '<div style="color:var(--mut);font-size:clamp(15px,2vw,17px);margin-top:10px;text-wrap:pretty;">' + ch.sub + '</div>' +
          '<button type="button" data-k="' + ch.key + '" style="margin-top:14px;background:none;border:1px solid var(--line);color:var(--ink);font:inherit;font-size:15px;padding:8px 18px;cursor:pointer;pointer-events:auto;">Ansehen</button>';
        el.querySelector('button').addEventListener('click', () => this.dispatchEvent(new CustomEvent('sequenz-select', { bubbles: true, detail: { key: ch.key } })));
        this.stick.appendChild(el); return el;
      });
      this.hint = document.createElement('div');
      this.hint.style.cssText = 'position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--mut);font-size:13px;transition:opacity .5s;';
      this.hint.innerHTML = '<span>Scrollen</span><span style="display:block;width:1px;height:26px;background:var(--mut);"></span>';
      this.stick.appendChild(this.hint);
      this.onScroll = () => { this.calc(); if (this.m === 0) this.draw(0); };
      addEventListener('scroll', this.onScroll, { passive: true });
      addEventListener('resize', () => this.resize(), { passive: true });
      this.onMove = e => { this.tx = (e.clientX / innerWidth - 0.5); this.ty = (e.clientY / innerHeight - 0.5); };
      addEventListener('pointermove', this.onMove, { passive: true });
      this.tx = 0; this.ty = 0; this.p = 0; this._sp = 0;
      this.boot();
    }
    attributeChangedCallback() { if (this.scene) this.applyTheme(); this.applyMode(); }
    mVal() { return { aus: 0, dezent: 0.55, voll: 1 }[this.getAttribute('bewegung') || 'voll'] ?? 1; }
    P() { return DIR[this.getAttribute('richtung') || 'a'] || DIR.a; }
    applyMode() {
      this.m = this.mVal();
      if (this.m === 0) { this.style.height = '100svh'; return; }
      /* Weniger Kapitel, kürzere Strecke: Sonst scrollt man an leerer Tiefe vorbei. */
      const roh = parseFloat(this.P().h) || 260;
      this.style.height = Math.max(140, Math.round(roh * CH.length / 3)) + 'svh';
    }
    css(n) { return getComputedStyle(this).getPropertyValue(n).trim() || '#888'; }
    theme() { return { bg: this.css('--bg'), ph: this.css('--phbg'), ink: this.css('--ink'), mut: this.css('--mut'), red: this.css('--red') }; }
    async boot() {
      /* Kein Kapitel, keine Sequenz. Der Abschnitt verschwindet, statt leer dazustehen. */
      if (!CH.length) {
        this.style.display = 'none';
        const sec = this.closest('section');
        if (sec) sec.hidden = true;
        return;
      }
      this.applyMode();
      let T = null;
      try { T = await import(LOCAL); } catch (e) { try { T = await import(CDN); } catch (e2) { T = null; } }
      if (!T || !T.WebGLRenderer) { this.style.display = 'none'; return; }
      this.T = T;
      try {
        this.renderer = new T.WebGLRenderer({ canvas: this.cv, antialias: !this.mobile, alpha: false });
      } catch (e) { this.style.display = 'none'; return; }
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.mobile ? 1.5 : 2));
      this.scene = new T.Scene();
      this.camera = new T.PerspectiveCamera(46, 1, 0.1, 80);
      this.build(); this.applyTheme(); this.resize(); this.calc();
      this.io = new IntersectionObserver(es => { this.vis = es[0].isIntersecting; if (this.vis) this.loop(); }, { rootMargin: '80px' });
      this.io.observe(this);
    }
    build() {
      const T = this.T; this.groups = [];
      const per = this.mobile ? 5 : 7;
      const loader = new T.TextureLoader();
      CH.forEach((ch, gi) => {
        const g = new T.Group(); g.position.z = -18 * gi;
        const r = rng(1000 + gi * 77);
        const imgs = realImages(ch.key);
        for (let i = 0; i < per; i++) {
          const geo = new T.PlaneGeometry(2, 2.5);
          const mat = new T.MeshBasicMaterial({ transparent: true, opacity: 0 });
          const mesh = new T.Mesh(geo, mat);
          const col = i % 3;
          mesh.position.set((col - 1) * (this.mobile ? 2.2 : 3.1) + (r() - 0.5) * 1.4, (r() - 0.5) * 4.2, (r() - 0.5) * 7);
          mesh.userData = { seed: gi * 31 + i * 7 + 5, red: ch.red.includes(i), ph: r() * 6.28, sp: 0.25 + r() * 0.3, by: mesh.position.y, rz: (r() - 0.5) * 0.14, ry: (r() - 0.5) * 0.3, real: false };
          const bild = imgs[i % imgs.length];
          {
            mesh.userData.real = true;
            loader.load(bild, tex => {
              tex.colorSpace = T.SRGBColorSpace;
              const asp = tex.image && tex.image.height ? tex.image.width / tex.image.height : 0.8;
              const w = asp >= 1 ? Math.min(3.6, 2.5 * asp) : 2, h = w / asp;
              mesh.geometry.dispose(); mesh.geometry = new T.PlaneGeometry(w, h);
              if (mesh.material.map) mesh.material.map.dispose();
              mesh.material.map = tex; mesh.material.needsUpdate = true;
            }, undefined, () => { mesh.userData.real = false; this.applyTheme(); });
          }
          g.add(mesh);
        }
        this.scene.add(g); this.groups.push(g);
      });
      const pts = []; const r2 = rng(9);
      for (let z = 8; z >= -46; z -= 1.5) pts.push(new T.Vector3((r2() - 0.5) * 0.8, 6 - (8 - z) * 0.22, z));
      this.thread = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ transparent: true, opacity: 0.85 }));
      this.scene.add(this.thread);
    }
    applyTheme() {
      const t = this.theme(); const T = this.T; const P = this.P();
      this.scene.background = new T.Color(t.bg);
      this.scene.fog = new T.Fog(new T.Color(t.bg), P.fog[0], P.fog[1]);
      this.thread.material.color = new T.Color(t.red);
      /* Blätter, deren Aufnahme nicht lädt, bleiben leer statt erfunden. */
      this.groups.forEach(g => g.children.forEach(m => {
        m.rotation.z = m.userData.rz * P.rot; m.rotation.y = m.userData.ry * P.rot;
        m.visible = !!m.userData.real;
      }));
      this.draw(performance.now() / 1000);
    }
    resize() {
      if (!this.renderer) return;
      const w = this.stick.clientWidth, h = this.stick.clientHeight;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
      this.draw(performance.now() / 1000);
    }
    calc() {
      const r = this.getBoundingClientRect();
      const total = r.height - innerHeight;
      this.p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      if (this.hint) this.hint.style.opacity = (this.p > 0.04 || this.m === 0) ? '0' : '1';
    }
    draw(t) {
      if (!this.renderer) return;
      const m = this.m, p = this.p;
      if (m === 0) {
        this.camera.position.set(0, 0, 12); this.camera.lookAt(0, 0, 0);
        this.groups.forEach((g, i) => { g.position.set((i - 1) * 7.4, 0, 0); g.children.forEach(c => { c.material.opacity = 1; c.position.y = c.userData.by * 0.5; }); });
        this.labels.forEach((el, i) => { el.style.opacity = i === 1 ? 1 : 0; el.style.pointerEvents = i === 1 ? '' : 'none'; });
        this.thread.visible = false;
        this.renderer.render(this.scene, this.camera); return;
      }
      this.thread.visible = true;
      const P = this.P();
      this.groups.forEach((g, i) => g.position.set(0, 0, -18 * i));
      this._sp += (p - this._sp) * P.lerp;
      const sp = Math.abs(p - this._sp) < 0.0004 ? p : this._sp;
      const camZ = 10 - sp * REISE;
      this._cx = (this._cx ?? 0) + ((this.tx * 1.4 * m * P.cam + Math.sin(this._sp * 9.4) * 0.5 * m * P.cam) - (this._cx ?? 0)) * 0.06;
      this._cy = (this._cy ?? 0) + ((-this.ty * 0.9 * m * P.cam) - (this._cy ?? 0)) * 0.06;
      this.camera.position.set(this._cx, this._cy, camZ);
      this.camera.lookAt(this._cx * 0.4, this._cy * 0.4, camZ - 10);
      this.groups.forEach((g, i) => {
        const d = camZ - g.position.z;
        const op = Math.max(0, Math.min(1, 1 - Math.abs(d - 8) / 7.5));
        g.children.forEach(c => {
          c.material.opacity = Math.min(1, op * 1.6);
          c.position.y = c.userData.by + Math.sin(t * c.userData.sp + c.userData.ph) * P.sway * m;
          c.rotation.z = c.userData.rz * P.rot + Math.sin(t * c.userData.sp * 2 + c.userData.ph) * P.wob * m;
        });
        const lv = Math.min(1, Math.max(0, (op - 0.45) / 0.3));
        this.labels[i].style.opacity = lv;
        this.labels[i].style.transform = 'translateY(' + ((1 - lv) * 18) + 'px)';
        this.labels[i].style.pointerEvents = lv > 0.6 ? '' : 'none';
      });
      this.renderer.render(this.scene, this.camera);
    }
    loop() {
      if (!this.vis || this._raf) return;
      const step = now => { this._raf = 0; if (!this.vis) return; this.calc(); this.draw(now / 1000); this._raf = requestAnimationFrame(step); };
      this._raf = requestAnimationFrame(step);
    }
    disconnectedCallback() {
      removeEventListener('scroll', this.onScroll); removeEventListener('pointermove', this.onMove);
      if (this.io) this.io.unobserve(this);
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0; this.vis = false;
    }
  }
  if (!customElements.get('werk-sequenz')) customElements.define('werk-sequenz', WerkSequenz);
})();
