import { test, expect } from '@playwright/test';
import { createMatchViaUI } from './helpers';

test.describe('Scoreboard Display', () => {
  test('shows team names and initial score', async ({ page }) => {
    await createMatchViaUI(page, 'Los Vikingos', 'Las Cobras');

    await expect(page.getByText('LOS VIKINGOS')).toBeVisible();
    await expect(page.getByText('LAS COBRAS')).toBeVisible();
    await expect(page.getByText('vs')).toBeVisible();

    // Initial game score should be 0-0
    const scores = page.locator('.text-\\[8rem\\]');
    await expect(scores.nth(0)).toHaveText('0');
    await expect(scores.nth(1)).toHaveText('0');
  });

  test('shows set score header', async ({ page }) => {
    await createMatchViaUI(page, 'Los Lobos', 'Las Aguilas');

    // Should show initial set score 0-0
    const setScoreArea = page.locator('.font-mono.font-bold').first();
    await expect(setScoreArea).toBeVisible();
  });

  test('shows game and set info in footer', async ({ page }) => {
    await createMatchViaUI(page, 'Los Lobos', 'Las Aguilas');

    await expect(page.getByText('Game 1')).toBeVisible();
    await expect(page.getByText('Set 1')).toBeVisible();
  });

  test('shows QR Remote button', async ({ page }) => {
    await createMatchViaUI(page, 'Los Lobos', 'Las Aguilas');

    await expect(page.getByText('QR Remote')).toBeVisible();
  });

  test('QR button opens modal with QR code and link', async ({ page }) => {
    const matchId = await createMatchViaUI(page, 'Los Lobos', 'Las Aguilas');

    await page.getByText('QR Remote').click();

    await expect(page.getByText('Scan to control')).toBeVisible();
    await expect(page.getByText('Copy link')).toBeVisible();
    // URL should contain the remote path
    await expect(page.getByText(`/match/${matchId}/remote`)).toBeVisible();
  });

  test('QR modal closes when clicking backdrop', async ({ page }) => {
    await createMatchViaUI(page, 'Los Lobos', 'Las Aguilas');

    await page.getByText('QR Remote').click();
    await expect(page.getByText('Scan to control')).toBeVisible();

    // Click the backdrop (the outer overlay div)
    await page.locator('.bg-black\\/80').click({ position: { x: 10, y: 10 } });
    await expect(page.getByText('Scan to control')).not.toBeVisible();
  });

  test('shows serving indicator for team A initially', async ({ page }) => {
    await createMatchViaUI(page, 'Los Lobos', 'Las Aguilas');

    // Team A serves first — should have the green serve dot
    const serveDot = page.locator('.bg-accent.animate-pulse');
    await expect(serveDot).toBeVisible();
  });

  test('shows match not found for invalid ID', async ({ page }) => {
    await page.goto('/match/nonexistent-id/scoreboard');
    await expect(page.getByText('Match not found')).toBeVisible();
    await expect(page.getByText('Back to home')).toBeVisible();
  });
});
