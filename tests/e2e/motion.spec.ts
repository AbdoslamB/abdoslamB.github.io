import { expect, test } from '@playwright/test';

import { holdLength, scrollY, sectionTop, settle, wheel } from './helpers';

test.use({ reducedMotion: 'reduce' });

test('reduced motion: shorter hold, no snapping, instant jumps', async ({
  page,
}) => {
  await page.goto('/');
  const viewport = page.viewportSize()?.height ?? 0;
  expect(await holdLength(page)).toBeLessThanOrEqual(
    Math.ceil(viewport * 0.4) + 1,
  );

  // A small scroll stays where it is.
  await wheel(page, 100);
  const y = await settle(page);
  expect(y).toBeGreaterThan(0);

  // Jumps land immediately.
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  const contact = await sectionTop(page, 'contact');
  await page
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('link', { name: 'Contact' })
    .click();
  await page.waitForTimeout(50);
  expect(Math.abs((await scrollY(page)) - contact)).toBeLessThanOrEqual(2);
});

test('the 404 page offers a way home', async ({ page }) => {
  const response = await page.goto('/no-such-page');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('link', { name: 'Back home' })).toBeVisible();
});
