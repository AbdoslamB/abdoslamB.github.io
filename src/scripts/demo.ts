// Theme-matched demo recordings (see Flagship.astro). Nothing downloads until
// the demo nears the screen, and then only the recording for the current
// theme. The other one loads on a theme switch and carries on from the same
// moment. It plays only while on screen; with reduced motion it never
// autoplays and shows controls instead.

const box = document.querySelector<HTMLElement>('[data-demo]');
const videos = box
  ? [...box.querySelectorAll<HTMLVideoElement>('video[data-src]')]
  : [];
const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (box && videos.length > 0) {
  let near = false;
  let inView = false;
  let active: HTMLVideoElement | undefined;

  const theme = () =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

  const load = (video: HTMLVideoElement) => {
    if (video.getAttribute('src')) return;
    if (still) video.controls = true;
    video.preload = still ? 'metadata' : 'auto';
    video.poster = video.dataset.poster ?? '';
    video.src = video.dataset.src ?? '';
  };

  const play = (video: HTMLVideoElement) => {
    // Rejected if the browser blocks autoplay; the poster stays up.
    video.play().catch(() => undefined);
  };

  const playback = () => {
    if (!active) return;
    if (!inView || document.hidden) active.pause();
    else if (!still) play(active);
  };

  const show = () => {
    if (!near) return;
    const next = videos.find((v) => v.dataset.themeVideo === theme());
    if (!next || next === active) return;
    load(next);
    const prev = active;
    active = next;
    if (prev) {
      if (prev.duration) next.currentTime = prev.currentTime % prev.duration;
      const wasPlaying = !prev.paused;
      prev.pause();
      // With reduced motion, keep playing only what the visitor started.
      if (still && wasPlaying) play(next);
    }
    playback();
  };

  document.addEventListener('themechange', show);
  document.addEventListener('visibilitychange', playback);

  const nearObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      nearObserver.disconnect();
      near = true;
      show();
    },
    { rootMargin: '400px 0px' },
  );
  nearObserver.observe(box);

  new IntersectionObserver(
    (entries) => {
      inView = entries.some((entry) => entry.isIntersecting);
      playback();
    },
    { threshold: 0.2 },
  ).observe(box);
}
