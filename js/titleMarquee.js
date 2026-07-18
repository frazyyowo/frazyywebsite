(() => {
  "use strict";

  const title = "FRAZYYFRAZYYFRAZYYFRAZYY";
  let offset = 0;
  let timer = 0;

  function tick() {
    document.title = title.slice(offset) + title.slice(0, offset);
    offset = (offset + 1) % title.length;
  }

  function start() {
    window.clearInterval(timer);
    if (document.hidden) return;
    tick();
    timer = window.setInterval(tick, 500);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.clearInterval(timer);
      timer = 0;
    } else {
      start();
    }
  });

  start();
})();
