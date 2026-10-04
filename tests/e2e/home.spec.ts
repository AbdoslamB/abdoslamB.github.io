import { expect, test } from '@playwright/test';

import {
  holdLength,
  scrollSteps,
  scrollY,
  sectionTop,
  settle,
  wheel,
} from './helpers';

let errors: string[] = [];

test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
});

// Any script error on the page fails the test.
test.afterEach(() => {
  expect(errors, 'console/page errors').toEqual([]);
});

test('hero shows the name, title, sections and dots', async ({ page }) => {
  await expect(
    page.getByRole('heading', { level: 1, name: 'Abdoslam Baabbad' }),
  ).toBeVisible();
  await expect(
    page.getByText('Data Scientist · Business Analyst'),
  ).toBeVisible();
  // Writing joins the buttons once enough posts are published (see
  // src/lib/posts.ts), so expect it exactly when the section is on the page.
  const hasWriting = (await page.locator('#writing').count()) > 0;
  const jump = page.getByRole('navigation', { name: 'Sections' });
  await expect(jump.getByRole('link')).toHaveText([
    'About',
    'Projects',
    ...(hasWriting ? ['Writing'] : []),
    'Contact',
  ]);
  const canvas = page.locator('[data-dots]');
  const size = await canvas.evaluate((el: HTMLCanvasElement) => [
    el.width,
    el.height,
  ]);
  expect(size[0]).toBeGreaterThan(0);
  expect(size[1]).toBeGreaterThan(0);
});

test('one accidental wheel notch springs back to the top', async ({ page }) => {
  await wheel(page, 100);
  expect(await settle(page)).toBe(0);
});

test('a slow partial scroll under halfway springs back', async ({ page }) => {
  const hold = await holdLength(page);
  await scrollSteps(page, Math.round(hold * 0.4));
  expect(await settle(page)).toBe(0);
});

test('scrolling past halfway carries on to About', async ({ page }) => {
  const hold = await holdLength(page);
  const about = await sectionTop(page, 'about');
  await scrollSteps(page, Math.round(hold * 0.6));
  expect(Math.abs((await settle(page)) - about)).toBeLessThanOrEqual(2);
  await expect(page.locator('.site-header')).toHaveAttribute(
    'data-state',
    'solid',
  );
});

test('section buttons glide to the section, update the URL and focus', async ({
  page,
}) => {
  const target = await sectionTop(page, 'projects');
  await page
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('link', { name: 'Projects' })
    .click();
  await expect(page).toHaveURL(/#projects$/);
  expect(Math.abs((await settle(page)) - target)).toBeLessThanOrEqual(2);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Projects' }),
  ).toBeFocused();

  // Back returns to the hero.
  await page.goBack();
  await expect(page).not.toHaveURL(/#/);
  expect(await settle(page)).toBe(0);
});

test('PageDown from the top moves on to About', async ({ page }) => {
  const about = await sectionTop(page, 'about');
  await page.keyboard.press('PageDown');
  expect(Math.abs((await settle(page)) - about)).toBeLessThanOrEqual(2);
});

test('deep links open at their section without snapping back', async ({
  page,
}) => {
  await page.goto('/#contact');
  const target = await sectionTop(page, 'contact');
  const y = await settle(page);
  expect(Math.abs(y - target)).toBeLessThanOrEqual(2);
});

test('theme choice survives a reload', async ({ page }) => {
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Dark mode' }).click();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Dark mode' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'light');
});

test('the demo loads only near the screen and follows the theme', async ({
  page,
}) => {
  const demo = page.locator('[data-demo]');
  const dark = demo.locator('video[data-theme-video="dark"]');
  const light = demo.locator('video[data-theme-video="light"]');
  // Nothing downloads while the visitor is on the hero.
  await expect(dark).not.toHaveAttribute('src', /./);

  await page.goto('/#projects');
  await expect(dark).toHaveAttribute('src', /inkdoc-demo-dark\.mp4$/);
  await expect(dark).toBeVisible();
  await expect(light).toBeHidden();
  // The other theme's recording waits until it's needed.
  await expect(light).not.toHaveAttribute('src', /./);

  await page.getByRole('button', { name: 'Dark mode' }).click();
  await expect(light).toHaveAttribute('src', /inkdoc-demo-light\.mp4$/);
  await expect(light).toBeVisible();
  await expect(dark).toBeHidden();
});

test('header navigation appears only after the hero', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav).toBeHidden();
  await page
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('link', { name: 'Contact' })
    .click();
  await settle(page);
  await expect(nav).toBeVisible();
  await nav.getByRole('link', { name: 'About' }).click();
  const about = await sectionTop(page, 'about');
  expect(Math.abs((await settle(page)) - about)).toBeLessThanOrEqual(2);
});

test('draft posts are not published', async ({ page }) => {
  // A draft has no page, and nothing on the homepage is marked as a draft.
  const response = await page.request.get('/writing/building-inkdoc/');
  expect(response.status()).toBe(404);
  await expect(page.locator('.badge', { hasText: 'Draft' })).toHaveCount(0);
  await expect(page.locator('a[href="/writing/building-inkdoc/"]')).toHaveCount(
    0,
  );
});

test('page metadata and share image are in place', async ({ page }) => {
  await expect(page).toHaveTitle(
    'Abdoslam Baabbad — Data Scientist & Business Analyst',
  );
  const description = await page
    .locator('meta[name="description"]')
    .getAttribute('content');
  expect(description?.length).toBeGreaterThan(80);
  const image = await page
    .locator('meta[property="og:image"]')
    .getAttribute('content');
  expect(image).toBe('https://abdoslamb.github.io/og/home.png');
  const png = await page.request.get('/og/home.png');
  expect(png.headers()['content-type']).toContain('image/png');
});

test('search engines get the profile data; visitors never see it', async ({
  page,
}) => {
  const jsonLd = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      '{}',
  ) as { '@graph': { '@type': string; [key: string]: unknown }[] };
  const types = jsonLd['@graph'].map((node) => node['@type']);
  expect(types).toEqual(['Person', 'WebSite', 'ProfilePage']);
  const person = jsonLd['@graph'][0];
  expect(person.alternateName).toEqual(['عبد السلام باعباد']);
  expect(person.familyName).toBe('Baabbad');

  // The Arabic name is for search engines only.
  const visibleText = await page.locator('body').innerText();
  expect(visibleText).not.toContain('عبد');

  await expect(page.locator('link[rel="me"]')).toHaveCount(2);
});

test('favicons are linked and served', async ({ page }) => {
  for (const href of await page
    .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')))) {
    const response = await page.request.get(href ?? '');
    expect(response.status(), href ?? '').toBe(200);
  }
  // Google shows a favicon in results only if one is a multiple of 48 px.
  await expect(
    page.locator('link[rel="icon"][sizes="96x96"][type="image/png"]'),
  ).toHaveCount(1);
});

test('the projects show live GitHub stats', async ({ page }) => {
  const flagship = page.locator('.flagship');
  await expect(flagship.getByRole('heading', { name: 'InkDoc' })).toBeVisible();
  await expect(flagship.locator('.stats')).toContainText('downloads');
  expect(await page.locator('#projects .card').count()).toBeGreaterThanOrEqual(
    3,
  );
});

test('scrolling does not move the page while a jump is in flight', async ({
  page,
}) => {
  // Regression guard: the snap must never fight a section jump.
  await page
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('link', { name: 'About' })
    .click();
  const about = await sectionTop(page, 'about');
  expect(Math.abs((await settle(page)) - about)).toBeLessThanOrEqual(2);
  expect(await scrollY(page)).toBeGreaterThan(0);
});

test('slow, deliberate notches are not pulled back mid-way', async ({
  page,
}) => {
  const hold = await holdLength(page);
  const about = await sectionTop(page, 'about');
  // One notch every 250 ms, as someone reading while scrolling might.
  await scrollSteps(page, Math.round(hold * 0.6), { gapMs: 250 });
  expect(Math.abs((await settle(page)) - about)).toBeLessThanOrEqual(2);
});

test('the first screen stays minimal: no social icons', async ({ page }) => {
  const hero = page.locator('[data-hero]');
  await expect(
    hero.getByRole('link', { name: /GitHub|LinkedIn|Email/ }),
  ).toHaveCount(0);
  // Contact is still one click away, with every way to connect.
  await page
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('link', { name: 'Contact' })
    .click();
  await settle(page);
  const contact = page.locator('#contact');
  await expect(
    contact.getByRole('heading', { level: 2, name: 'Get in touch' }),
  ).toBeFocused();
  await expect(contact.getByRole('link', { name: /Email me/ })).toBeVisible();
  await expect(contact.getByRole('link', { name: /LinkedIn/ })).toBeVisible();
  await expect(contact.getByRole('link', { name: /GitHub/ })).toBeVisible();
});

test('projects show only what helps: three tags, meaningful stars', async ({
  page,
}) => {
  const projects = page.locator('#projects');
  await expect(projects.getByText('All open source')).toBeVisible();
  await expect(projects.getByText(/Flagship project/i)).toHaveCount(0);
  await expect(projects.getByText(/Updated/)).toHaveCount(0);
  await expect(projects.locator('.flagship video:visible')).toHaveCount(1); // demo only

  for (const list of await projects.locator('.tags').all()) {
    expect(await list.locator('li').count()).toBeLessThanOrEqual(3);
  }
  // InkDoc's stars and downloads stay; low star counts elsewhere are hidden.
  await expect(projects.locator('.flagship .stats')).toContainText('downloads');
  await expect(projects.locator('.card .stats')).toHaveCount(0);
});

test('footer credits the author without a copyright line', async ({ page }) => {
  const footer = page.locator('.site-footer');
  await expect(footer.locator('p')).toHaveText('By Abdoslam Baabbad');
  await expect(footer).not.toContainText('©');
  await expect(footer.getByRole('link', { name: 'Source' })).toHaveCount(0);
});

test('logo reads "ab." and headings use the display font', async ({ page }) => {
  // The header nav (and its logo) is hidden over the hero, so query it
  // directly rather than by accessible role.
  const logo = page.locator('.site-header__logo');
  await expect(logo).toHaveAttribute('aria-label', 'Abdoslam Baabbad, home');
  await expect(logo).toHaveText('ab');
  await expect(logo.locator('.site-header__logo-dot')).toHaveCount(1);

  const family = await page
    .getByRole('heading', { level: 1 })
    .evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain('General Sans');
});

test('end-of-section links are quiet gray, not bold', async ({ page }) => {
  const link = page.locator('#projects .text-link').first();
  const style = await link.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { weight: cs.fontWeight, border: cs.borderBottomWidth };
  });
  expect(Number(style.weight)).toBeLessThan(600);
  expect(style.border).toBe('0px');
});
