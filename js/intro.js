(() => {
  "use strict";

  const intro = document.getElementById("intro");
  const typedEl = document.getElementById("introTyped");
  const fx = document.getElementById("introFx");

  if (!intro || !typedEl || !fx) return;

  typedEl.textContent = "<3";
  document.body.classList.add("intro-active");

  const fallbackReduced =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const perf = window.frazyyPerformance || {
    reducedMotion: fallbackReduced,
    canvasDpr: Math.min(1.25, window.devicePixelRatio || 1),
    particleFps: fallbackReduced ? 20 : 45,
    particleDensity: fallbackReduced ? 0.32 : 0.78,
  };

  const ctx = fx.getContext("2d", { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let resizeFrame = 0;
  let animationFrame = 0;
  let lastFrame = performance.now();
  let particlesRunning = true;

  const dust = [];
  const glow = [];
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const frameInterval = 1000 / perf.particleFps;

  function rebuild() {
    dpr = Math.max(1, perf.canvasDpr);
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
    const dustCount = Math.floor(baseDust * perf.particleDensity);
    const glowCount = Math.floor(baseGlow * Math.min(0.82, perf.particleDensity + 0.08));

    for (let i = 0; i < dustCount; i += 1) {
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

    for (let i = 0; i < glowCount; i += 1) {
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

  function wrapParticle(particle, margin) {
    if (particle.x < -margin) particle.x = width + margin;
    if (particle.x > width + margin) particle.x = -margin;
    if (particle.y < -margin) particle.y = height + margin;
    if (particle.y > height + margin) particle.y = -margin;
  }

  function queueFrame() {
    if (!animationFrame && particlesRunning && !document.hidden) {
      animationFrame = requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    animationFrame = 0;
    if (!particlesRunning || document.hidden) return;

    const elapsed = now - lastFrame;
    if (elapsed < frameInterval) {
      queueFrame();
      return;
    }

    const dt = Math.min(0.04, elapsed / 1000);
    lastFrame = now - (elapsed % frameInterval);
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(255,255,255,0.42)";
    ctx.shadowBlur = 16;

    for (let i = 0; i < glow.length; i += 1) {
      const p = glow[i];
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

    for (let i = 0; i < dust.length; i += 1) {
      const p = dust[i];
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
    queueFrame();
  }

  function onResize() {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      rebuild();
    });
  }

  function onVisibilityChange() {
    lastFrame = performance.now();
    queueFrame();
  }

  function stopParticles() {
    particlesRunning = false;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    animationFrame = 0;
    resizeFrame = 0;
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }

  window.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  rebuild();
  queueFrame();

  let entered = false;

  function enterSite() {
    if (entered) return;
    entered = true;

    intro.classList.add("exit");
    document.body.classList.remove("intro-active");
    window.dispatchEvent(new Event("frazyy:site-visible"));

    window.setTimeout(() => {
      stopParticles();
      intro.remove();
    }, 700);
  }

  intro.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    enterSite();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      enterSite();
    }
  });
})();
