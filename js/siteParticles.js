(() => {
  "use strict";

  const fx = document.getElementById("fx");
  if (!fx) return;

  const ctx = fx.getContext("2d", { alpha: true });
  if (!ctx) return;

  const prefersReduced =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  let width = 0;
  let height = 0;
  let dpr = 1;
  const dust = [];
  const glow = [];

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function rebuild() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    width = window.innerWidth;
    height = window.innerHeight;

    fx.width = Math.floor(width * dpr);
    fx.height = Math.floor(height * dpr);
    fx.style.width = `${width}px`;
    fx.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    dust.length = 0;
    glow.length = 0;

    const area = width * height;
    const baseDust = clamp(Math.floor(area / 1400), 900, 2600);
    const baseGlow = clamp(Math.floor(area / 22000), 70, 220);
    const dustCount = prefersReduced ? Math.floor(baseDust * 0.35) : baseDust;
    const glowCount = prefersReduced ? Math.floor(baseGlow * 0.45) : baseGlow;

    for (let i = 0; i < dustCount; i++) {
      const big = Math.random() < 0.24;
      dust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: big ? rand(1.2, 2.9) : rand(0.7, 1.8),
        a: big ? rand(0.18, 0.44) : rand(0.12, 0.30),
        vx: rand(-0.28, 0.28),
        vy: rand(0.10, 0.48),
        tw: rand(0.9, 2.3),
        ph: rand(0, Math.PI * 2),
      });
    }

    for (let i = 0; i < glowCount; i++) {
      glow.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: rand(2.4, 6.6),
        a: rand(0.06, 0.14),
        vx: rand(-0.12, 0.12),
        vy: rand(0.06, 0.26),
        ph: rand(0, Math.PI * 2),
        tw: rand(0.6, 1.3),
      });
    }
  }

  function wrapParticle(p, margin) {
    if (p.x < -margin) p.x = width + margin;
    if (p.x > width + margin) p.x = -margin;
    if (p.y < -margin) p.y = height + margin;
    if (p.y > height + margin) p.y = -margin;
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(255,255,255,0.42)";
    ctx.shadowBlur = 16;

    for (const p of glow) {
      p.x += p.vx * (60 * dt);
      p.y += p.vy * (60 * dt);
      wrapParticle(p, 40);

      const twinkle = 0.82 + 0.18 * Math.sin(now * 0.0016 * p.tw + p.ph);
      ctx.globalAlpha = p.a * twinkle;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#fff";

    for (const p of dust) {
      p.x += p.vx * (60 * dt);
      p.y += p.vy * (60 * dt);
      wrapParticle(p, 30);

      const twinkle = 0.70 + 0.30 * Math.sin(now * 0.0022 * p.tw + p.ph);
      ctx.globalAlpha = p.a * twinkle;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", rebuild);
  rebuild();
  requestAnimationFrame(tick);
})();
