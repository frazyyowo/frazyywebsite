(() => {
  const title = "FRAZYYFRAZYYFRAZYYFRAZYY";
  let offset = 0;

  function tick() {
    document.title = title.slice(offset) + title.slice(0, offset);
    offset = (offset + 1) % title.length;
  }

  tick();
  window.setInterval(tick, 500);
})();
