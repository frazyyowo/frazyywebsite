(() => {
  "use strict";

  const intro = document.getElementById("intro");
  const typedEl = document.getElementById("introTyped");
  const fx = document.getElementById("introFx");

  if (!intro || !typedEl || !fx) return;

  // show instantly (NO typing)
  typedEl.textContent = "Press enter";

  // start intro mode
  document.body.classList.add("intro-active");

  const prefersReduced =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  // ===== PARTICLES (MUCH MORE + MUCH BRIGHTER) =====
  const ctx = fx.getContext("2d", { alpha: true });
  let W = 0, H = 0, DPR = 1;

  const dust = [];
  const glow = [];

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function rebuild() {
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = window.innerWidth;
    H = window.innerHeight;

    fx.width = Math.floor(W * DPR);
    fx.height = Math.floor(H * DPR);
    fx.style.width = W + "px";
    fx.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    dust.length = 0;
    glow.length = 0;

    // scale by screen size (big screens = more)
    const area = W * H;

    // 1080p ≈ ~1400 dust, 4K ≈ clamps
    const baseDust = clamp(Math.floor(area / 1400), 900, 2600);
    const baseGlow = clamp(Math.floor(area / 22000), 70, 220);

    const nDust = prefersReduced ? Math.floor(baseDust * 0.35) : baseDust;
    const nGlow = prefersReduced ? Math.floor(baseGlow * 0.45) : baseGlow;

    for (let i = 0; i < nDust; i++) {
      const big = Math.random() < 0.24;
      dust.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: big ? rand(1.2, 2.9) : rand(0.7, 1.8),
        a: big ? rand(0.18, 0.44) : rand(0.12, 0.30), // BRIGHT
        vx: rand(-0.28, 0.28),
        vy: rand(0.10, 0.48),
        tw: rand(0.9, 2.3),
        ph: rand(0, Math.PI * 2),
      });
    }

    for (let i = 0; i < nGlow; i++) {
      glow.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: rand(2.4, 6.6),
        a: rand(0.06, 0.14),
        vx: rand(-0.12, 0.12),
        vy: rand(0.06, 0.26),
        ph: rand(0, Math.PI * 2),
        tw: rand(0.6, 1.3),
      });
    }
  }

  window.addEventListener("resize", rebuild);
  rebuild();

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    ctx.clearRect(0, 0, W, H);

    // glowy layer
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(255,255,255,0.42)";
    ctx.shadowBlur = 16;

    for (const p of glow) {
      p.x += p.vx * (60 * dt);
      p.y += p.vy * (60 * dt);

      if (p.x < -40) p.x = W + 40;
      if (p.x > W + 40) p.x = -40;
      if (p.y < -40) p.y = H + 40;
      if (p.y > H + 40) p.y = -40;

      const tw = 0.82 + 0.18 * Math.sin(now * 0.0016 * p.tw + p.ph);
      ctx.globalAlpha = p.a * tw;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // crisp dust specks
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#fff";

    for (const p of dust) {
      p.x += p.vx * (60 * dt);
      p.y += p.vy * (60 * dt);

      if (p.x < -30) p.x = W + 30;
      if (p.x > W + 30) p.x = -30;
      if (p.y < -30) p.y = H + 30;
      if (p.y > H + 30) p.y = -30;

      const tw = 0.70 + 0.30 * Math.sin(now * 0.0022 * p.tw + p.ph);
      ctx.globalAlpha = p.a * tw;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  // ===== ENTER: CLICK ANYWHERE + INSTANT RESPONSE =====
  let entered = false;

  function enterSite() {
    if (entered) return;
    entered = true;

    // start animation immediately
    intro.classList.add("exit");

    // reveal site immediately (no delay)
    document.body.classList.remove("intro-active");

    // remove intro after animation completes
    setTimeout(() => {
      intro.remove();
    }, 700);
  }

  // CLICK ANYWHERE (this fixes your issue)
  intro.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    enterSite();
  });

  // Enter key
  window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      enterSite();
    }
  });
})();