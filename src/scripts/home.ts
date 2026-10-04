// Home page behaviour: the interactive dots, the scroll "hold" on the hero,
// snapping when scrolling stops inside the hold, and section buttons that
// burst the dots and glide to their section.

import { hold as holdConfig } from '@/config/site';
import { DotField } from '@/lib/dots';
import {
  easeInOutCubic,
  holdProgress,
  jumpDuration,
  type ScrollInput,
  snapTarget,
} from '@/lib/hold';

const track = document.querySelector<HTMLElement>('[data-hero-track]');
const hero = document.querySelector<HTMLElement>('[data-hero]');
const canvas = document.querySelector<HTMLCanvasElement>('[data-dots]');
const header = document.querySelector<HTMLElement>('.site-header');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = window.matchMedia('(pointer: coarse)');

if (track && hero && canvas) {
  // ---------------------------------------------------------------- dots
  const field = new DotField(canvas);
  field.setStill(reducedMotion.matches);

  let heroVisible = true;
  const syncRunning = () => {
    if (heroVisible && !document.hidden && !reducedMotion.matches) {
      field.start();
    } else {
      field.stop();
    }
  };
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    syncRunning();
  }).observe(hero);
  document.addEventListener('visibilitychange', syncRunning);
  reducedMotion.addEventListener('change', () => {
    field.setStill(reducedMotion.matches);
    measure();
    syncRunning();
  });

  const toCanvas = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
    const { x, y } = toCanvas(event.clientX, event.clientY);
    field.setPointer(x, y);
  });
  hero.addEventListener('pointerleave', () => {
    field.clearPointer();
  });
  hero.addEventListener('click', (event) => {
    const target = event.target as Element;
    if (target.closest('a, button, input, label')) return;
    const { x, y } = toCanvas(event.clientX, event.clientY);
    field.push(x, y);
  });

  // ---------------------------------------------------------------- hold
  let holdLength = 0;
  const measure = () => {
    holdLength = Math.max(0, track.offsetHeight - hero.offsetHeight);
  };
  measure();
  new ResizeObserver(measure).observe(track);

  const headerOffset = (el: Element) =>
    parseFloat(getComputedStyle(el).scrollMarginTop) || 0;

  const sectionY = (id: string) => {
    if (id === 'top') return 0;
    const el = document.getElementById(id);
    if (!el) return null;
    return el.getBoundingClientRect().top + window.scrollY - headerOffset(el);
  };

  let lastY = window.scrollY;
  let direction: -1 | 1 = 1;
  let input: ScrollInput = 'pointer';

  const render = () => {
    const y = window.scrollY;
    if (y !== lastY) direction = y > lastY ? 1 : -1;
    lastY = y;
    const progress = holdProgress(y, holdLength);
    hero.style.setProperty('--p', progress.toFixed(4));
    // Once the content has faded out, take it out of the tab order and stop
    // invisible buttons catching clicks.
    hero.toggleAttribute('data-faded', progress > 0.85);
    field.setScatter(reducedMotion.matches ? 0 : progress);
    if (header) {
      const pastHero = y >= holdLength + window.innerHeight * 0.5;
      header.dataset.state = pastHero ? 'solid' : 'hero';
    }
  };

  // ------------------------------------------------------- smooth scroll
  let tweenFrame = 0;
  let tweening = false;
  // Scroll events caused by our own animation must not trigger a snap.
  let ignoreSettleUntil = 0;

  const cancelTween = () => {
    if (!tweening) return;
    cancelAnimationFrame(tweenFrame);
    tweening = false;
  };

  const scrollToY = (y: number, duration: number, done?: () => void) => {
    cancelTween();
    const start = window.scrollY;
    const distance = y - start;
    if (duration <= 0 || Math.abs(distance) < 1) {
      window.scrollTo(0, y);
      ignoreSettleUntil = performance.now() + 200;
      done?.();
      return;
    }
    tweening = true;
    const began = performance.now();
    const step = (now: number) => {
      if (!tweening) return;
      const t = Math.min(1, (now - began) / duration);
      window.scrollTo(0, start + distance * easeInOutCubic(t));
      if (t < 1) {
        tweenFrame = requestAnimationFrame(step);
      } else {
        tweening = false;
        ignoreSettleUntil = performance.now() + 200;
        done?.();
      }
    };
    tweenFrame = requestAnimationFrame(step);
  };

  // Any deliberate input from the visitor takes over from an animation.
  for (const type of ['wheel', 'touchstart', 'pointerdown'] as const) {
    window.addEventListener(
      type,
      () => {
        input = 'pointer';
        cancelTween();
      },
      { passive: true },
    );
  }
  const scrollKeys = new Set([
    'ArrowDown',
    'ArrowUp',
    'PageDown',
    'PageUp',
    'Home',
    'End',
    ' ',
  ]);
  window.addEventListener('keydown', (event) => {
    if (!scrollKeys.has(event.key)) return;
    input = 'keyboard';
    cancelTween();
  });

  // ---------------------------------------------------------------- snap
  let touching = false;
  let settleTimer = 0;

  const trySnap = () => {
    if (
      tweening ||
      touching ||
      reducedMotion.matches ||
      performance.now() < ignoreSettleUntil
    ) {
      return;
    }
    const contentTop = sectionY('about');
    if (contentTop === null) return;
    const target = snapTarget({
      scrollY: window.scrollY,
      holdLength,
      contentTop,
      threshold: holdConfig.snapThreshold,
      direction,
      input,
    });
    if (target === null) return;
    const ms = coarsePointer.matches
      ? holdConfig.snapMs.mobile
      : holdConfig.snapMs.desktop;
    scrollToY(target, ms);
  };

  const scheduleSnap = (delay: number) => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(trySnap, delay);
  };

  const supportsScrollEnd = 'onscrollend' in window;
  window.addEventListener(
    'scroll',
    () => {
      render();
      // A new scroll cancels any pending snap; without `scrollend`, wait for
      // scroll events to stop instead.
      window.clearTimeout(settleTimer);
      if (!supportsScrollEnd) scheduleSnap(150 + holdConfig.settleMs);
    },
    { passive: true },
  );
  if (supportsScrollEnd) {
    window.addEventListener('scrollend', () => {
      scheduleSnap(holdConfig.settleMs);
    });
  }
  window.addEventListener(
    'touchstart',
    () => {
      touching = true;
      window.clearTimeout(settleTimer);
    },
    { passive: true },
  );
  const endTouch = () => {
    touching = false;
    scheduleSnap(150 + holdConfig.settleMs);
  };
  window.addEventListener('touchend', endTouch, { passive: true });
  window.addEventListener('touchcancel', endTouch, { passive: true });
  window.addEventListener('resize', render, { passive: true });

  // ------------------------------------------------------ section jumps
  const focusSection = (id: string) => {
    const heading =
      id === 'top'
        ? document.getElementById('hero-name')
        : document.querySelector<HTMLElement>(`#${id} [data-section-heading]`);
    heading?.focus({ preventScroll: true });
  };

  document.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      'a[data-jump]',
    );
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const id = link.dataset.jump ?? '';
    const y = sectionY(id);
    if (y === null) return;
    event.preventDefault();

    // A history entry per jump, so Back returns to where the visitor was.
    const hash = id === 'top' ? '' : `#${id}`;
    if (location.hash !== hash) {
      history.pushState(null, '', hash || location.pathname);
    }

    // Burst from the button when the dots are still on screen.
    if (holdProgress(window.scrollY, holdLength) < 1 && hero.contains(link)) {
      const rect = link.getBoundingClientRect();
      const { x, y: by } = toCanvas(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
      field.burst(x, by);
    }

    const duration = reducedMotion.matches
      ? 0
      : jumpDuration(y - window.scrollY);
    scrollToY(y, duration, () => {
      focusSection(id);
    });
  });

  // Coming back to the page part-way through the hold (e.g. a reload):
  // settle it the same way as a scroll would.
  render();
  if (!location.hash) {
    window.addEventListener('load', () => {
      render();
      scheduleSnap(300);
    });
  }
}
