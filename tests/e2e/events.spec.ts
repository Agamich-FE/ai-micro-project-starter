import { test, expect, type Locator } from '@playwright/test';

/**
 * Smoke tests for the Events feature added by the ls_events recipe.
 *
 * Expects a site with the recipe applied and its sample content (run
 * scripts/test-recipe.sh first, or apply the recipe by hand). Selectors use
 * the view's own CSS classes (`css_class` in the recipe's view config, added
 * by Views in every theme) and the component classes, never theme markup
 * such as Olivero's `view-display-id-*`, so the tests pass on Olivero and
 * Stark.
 */

const listing = '.ls-events-listing';
const nextBlock = '.ls-events-next';

/** The event cards in the page listing (not the sidebar block). */
const pageCards = (page: import('@playwright/test').Page): Locator =>
  page.locator(`${listing} .event-card`);

test.describe('Upcoming events page', () => {
  test('lists event cards with a title link and date, soonest first', async ({ page }, testInfo) => {
    const response = await page.goto('/events');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Upcoming events' })).toBeVisible();

    const cards = pageCards(page);
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const starts: string[] = [];
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const link = card.locator('.event-card__title a');
      await expect(link).toHaveText(/\S/);
      await expect(link).toHaveAttribute('href', /^\/events\/[a-z0-9-]+$/);
      const start = card.locator('.event-card__date time').first();
      await expect(start).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T/);
      starts.push((await start.getAttribute('datetime')) ?? '');
    }
    // The view sorts by start date, ascending.
    expect(starts).toEqual([...starts].sort());

    await page.screenshot({ path: testInfo.outputPath('events-page.png'), fullPage: true });
  });

  test('category filter narrows the results', async ({ page }) => {
    await page.goto('/events');
    const before = await pageCards(page).count();

    await page.getByLabel('Category').selectOption({ label: 'Webinar' });
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page).toHaveURL(/[?&]category=\d+/);

    const cards = pageCards(page);
    await expect(cards.first()).toBeVisible();
    const after = await cards.count();
    expect(after).toBeGreaterThanOrEqual(1);
    expect(after).toBeLessThan(before);
    for (let i = 0; i < after; i++) {
      await expect(cards.nth(i).locator('.event-card__category')).toContainText('Webinar');
    }
  });

  test('"Next 3 events" block shows three events', async ({ page }) => {
    await page.goto('/events');
    await expect(page.locator(`${nextBlock} .event-card`)).toHaveCount(3);
  });
});

test.describe('Event page', () => {
  test('alias opens the full event with date, image alt and location', async ({ page }, testInfo) => {
    await page.goto('/events');
    const link = pageCards(page).first().locator('.event-card__title a');
    const title = (await link.textContent())?.trim() ?? '';
    const href = (await link.getAttribute('href')) ?? '';

    const response = await page.goto(href);
    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe(href);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    const card = page.locator('.event-card--full');
    await expect(card).toBeVisible();
    // The page title is the only h1/title; the card doesn't repeat it.
    await expect(card.locator('.event-card__title')).toHaveCount(0);
    await expect(card.locator('.event-card__date time').first()).toHaveAttribute('datetime', /^\d{4}-/);
    await expect(card.locator('.event-card__media img')).toHaveAttribute('alt', /\S/);
    await expect(card.locator('.event-card__location')).toContainText('Location');

    await page.screenshot({ path: testInfo.outputPath('event-page.png'), fullPage: true });
  });
});
