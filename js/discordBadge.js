// discordBadge.js
(() => {
  // ===== EDIT THESE =====
  const DISCORD_USERNAME_TO_COPY = "frazyyfur"; // what gets copied
  const FALLBACK_DISPLAY_NAME = "frazyy";
  const FALLBACK_USER_TEXT = "@frazyyfur";
  const FALLBACK_ACTIVITY = "click to copy username";

  // Optional: live activity (public). Leave "" to disable.
  const DISCORD_USER_ID = "1175789078076207164";
  // ======================

  const card = document.getElementById("discordCard");
  const pfp = document.getElementById("discordPfp");
  const nameEl = document.getElementById("discordName");
  const userEl = document.getElementById("discordUser");
  const actEl = document.getElementById("discordActivity");

  if (!card || !pfp || !nameEl || !userEl || !actEl) return;

  // keep what we should restore after "copied!"
  let lastActivityText = FALLBACK_ACTIVITY;

  // set fallbacks immediately
  nameEl.textContent = FALLBACK_DISPLAY_NAME;
  userEl.textContent = FALLBACK_USER_TEXT;
  actEl.textContent = FALLBACK_ACTIVITY;

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}

    // fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  function showCopied(ok) {
    card.classList.add("copied");
    actEl.textContent = ok ? "copied!" : "couldnt copy :(";

    window.setTimeout(() => {
      card.classList.remove("copied");
      actEl.textContent = lastActivityText;
    }, 900);
  }

  card.addEventListener("click", async () => {
    const ok = await copyText(DISCORD_USERNAME_TO_COPY);
    showCopied(ok);
  });

  // ===== Optional live activity (only if DISCORD_USER_ID set) =====
  function pickActivity(activities = []) {
    const a = activities.find(x => x && x.name && x.name !== "Custom Status");
    return a?.name || "";
  }

  function setAvatarFromDiscordUser(u) {
    // Lanyard gives u.id and u.avatar
    if (!u?.id || !u?.avatar) return;

    const isGif = typeof u.avatar === "string" && u.avatar.startsWith("a_");
    const ext = isGif ? "gif" : "png";

    // size can be 64/128/256/512/1024...
    const url = `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${ext}?size=128`;

    // avoid pointless reloads
    if (pfp.src !== url) pfp.src = url;
  }

  async function updateFromPresence() {
    if (!DISCORD_USER_ID) return;

    try {
      const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`, { cache: "no-store" });
      const json = await res.json();
      const data = json?.data;

      const u = data?.discord_user;

      // name + user line
      if (u?.username) nameEl.textContent = u.username;
      userEl.textContent = `@${DISCORD_USERNAME_TO_COPY}`;

      // avatar
      setAvatarFromDiscordUser(u);

      // activity/status text
      const status = data?.discord_status || "";
      const act = pickActivity(data?.activities);

      if (act) lastActivityText = `doing: ${act}`;
      else if (status) lastActivityText = `status: ${status}`;
      else lastActivityText = FALLBACK_ACTIVITY;

      // only update the UI if we're not currently showing "copied!"
      if (!card.classList.contains("copied")) {
        actEl.textContent = lastActivityText;
      }
    } catch {
      // keep fallback if it fails
      lastActivityText = FALLBACK_ACTIVITY;
      if (!card.classList.contains("copied")) actEl.textContent = lastActivityText;
    }
  }

  if (DISCORD_USER_ID) {
    updateFromPresence();
    setInterval(updateFromPresence, 20000);
  }
})();