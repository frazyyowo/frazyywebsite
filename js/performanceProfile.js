(() => {
  "use strict";

  const reducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const compact = window.matchMedia?.("(max-width: 760px)")?.matches ?? false;
  const saveData = navigator.connection?.saveData === true;
  const cores = Number(navigator.hardwareConcurrency) || 0;
  const memory = Number(navigator.deviceMemory) || 0;
  const constrained =
    reducedMotion ||
    saveData ||
    (cores > 0 && cores <= 4) ||
    (memory > 0 && memory <= 4);

  const profile = Object.freeze({
    reducedMotion,
    compact,
    saveData,
    constrained,
    canvasDpr: constrained || compact ? 1 : Math.min(1.25, window.devicePixelRatio || 1),
    particleFps: reducedMotion ? 20 : constrained || compact ? 30 : 45,
    particleDensity: reducedMotion ? 0.32 : constrained ? 0.52 : compact ? 0.66 : 0.78,
    sprayDpr: constrained || compact ? 1 : Math.min(1.25, window.devicePixelRatio || 1),
    sprayCap: constrained || compact ? 90 : 150,
  });

  window.frazyyPerformance = profile;
  document.documentElement.classList.toggle("perf-lite", constrained);
  document.documentElement.classList.toggle("perf-compact", compact);

  function manageBackgroundVideo() {
    const video = document.getElementById("bg");
    if (!video) return;

    let resumeWhenVisible = video.autoplay || !video.paused;

    function syncPlayback() {
      if (document.hidden) {
        resumeWhenVisible = video.autoplay || !video.paused;
        video.pause();
        return;
      }

      if (resumeWhenVisible && video.paused) {
        video.play().catch(() => {
          // Muted autoplay can still be blocked by browser or OS policy.
        });
      }
    }

    document.addEventListener("visibilitychange", syncPlayback);
    window.addEventListener("pagehide", () => video.pause(), { passive: true });
    window.addEventListener("pageshow", syncPlayback, { passive: true });
    syncPlayback();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", manageBackgroundVideo, { once: true });
  } else {
    manageBackgroundVideo();
  }
})();
