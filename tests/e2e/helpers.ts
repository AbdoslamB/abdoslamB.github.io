import type { Page } from '@playwright/test';

export const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

export const holdLength = (page: Page) =>
  page.evaluate(() => {
    const track = document.querySelector<HTMLElement>('[data-hero-track]');
    const hero = document.querySelector<HTMLElement>('[data-hero]');
    return track && hero ? track.offsetHeight - hero.offsetHeight : 0;
  });

// Where a section sits once it's under the fixed header. The last section
// can't scroll all the way up, so this is capped at the bottom of the page.
export const sectionTop = (page: Page, id: string) =>
  page.evaluate((sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return Number.NaN;
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const top = el.getBoundingClientRect().top + window.scrollY - margin;
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    return Math.round(Math.min(top, maxScroll));
  }, id);

// Waits until the page stops moving (snaps and jumps included).
// Stable for longer than the snap's settle delay, so a pending snap is seen.
export const settle = async (page: Page, timeout = 5000) => {
  const deadline = Date.now() + timeout;
  let last = await scrollY(page);
  let stableFor = 0;
  while (Date.now() < deadline) {
    await page.waitForTimeout(100);
    const now = await scrollY(page);
    stableFor = now === last ? stableFor + 100 : 0;
    last = now;
    if (stableFor >= 900) return now;
  }
  return last;
};

// One real mouse-wheel notch.
export const wheel = async (page: Page, distance = 100) => {
  await page.mouse.move(200, 200);
  await page.mouse.wheel(0, distance);
};

// A continuous scroll in small steps, like a wheel or trackpad gesture. The
// steps are paced by the page's own timer: driving each one from the test
// process adds harness overhead that, under load, can stretch the gaps past
// the snap delay and make a deliberate scroll look like a pause.
export const scrollSteps = (
  page: Page,
  distance: number,
  { step = 100, gapMs = 16 } = {},
) =>
  page.evaluate(
    async ({ distance, step, gapMs }) => {
      for (let moved = 0; moved < distance; moved += step) {
        window.scrollBy(0, Math.min(step, distance - moved));
        await new Promise((resolve) => setTimeout(resolve, gapMs));
      }
    },
    { distance, step, gapMs },
  );
