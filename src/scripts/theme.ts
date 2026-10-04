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

if (toggle) {
  apply(current());
  toggle.addEventListener('click', () => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Private mode or blocked storage: the switch still works for this visit.
    }
    apply(next);
  });
}
