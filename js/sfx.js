// sfx.js — mechanical mouse click (down+up), plays anywhere, stable volume
(() => {
  let ctx = null;
  let master = null;
  let comp = null;

  let muted = JSON.parse(localStorage.getItem("frazyyMuted") || "false");

  // Tune here
  const SETTINGS = {
    volume: 3,          // master loudness
    clickDownGain: 0.55,  // down tick strength
    clickUpGain: 0.45,    // up tick strength
    minIntervalMs: 18,    // prevents insane spam overlap
  };

  let lastFireMs = 0;

  function ensureAudio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();

      master = ctx.createGain();
      master.gain.value = SETTINGS.volume;

      // Compressor/limiter so spam clicking doesn't get louder/quieter
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.knee.value = 18;
      comp.ratio.value = 10;
      comp.attack.value = 0.002;
      comp.release.value = 0.10;

      master.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
  }

  // Create an "impulse click" buffer: fast transient with short decay
  function makeImpulseBuffer(durationSec, sharpness = 0.008) {
    const sr = ctx.sampleRate;
    const len = Math.max(8, Math.floor(sr * durationSec));
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);

    // A decaying impulse + tiny micro-noise for "plastic" feel (NOT hissy)
    // sharpness controls how quickly it decays
    let env = 1.0;
    const decay = Math.exp(Math.log(0.001) / (sr * sharpness));

    for (let i = 0; i < len; i++) {
      const micro = (Math.random() * 2 - 1) * 0.08; // tiny texture
      data[i] = (i === 0 ? 1.0 : 0.0) * env + micro * env;
      env *= decay;
    }
    return buf;
  }

  function playMechanicalTick(strength = 0.5, pitch = 1800) {
    if (muted) return;
    ensureAudio();

    const t0 = ctx.currentTime;

    // source: impulse buffer
    const src = ctx.createBufferSource();
    src.buffer = makeImpulseBuffer(0.025, 0.010);

    // shape with a resonant bandpass to make it "click" not "pop"
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = pitch;
    bp.Q.value = 1.2;

    // remove low thump
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 500;

    // soften harsh top
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 7000;

    const g = ctx.createGain();
    // clean envelope (no exponential weirdness)
    g.gain.setValueAtTime(0.0, t0);
    g.gain.linearRampToValueAtTime(0.16 * strength, t0 + 0.003);
    g.gain.linearRampToValueAtTime(0.0, t0 + 0.022);

    src.connect(bp);
    bp.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(master);

    src.start(t0);
    src.stop(t0 + 0.04);
  }

  function canFireNow() {
    const ms = performance.now();
    if (ms - lastFireMs < SETTINGS.minIntervalMs) return false;
    lastFireMs = ms;
    return true;
  }

  // ✅ Play everywhere
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button !== undefined && e.button !== 0) return; // primary only
      if (!canFireNow()) return;

      // "down" click: slightly brighter
      const isHandle = !!e.target?.closest?.(".handle");
      playMechanicalTick(
        isHandle ? SETTINGS.clickDownGain * 0.95 : SETTINGS.clickDownGain,
        isHandle ? 1550 : 1900
      );
    },
    { capture: true }
  );

  // ✅ Optional: add a softer "up" click (feels way more like a real mouse)
  document.addEventListener(
    "pointerup",
    (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (!canFireNow()) return;

      const isHandle = !!e.target?.closest?.(".handle");
      playMechanicalTick(
        isHandle ? SETTINGS.clickUpGain * 0.85 : SETTINGS.clickUpGain,
        isHandle ? 1100 : 1350
      );
    },
    { capture: true }
  );

  // M to mute/unmute
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "m") {
      muted = !muted;
      localStorage.setItem("frazyyMuted", JSON.stringify(muted));
      if (!muted) {
        // tiny confirmation tick
        playMechanicalTick(0.35, 2100);
      }
    }
  });
})();