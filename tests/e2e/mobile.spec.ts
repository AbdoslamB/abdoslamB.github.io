import { expect, test } from '@playwright/test';

import { holdLength, sectionTop, settle } from './helpers';

test('mobile: shorter hold, no horizontal scroll, tap to jump', async ({
  page,
}) => {
  await page.goto('/');
  const viewport = page.viewportSize()?.height ?? 0;
  const hold = await holdLength(page);
  expect(hold).toBeGreaterThan(viewport * 0.7);
  expect(hold).toBeLessThanOrEqual(Math.ceil(viewport * 0.8) + 1);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  const target = await sectionTop(page, 'projects');
  await page
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('link', { name: 'Projects' })
    .tap();
  expect(Math.abs((await settle(page)) - target)).toBeLessThanOrEqual(2);
});

test('mobile: article illustrations stack above the text', async ({ page }) => {
  await page.goto('/writing/self-driving-cars-2021/');
  for (const figure of await page
    .locator('.prose .illustration--inline')
    .all()) {
    expect(await figure.evaluate((el) => getComputedStyle(el).float)).toBe(
      'none',
    );
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('mobile: every header link fits on screen', async ({ page }) => {
  // The post page always shows the solid header with all section links.
  await page.goto('/writing/self-driving-cars-2021/');
  // Nothing in the link list is clipped or scrolled out of view.
  const clipped = await page
    .locator('.site-header__links')
    .evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(clipped).toBeLessThanOrEqual(0);
});
