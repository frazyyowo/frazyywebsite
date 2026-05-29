(() => {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  if (reduceMotion?.matches) return;

  const MAX_TILT = 4.25;
  const LERP = 0.22;
  const STOP_AT = 0.015;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function setTiltVars(win, tiltX, tiltY) {
    win.style.setProperty("--tilt-x", `${tiltX.toFixed(3)}deg`);
    win.style.setProperty("--tilt-y", `${tiltY.toFixed(3)}deg`);
  }

  function wrapWindow(win) {
    if (win.querySelector(":scope > .window-tilt-surface")) {
      return win.querySelector(":scope > .window-tilt-surface");
    }

    const surface = document.createElement("div");
    surface.className = "window-tilt-surface";
    surface.dataset.label = win.dataset.label || "";

    const stableDragParts = [];
    Array.from(win.childNodes).forEach(node => {
      const staysStill =
        node.nodeType === Node.ELEMENT_NODE &&
        (node.classList.contains("handle") || node.classList.contains("close-hit"));

      if (staysStill) {
        stableDragParts.push(node);
      } else {
        surface.appendChild(node);
      }
    });

    win.appendChild(surface);
    stableDragParts.forEach(node => win.appendChild(node));
    return surface;
  }

  function setupWindow(win) {
    if (win.dataset.stableTilt === "1") return;
    win.dataset.stableTilt = "1";

    wrapWindow(win);
    setTiltVars(win, 0, 0);

    let rect = null;
    let frame = 0;
    let active = false;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    function queue() {
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function tick() {
      frame = 0;

      if (win.classList.contains("dragging") || win.classList.contains("closed")) {
        active = false;
        targetX = 0;
        targetY = 0;
      }

      currentX += (targetX - currentX) * LERP;
      currentY += (targetY - currentY) * LERP;
      setTiltVars(win, currentX, currentY);

      const stillMoving =
        Math.abs(targetX - currentX) > STOP_AT ||
        Math.abs(targetY - currentY) > STOP_AT;

      if (active || stillMoving) {
        queue();
        return;
      }

      currentX = 0;
      currentY = 0;
      setTiltVars(win, 0, 0);
      win.classList.remove("is-tilting");
    }

    function updateTarget(e) {
      if (!rect || win.classList.contains("closed") || win.classList.contains("dragging")) return;

      const px = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const py = clamp((e.clientY - rect.top) / rect.height, 0, 1);

      targetY = (px - 0.5) * MAX_TILT * 2;
      targetX = (0.5 - py) * MAX_TILT * 2;
      queue();
    }

    function enter(e) {
      if (e.pointerType === "touch") return;
      if (win.classList.contains("dragging")) return;
      rect = win.getBoundingClientRect();
      active = true;
      win.classList.add("is-tilting");
      updateTarget(e);
    }

    function leave() {
      active = false;
      rect = null;
      targetX = 0;
      targetY = 0;
      queue();
    }

    win.addEventListener("pointerenter", enter);
    win.addEventListener("pointerdown", e => {
      if (e.target.closest(".handle")) leave();
    });
    win.addEventListener("pointermove", e => {
      if (e.pointerType === "touch") return;
      if (win.classList.contains("dragging")) return;
      if (!rect) rect = win.getBoundingClientRect();
      updateTarget(e);
    });
    win.addEventListener("pointerleave", leave);
    win.addEventListener("pointercancel", leave);
    win.addEventListener("lostpointercapture", leave);
  }

  function init() {
    document.querySelectorAll(".window").forEach(setupWindow);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
