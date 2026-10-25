// The regression lab (see RegressionLab.astro) is drawn in the HTML; the code
// that makes it interactive is fetched only once the lab nears the screen, or
// as soon as the visitor reaches for it, whichever comes first. If it never
// arrives, the static chart stays.

const labRoot = document.querySelector<HTMLElement>('[data-lab]');

if (labRoot) {
  let started = false;

  const start = () => {
    if (started) return;
    started = true;
    observer.disconnect();
    import('@/lib/regression-lab')
      .then(({ mount }) => {
        mount(labRoot);
      })
      .catch(() => undefined);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) start();
    },
    { rootMargin: '400px 0px' },
  );
  observer.observe(labRoot);
  labRoot.addEventListener('pointerdown', start, { once: true });
  labRoot.addEventListener('focusin', start, { once: true });
}
