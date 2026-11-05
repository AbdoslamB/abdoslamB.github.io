// Dark/light toggle. The initial theme is applied by an inline script in the
// page head (before paint); this only handles switching and remembering it.

type Theme = 'dark' | 'light';

const root = document.documentElement;
const toggle = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');

const current = (): Theme =>
  root.dataset.theme === 'light' ? 'light' : 'dark';

const apply = (theme: Theme) => {
  root.dataset.theme = theme;
  toggle?.setAttribute('aria-pressed', String(theme === 'dark'));
  document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (toggle) {
  apply(current());
  toggle.addEventListener('click', () => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Private mode or blocked storage: the switch still works for this visit.
    }
    // A view transition cross-fades a snapshot of each theme on the GPU, so
    // the page changes colour in one smooth fade instead of restyling every
    // element on every frame. Without it, CSS transitions do the fade (see
    // _base.scss); with reduced motion the switch is instant.
    if ('startViewTransition' in document && !reducedMotion.matches) {
      document.startViewTransition(() => {
        apply(next);
      });
    } else {
      apply(next);
    }
  });
}
