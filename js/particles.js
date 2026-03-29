// particles.js — clean: black dots, NO title emission, only windows + background
(() => {
  "use strict";

  const prefersReduced =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const fx = document.getElementById("fx");
  if (!fx) return;

  const ctx = fx.getContext("2d", { alpha: true });
  if (!ctx) return;

  // Force visibility (no negative z-index issues)
  fx.style.position = "fixed";
  fx.style.inset = "0";
  fx.style.pointerEvents = "none";
  fx.style.zIndex = "5";
  const desk = document.getElementById("desk");
  if (desk) desk.style.zIndex = "10";

  const S = {
    // ambient background dots
    bgCount: prefersReduced ? 70 : 140,
    bgSpeedMin: 1.0,
    bgSpeedMax: 2.2,
    bgAlphaMin: 0.03,
    bgAlphaMax: 0.08,
    bgSizeMin: 0.5,
    bgSizeMax: 1.2,

    // edge dots
    maxParticles: prefersReduced ? 500 : 1500,
    windowRate: prefersReduced ? 10 : 32, // more spawn
    speedMin: prefersReduced ? 10 : 14,
    speedMax: prefersReduced ? 18 : 22,
    drag: 0.989,

    // dot size (bigger, but not huge)
    sizeMin: 1.0,
    sizeMax: 2.4,

    alphaMin: 0.18,
    alphaMax: 0.55,

    lifeMin: 0.75,
    lifeMax: 1.45,
    fadeIn: 0.10,
    fadeOutStart: 0.62,

    // edge placement: closer to chrome center but not too inside
    edgeMargin: 30,
    edgeInsetMin: 8,
    edgeInsetMax: 14,

    angleJitter: 0.16,

    shadowBlur: 6,
    shadowAlpha: 0.22,
    coreAlphaBoost: 0.16
  };

  let W = 0, H = 0, DPR = 1;

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function smoothstep(a, b, t) {
    t = clamp((t - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function rotate(vx, vy, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: vx * c - vy * s, y: vx * s + vy * c };
  }

  function resize() {
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = window.innerWidth;
    H = window.innerHeight;

    fx.width = Math.floor(W * DPR);
    fx.height = Math.floor(H * DPR);
    fx.style.width = W + "px";
    fx.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    rebuildBg();
  }
  window.addEventListener("resize", resize);

  // background dots
  const bg = [];
  function rebuildBg() {
    bg.length = 0;
    for (let i = 0; i < S.bgCount; i++) {
      bg.push({
        x: rand(0, W),
        y: rand(0, H),
        r: rand(S.bgSizeMin, S.bgSizeMax),
        a: rand(S.bgAlphaMin, S.bgAlphaMax),
        vx: rand(-0.2, 0.2) * rand(S.bgSpeedMin, S.bgSpeedMax),
        vy: rand(0.35, 1.0) * rand(S.bgSpeedMin, S.bgSpeedMax),
      });
    }
  }

  const particles = [];
  function trim() {
    if (particles.length > S.maxParticles) {
      particles.splice(0, particles.length - S.maxParticles);
    }
  }

  function perimeterRandom(rect, margin) {
    const w = rect.width;
    const h = rect.height;
    const perim = 2 * (w + h);
    let d = rand(0, perim);

    if (d < w) return { x: rect.left + clamp(d, margin, w - margin), y: rect.top, nx: 0, ny: -1 };
    d -= w;

    if (d < h) return { x: rect.right, y: rect.top + clamp(d, margin, h - margin), nx: 1, ny: 0 };
    d -= h;

    if (d < w) return { x: rect.left + clamp(d, margin, w - margin), y: rect.bottom, nx: 0, ny: 1 };
    d -= w;

    return { x: rect.left, y: rect.top + clamp(d, margin, h - margin), nx: -1, ny: 0 };
  }

  function spawnFromWindow(el, boost = 1) {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    if (r.right < -80 || r.left > W + 80 || r.bottom < -80 || r.top > H + 80) return;

    const margin = Math.min(S.edgeMargin, r.width * 0.22, r.height * 0.22);
    const p0 = perimeterRandom(r, margin);

    // inward onto chrome (tune with edgeInsetMin/Max)
    const inset = rand(S.edgeInsetMin, S.edgeInsetMax);
    const sx = p0.x - p0.nx * inset;
    const sy = p0.y - p0.ny * inset;

    const dir = rotate(p0.nx, p0.ny, rand(-S.angleJitter, S.angleJitter));
    const speed = rand(S.speedMin, S.speedMax) * boost;

    particles.push({
      x: sx, y: sy,
      vx: dir.x * speed + rand(-1.2, 1.2),
      vy: dir.y * speed + rand(-1.2, 1.2),
      age: 0,
      life: rand(S.lifeMin, S.lifeMax),
      r: rand(S.sizeMin, S.sizeMax),
      a0: rand(S.alphaMin, S.alphaMax),
      tw: rand(0.9, 1.2),
    });

    trim();
  }

  const sources = [];
  function rebuildSources() {
    sources.length = 0;
    document.querySelectorAll(".window").forEach(w => {
      sources.push({ el: w, rate: S.windowRate });
    });
  }
  rebuildSources();
  new MutationObserver(rebuildSources).observe(document.body, { childList: true, subtree: true });

  function emitContinuous(src, dt) {
    const boost = src.el?.classList?.contains("is-front") ? 1.15 : 1.0;
    const expected = dt * src.rate * boost;
    let n = Math.floor(expected);
    if (Math.random() < (expected - n)) n++;

    for (let i = 0; i < n; i++) spawnFromWindow(src.el, boost);
  }

  resize();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    ctx.clearRect(0, 0, W, H);

    // background dots
    ctx.save();
    ctx.fillStyle = "#000";
    for (const s of bg) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      if (s.x < -20) s.x = W + 20;
      if (s.x > W + 20) s.x = -20;
      if (s.y < -20) s.y = H + 20;
      if (s.y > H + 20) s.y = -20;

      ctx.globalAlpha = s.a;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // emit from windows
    for (const s of sources) emitContinuous(s, dt);

    // draw particles (bloom + crisp core)
    ctx.save();
    ctx.fillStyle = "#000";
    ctx.shadowColor = `rgba(0,0,0,${S.shadowAlpha})`;
    ctx.shadowBlur = S.shadowBlur;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        particles.splice(i, 1);
        continue;
      }

      p.vx *= S.drag;
      p.vy *= S.drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const u = p.age / p.life;
      const fin = smoothstep(0, S.fadeIn, u);
      const fout = 1 - smoothstep(S.fadeOutStart, 1, u);
      const tw = 0.92 + 0.08 * Math.sin(p.age * 8 * p.tw);
      const a = p.a0 * fin * fout * tw;

      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = Math.min(1, a + S.coreAlphaBoost);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.65, p.r * 0.55), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = S.shadowBlur;
    }

    ctx.restore();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();