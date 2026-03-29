// player.js — fixed minimalist player (Frutiger Aero UI) + volume slider + saved settings
// ✅ Edit PLAYLIST below (title, file, cover)
(() => {
  "use strict";

  const PLAYLIST = [
    { title: "medicine",     src: "music/medicine.mp3",     cover: "img/bunii.png"  },
    { title: "sos", src: "music/sos.mp3", cover: "img/che1.png" },
    { title: "serve da ba$$", src: "music/servedabass.mp3", cover: "img/che2.png" },
   
    // add more:
    // { title:"song name", src:"music/file.mp3", cover:"covers/file.png" }
  ];

  // --- elements (must match your HTML ids) ---
  const audio   = document.getElementById("faAudio");
  const titleEl = document.getElementById("faTitle");
  const cover   = document.getElementById("faCoverImg");
  const seek    = document.getElementById("faSeek");
  const curEl   = document.getElementById("faCur");
  const durEl   = document.getElementById("faDur");
  const toggle  = document.getElementById("faToggle");
  const nextBtn = document.getElementById("faNextBtn");
  const vol     = document.getElementById("faVol");

  if (!audio || !titleEl || !cover || !seek || !curEl || !durEl || !toggle || !nextBtn) {
    console.warn("player.js: player elements missing (check your HTML ids)");
    return;
  }
  if (!vol) {
    console.warn("player.js: volume slider #faVol missing (add it to HTML)");
    return;
  }

  // --- settings keys ---
  const IDX_KEY = "faPlayerIndex";
  const VOL_KEY = "faPlayerVolume";

  // --- helpers ---
  const pad2 = (n) => String(n).padStart(2, "0");
  const fmt = (s) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${m}:${pad2(ss)}`;
  };

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function isPlaying() {
    return !audio.paused && !audio.ended;
  }

  function setBtn(playing) {
    // stop -> play toggle
    toggle.textContent = playing ? "■" : "▶";
  }

  // --- volume init (SAFE default) ---
const rawVol = localStorage.getItem(VOL_KEY);

// pick your default here (18% matches your HTML)
let savedVol = rawVol === null ? 0.18 : parseFloat(rawVol);

if (!Number.isFinite(savedVol)) savedVol = 0.18;

audio.volume = clamp(savedVol, 0, 1);
vol.value = String(Math.round(audio.volume * 100));

  // volume events
  vol.addEventListener("input", () => {
    const v = clamp(Number(vol.value) / 100, 0, 1);
    audio.volume = v;
    localStorage.setItem(VOL_KEY, String(v));
  });

  // --- remember last track ---
  let idx = Number(localStorage.getItem(IDX_KEY) || "0");
  if (!Number.isFinite(idx) || idx < 0 || idx >= PLAYLIST.length) idx = 0;

  // --- RAF time updates ---
  let raf = 0;
  function tick() {
    const d = audio.duration || 0;
    const t = audio.currentTime || 0;

    curEl.textContent = fmt(t);
    if (d > 0) {
      seek.value = String(Math.round((t / d) * 1000));
      durEl.textContent = fmt(d);
    } else {
      // duration unknown yet
      durEl.textContent = "0:00";
    }

    raf = requestAnimationFrame(tick);
  }
  function startTick() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }
  function stopTick() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  // --- loading tracks ---
  function load(i, { autoplay = false } = {}) {
    if (!PLAYLIST.length) {
      titleEl.textContent = "no songs in playlist";
      cover.src = "covers/default.png";
      cover.alt = "cover";
      audio.removeAttribute("src");
      audio.load();
      setBtn(false);
      seek.value = "0";
      curEl.textContent = "0:00";
      durEl.textContent = "0:00";
      return;
    }

    const t = PLAYLIST[i];
    if (!t) return;

    localStorage.setItem(IDX_KEY, String(i));

    // stop current playback cleanly
    stopTick();
    audio.pause();

    audio.src = t.src;
    titleEl.textContent = t.title || "untitled";
    cover.src = t.cover || "covers/default.png";
    cover.alt = t.title || "cover";

    // reset UI immediately
    seek.value = "0";
    curEl.textContent = "0:00";
    durEl.textContent = "0:00";
    setBtn(false);

    // keep volume as saved
    const storedVol = localStorage.getItem(VOL_KEY);
    if (storedVol !== null) audio.volume = clamp(Number(storedVol), 0, 1);
    vol.value = String(Math.round(audio.volume * 100));

    audio.addEventListener(
      "loadedmetadata",
      () => {
        const d = audio.duration || 0;
        durEl.textContent = fmt(d);

        if (autoplay) {
          audio.play()
            .then(() => {
              setBtn(true);
              startTick();
            })
            .catch(() => {
              // if blocked, just stay paused
              setBtn(false);
            });
        }
      },
      { once: true }
    );
  }

  // --- play/stop toggle ---
  async function togglePlayStop() {
    if (!PLAYLIST.length) return;

    if (isPlaying()) {
      // STOP = pause + reset to 0
      audio.pause();
      audio.currentTime = 0;
      stopTick();
      setBtn(false);
      seek.value = "0";
      curEl.textContent = "0:00";
      return;
    }

    try {
      await audio.play();
      setBtn(true);
      startTick();
    } catch {
      // usually fine because user clicked
      setBtn(false);
    }
  }

  // --- next track (cover click) ---
  function nextTrack({ autoplay = true } = {}) {
    if (!PLAYLIST.length) return;
    idx = (idx + 1) % PLAYLIST.length;
    load(idx, { autoplay });
  }

  // --- events ---
  toggle.addEventListener("click", togglePlayStop);

  // cover click = next song (nice + simple)
  nextBtn.addEventListener("click", () => {
    nextTrack({ autoplay: isPlaying() });
  });

  // seeking
  seek.addEventListener("input", () => {
    const d = audio.duration || 0;
    if (!d) return;
    audio.currentTime = (Number(seek.value) / 1000) * d;
    curEl.textContent = fmt(audio.currentTime);
  });

  // keep button state synced
  audio.addEventListener("play", () => {
    setBtn(true);
    startTick();
  });
  audio.addEventListener("pause", () => {
    setBtn(false);
  });

  // autoplay next on end
  audio.addEventListener("ended", () => {
    setBtn(false);
    nextTrack({ autoplay: true });
  });

  // pause ticking in background
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopTick();
    else if (isPlaying()) startTick();
  });

  // init
  // init (try autoplay on open)
load(idx, { autoplay: true });

// if autoplay gets blocked, start on first user interaction anywhere
const resume = async () => {
  try {
    await audio.play();
    setBtn(true);
    startTick();
  } catch {}
};
window.addEventListener("pointerdown", resume, { once: true });
window.addEventListener("keydown", resume, { once: true });
})();
