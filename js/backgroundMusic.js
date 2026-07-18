(() => {
  "use strict";

  const MUSIC_API = "https://api.github.com/repos/frazyyowo/frazyywebsite/contents/music";
  const AUDIO_FILE = /\.(mp3|m4a|aac|ogg|oga|wav|flac|webm)$/i;
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

  let playlist = ["music/music1.mp3"];
  let currentIndex = 0;
  let started = false;
  let retryTimer = 0;
  let failedTracks = 0;
  let resumeWhenVisible = false;

  const audio = document.createElement("audio");
  audio.id = "backgroundMusic";
  audio.preload = "none";
  audio.volume = 0.42;
  audio.setAttribute("aria-hidden", "true");
  audio.style.display = "none";
  audio.dataset.playbackState = "ready";
  document.body.appendChild(audio);

  function trackName(path) {
    try {
      return decodeURIComponent(path.split("/").pop() || "");
    } catch {
      return path.split("/").pop() || "";
    }
  }

  function localTrackPath(name) {
    return `music/${encodeURIComponent(name)}`;
  }

  function prepareCurrentTrack() {
    if (!playlist.length) return;
    currentIndex = ((currentIndex % playlist.length) + playlist.length) % playlist.length;
    audio.loop = playlist.length === 1;

    const nextSource = new URL(playlist[currentIndex], document.baseURI).href;
    if (audio.src !== nextSource) {
      audio.src = playlist[currentIndex];
      audio.load();
    }
  }

  function playCurrentTrack() {
    if (!started || !playlist.length || document.hidden) return;
    window.clearTimeout(retryTimer);
    prepareCurrentTrack();
    audio.play().then(() => {
      audio.dataset.playbackState = "playing";
      delete audio.dataset.lastError;
    }).catch((error) => {
      audio.dataset.playbackState = "blocked";
      audio.dataset.lastError = error?.name || "PlayError";
      // Browsers only allow sound after interaction. Any later interaction retries it.
    });
  }

  function advanceTrack() {
    if (!playlist.length) return;
    currentIndex = (currentIndex + 1) % playlist.length;
    failedTracks = 0;
    playCurrentTrack();
  }

  function startPlaylist() {
    if (!started) started = true;
    audio.preload = "auto";
    playCurrentTrack();
  }

  async function discoverPlaylist() {
    try {
      const response = await fetch(MUSIC_API, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!response.ok) return;

      const entries = await response.json();
      if (!Array.isArray(entries)) return;

      const names = entries
        .filter((entry) => entry?.type === "file" && AUDIO_FILE.test(entry.name || ""))
        .map((entry) => entry.name)
        .sort((a, b) => collator.compare(a, b));

      if (!names.length) return;

      const currentName = trackName(playlist[currentIndex]);
      playlist = names.map(localTrackPath);
      const matchingIndex = names.findIndex((name) => name === currentName);
      currentIndex = matchingIndex >= 0 ? matchingIndex : 0;

      audio.loop = playlist.length === 1;
    } catch {
      // The checked-in fallback playlist still works if GitHub is unavailable.
    }
  }

  audio.addEventListener("ended", advanceTrack);
  audio.addEventListener("error", () => {
    if (!started || !playlist.length) return;

    failedTracks += 1;
    if (playlist.length > 1 && failedTracks < playlist.length) {
      currentIndex = (currentIndex + 1) % playlist.length;
      playCurrentTrack();
      return;
    }

    failedTracks = 0;
    retryTimer = window.setTimeout(playCurrentTrack, 3000);
  });

  const intro = document.getElementById("intro");
  intro?.addEventListener("pointerdown", startPlaylist, { capture: true });
  intro?.addEventListener("click", startPlaylist, { capture: true });
  intro?.addEventListener("touchend", startPlaylist, { capture: true, passive: true });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Enter") startPlaylist();
  }, { capture: true });

  document.addEventListener("pointerdown", () => {
    if (started && !document.hidden && audio.paused) playCurrentTrack();
  }, { passive: true });

  document.addEventListener("click", () => {
    if (started && !document.hidden && audio.paused) playCurrentTrack();
  }, { capture: true });

  window.addEventListener("focus", () => {
    if (started && !document.hidden && audio.paused) playCurrentTrack();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      resumeWhenVisible = started && !audio.paused;
      window.clearTimeout(retryTimer);
      audio.pause();
      return;
    }

    if (resumeWhenVisible && audio.paused) {
      resumeWhenVisible = false;
      playCurrentTrack();
    }
  });

  discoverPlaylist();
})();
