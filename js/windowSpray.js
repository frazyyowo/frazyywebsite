(() => {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  if (reduceMotion?.matches) return;

  const colors = [
    "rgba(255,255,255,0.95)",
    "rgba(191,226,255,0.92)",
    "rgba(151,197,255,0.90)",
    "rgba(205,165,255,0.88)"
  ];

  const canvas = document.createElement("canvas");
  canvas.id = "windowSprayCanvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const particles = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let lastSpawn = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(x, y) {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 2.5,
        vy: 0.8 + Math.random() * 2.1,
        gravity: 0.035 + Math.random() * 0.025,
        drag: 0.992,
        size: 2.1 + Math.random() * 3.5,
        life: 46 + Math.random() * 28,
        maxLife: 74,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    if (particles.length > 220) {
      particles.splice(0, particles.length - 220);
    }

    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick() {
    raf = 0;
    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.life -= 1;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.x += p.vx;
      p.y += p.vy;

      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      if (alpha <= 0 || p.y > height + 24) {
        particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    if (particles.length) raf = requestAnimationFrame(tick);
  }

  function onWindowMove(e) {
    if (e.pointerType === "touch") return;
    const win = e.currentTarget;
    if (win.classList.contains("closed") || win.classList.contains("dragging")) return;

    const now = performance.now();
    if (now - lastSpawn < 28) return;
    lastSpawn = now;
    spawn(e.clientX, e.clientY);
  }

  function wireWindows() {
    document.querySelectorAll(".window").forEach(win => {
      if (win.dataset.sprayReady === "1") return;
      win.dataset.sprayReady = "1";
      win.addEventListener("pointermove", onWindowMove, { passive: true });
    });
  }

  resize();
  wireWindows();
  window.addEventListener("resize", resize);
})();
