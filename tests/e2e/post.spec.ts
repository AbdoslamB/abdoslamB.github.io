import { expect, test } from '@playwright/test';

const POST = '/writing/self-driving-cars-2021/';

test('the 2021 article is published with its original date', async ({
  page,
}) => {
  await page.goto(POST);
  // The title is free to change; the page just needs one.
  await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();
  await expect(page.locator('.page__meta time')).toHaveAttribute(
    'datetime',
    '2021-11-08T00:00:00.000Z',
  );
  // Reading time counts the visible words (~220 a minute), not the
  // illustrations' SVG markup.
  const shown = Number(
    /(\d+) min read/.exec(await page.locator('.page__meta').innerText())?.[1],
  );
  const words = await page
    .locator('.prose')
    .evaluate((el) => (el as HTMLElement).innerText.split(/\s+/).length);
  expect(Math.abs(shown - words / 220)).toBeLessThanOrEqual(1);
  await expect(page.getByText('A note before you read')).toHaveCount(0);
  // Four inline illustrations, each described for screen readers.
  const art = page.locator('.prose figure.illustration svg[role="img"]');
  await expect(art).toHaveCount(4);
  for (const svg of await art.all()) {
    expect(await svg.getAttribute('aria-label')).toBeTruthy();
  }
  await expect(page.getByRole('heading', { name: 'Sources' })).toHaveCount(0);
});

test('"Dig deeper" is collapsed until opened, with linked titles', async ({
  page,
}) => {
  await page.goto(POST);
  const section = page.locator('details.dig-deeper');
  const summary = section.locator('summary');
  await expect(summary).toContainText('Dig deeper');
  await expect(section).not.toHaveAttribute('open');
  await expect(section.getByRole('link').first()).toBeHidden();

  await summary.click();
  await expect(section).toHaveAttribute('open', '');
  const links = section.getByRole('link');
  // One link per listed source; the badge shows the same number.
  const listed = Number(
    await section.locator('.dig-deeper__count').innerText(),
  );
  expect(listed).toBeGreaterThan(0);
  await expect(links).toHaveCount(listed);
  await expect(links.first()).toBeVisible();
  // Titles carry the links; no raw URLs are shown.
  expect(await section.locator('ul').innerText()).not.toContain('https://');
  await expect(section.getByRole('link', { name: /Nature/ })).toHaveAttribute(
    'href',
    'https://www.nature.com/articles/d41586-018-07135-0',
  );

  // Keyboard users can close it again.
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(section).not.toHaveAttribute('open');
});

test('search engines see the article and its citations', async ({ page }) => {
  await page.goto(POST);
  const jsonLd = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      '{}',
  ) as { '@graph': { '@type': string; citation?: string[] }[] };
  const post = jsonLd['@graph'].find((node) => node['@type'] === 'BlogPosting');
  const listed = await page.locator('.dig-deeper__list li').count();
  expect(post?.citation).toHaveLength(listed);
});

test('post cards show up to three small tags; the article page shows none', async ({
  page,
}) => {
  await page.goto('/writing/');
  const card = page.locator('.post-card', {
    has: page.getByRole('link', { name: /Self-Driving Cars/ }),
  });
  await expect(card).toBeVisible();
  const tags = card.locator('.post-card__tags li');
  expect(await tags.count()).toBeGreaterThan(0);
  expect(await tags.count()).toBeLessThanOrEqual(3);

  await page.goto(POST);
  await expect(
    page.locator('.post-card__tags, .page__header .tags'),
  ).toHaveCount(0);
});

test('in-article illustrations sit on the left with text beside them', async ({
  page,
}) => {
  await page.goto(POST);
  const inline = page.locator('.prose .illustration--inline');
  await expect(inline).toHaveCount(3);
  const proseWidth = await page
    .locator('.prose')
    .evaluate((el) => el.getBoundingClientRect().width);
  for (const figure of await inline.all()) {
    const { float, width } = await figure.evaluate((el) => ({
      float: getComputedStyle(el).float,
      width: el.getBoundingClientRect().width,
    }));
    expect(float).toBe('left');
    expect(width).toBeLessThan(proseWidth / 2);
  }
  // The opening illustration stays full width.
  const hero = page.locator('.prose .illustration:not(.illustration--inline)');
  await expect(hero).toHaveCount(1);
  expect(await hero.evaluate((el) => getComputedStyle(el).float)).toBe('none');
});
