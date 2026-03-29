// typewriter.js (Option C) — bounce + occasional swap + tiny glitch (best “alive” feel)
(() => {
  "use strict";

  const el = document.querySelector(".site-title");
  if (!el) return;

  const prefersReduced =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const BASE = el.getAttribute("data-type") || "frazyy.com";
  const ALTS = ["frazyy.exe", "frazyyyyy", "frazyy <3", "frazyyfur", "frazzy.com", "meow"];

  // Build structure once
  el.textContent = "";
  const spanText = document.createElement("span");
  spanText.className = "tw-text";
  const spanCursor = document.createElement("span");
  spanCursor.className = "tw-cursor";
  spanCursor.textContent = "_";
  el.appendChild(spanText);
  el.appendChild(spanCursor);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const pick = (arr) => arr[rand(0, arr.length - 1)];
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789._<>";

  async function typeTo(target, min = 40, max = 85) {
    // delete down if too long
    while (spanText.textContent.length > target.length) {
      spanText.textContent = spanText.textContent.slice(0, -1);
      await sleep(rand(18, 48));
    }
    // type up
    for (let i = spanText.textContent.length; i <= target.length; i++) {
      spanText.textContent = target.slice(0, i);
      const last = spanText.textContent.slice(-1);
      const extra = last === "." ? 140 : 0;
      await sleep(rand(min, max) + extra);
    }
  }

  async function deleteTo(len, min = 20, max = 55) {
    while (spanText.textContent.length > len) {
      spanText.textContent = spanText.textContent.slice(0, -1);
      await sleep(rand(min, max));
    }
  }

  async function wipe() {
    await deleteTo(0, 16, 42);
  }

  async function glitch(ms = 220) {
    const original = spanText.textContent;
    const end = performance.now() + ms;
    while (performance.now() < end) {
      let out = original.split("");
      // scramble last few chars
      const k = Math.min(4, out.length);
      for (let i = 0; i < k; i++) {
        const idx = out.length - 1 - i;
        out[idx] = chars[rand(0, chars.length - 1)];
      }
      spanText.textContent = out.join("");
      await sleep(rand(30, 55));
    }
    spanText.textContent = original;
  }

  async function loop() {
    await sleep(250);
    await typeTo(BASE);

    if (prefersReduced) return;

    while (true) {
      await sleep(1600);

      const roll = Math.random();

      // 60% bounce (frazyy.com -> fra -> back)
      if (roll < 0.60) {
        const cutLen = pick([3, 4, 5]); // "fra", "fraz", "frazy"
        await deleteTo(cutLen);
        await sleep(420);
        await typeTo(BASE);
        await sleep(900);
        continue;
      }

      // 25% swap to an alt phrase then back
      if (roll < 0.85) {
        const next = pick(ALTS);
        await wipe();
        await sleep(110);
        await typeTo(next);
        await sleep(1200);
        await wipe();
        await sleep(110);
        await typeTo(BASE);
        await sleep(900);
        continue;
      }

      // 15% tiny glitch (looks “alive”)
      await glitch(240);
      await sleep(900);
    }
  }

  loop();
})();