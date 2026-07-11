// Corner vinyl player.
(() => {
  "use strict";

  const PLAYLIST = [
    { title: "medicine", src: "music/medicine.mp3", cover: "img/bunii.png" },
    { title: "sos", src: "music/sos.mp3", cover: "img/che1.png" },
    { title: "serve da ba$$", src: "music/servedabass.mp3", cover: "img/che2.png" }
  ];

  const player = document.getElementById("faPlayer");
  const audio = document.getElementById("faAudio");
  const titleEl = document.getElementById("faTitle");
  const cover = document.getElementById("faCoverImg");
  const toggle = document.getElementById("faToggle");
  const nextBtn = document.getElementById("faNextBtn");

  if (!player || !audio || !titleEl || !cover || !toggle || !nextBtn) {
    console.warn("player.js: player elements missing");
    return;
  }

  const IDX_KEY = "faPlayerIndex";
  const VOL_KEY = "faPlayerVolume";

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  let idx = Number(localStorage.getItem(IDX_KEY) || "0");
  if (!Number.isFinite(idx) || idx < 0 || idx >= PLAYLIST.length) idx = 0;

  const savedVol = Number(localStorage.getItem(VOL_KEY) || "0.18");
  audio.volume = clamp(Number.isFinite(savedVol) ? savedVol : 0.18, 0, 1);

  function isPlaying() {
    return !audio.paused && !audio.ended;
  }

  function setButton() {
    const playing = isPlaying();
    player.classList.toggle("is-paused", !playing);
    toggle.textContent = playing ? "off" : "play";
    toggle.setAttribute("aria-label", playing ? "stop music" : "play music");
  }

  function load(i, { autoplay = false } = {}) {
    if (!PLAYLIST.length) {
      titleEl.textContent = "no songs";
      cover.removeAttribute("src");
      audio.removeAttribute("src");
      audio.load();
      setButton();
      return;
    }

    const track = PLAYLIST[i];
    if (!track) return;

    localStorage.setItem(IDX_KEY, String(i));
    audio.pause();
    audio.src = track.src;
    titleEl.textContent = track.title || "untitled";
    cover.src = track.cover || "img/default.png";
    cover.alt = `${track.title || "song"} album cover`;
    setButton();

    if (autoplay) play();
  }

  async function play() {
    try {
      await audio.play();
      setButton();
    } catch {
      setButton();
    }
  }

  function stop() {
    audio.pause();
    audio.currentTime = 0;
    setButton();
  }

  function nextTrack({ autoplay = true } = {}) {
    idx = (idx + 1) % PLAYLIST.length;
    load(idx, { autoplay });
  }

  toggle.addEventListener("click", () => {
    if (isPlaying()) stop();
    else play();
  });

  nextBtn.addEventListener("click", () => {
    nextTrack({ autoplay: isPlaying() });
  });

  audio.addEventListener("play", () => {
    setButton();
  });

  audio.addEventListener("pause", setButton);

  audio.addEventListener("ended", () => {
    setButton();
    nextTrack({ autoplay: true });
  });

  load(idx, { autoplay: true });

  const resume = () => {
    if (!isPlaying()) play();
  };
  window.addEventListener("pointerdown", resume, { once: true });
  window.addEventListener("keydown", resume, { once: true });
})();
