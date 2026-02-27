import { test, expect } from '@playwright/test';
import { createMatchViaUI } from './helpers';

// Use a portrait viewport so the scoreboard renders in portrait mode
test.use({ viewport: { width: 390, height: 844 } });

test.describe('Scoreboard Display', () => {
  test('shows team names and initial score', async ({ page }) => {
    await createMatchViaUI(page, 'Carlos', 'Diego', 'Sofia', 'Luna');

    await expect(page.getByText('CARLOS & DIEGO')).toBeVisible();
    await expect(page.getByText('SOFIA & LUNA')).toBeVisible();
    await expect(page.getByText('vs')).toBeVisible();

    // Initial game score should be 0-0
    const scores = page.locator('.text-\\[8rem\\]');
    await expect(scores.nth(0)).toHaveText('0');
    await expect(scores.nth(1)).toHaveText('0');
  });

  test('shows set score header', async ({ page }) => {
    await createMatchViaUI(page);

    // Should show initial set score 0-0
    const setScoreArea = page.locator('.font-mono.font-bold').first();
    await expect(setScoreArea).toBeVisible();
  });

  test('shows game and set info in footer', async ({ page }) => {
    await createMatchViaUI(page);

    await expect(page.getByText('Game 1 · Set 1')).toBeVisible();
  });

  test('shows Share button', async ({ page }) => {
    await createMatchViaUI(page);

    await expect(page.getByText('Share')).toBeVisible();
  });

  test('Share button opens modal with QR code and link', async ({ page }) => {
    const matchId = await createMatchViaUI(page);

    await page.getByText('Share').click();

    await expect(page.getByText('Scan to join')).toBeVisible();
    await expect(page.getByText('Copy link')).toBeVisible();
    // URL should contain the scoreboard path
    await expect(page.getByText(`/match/${matchId}/scoreboard`)).toBeVisible();
  });

  test('Share modal closes when clicking backdrop', async ({ page }) => {
    await createMatchViaUI(page);

    await page.getByText('Share').click();
    await expect(page.getByText('Scan to join')).toBeVisible();

    // Click the backdrop (the outer overlay div)
    await page.locator('.bg-black\\/80').click({ position: { x: 10, y: 10 } });
    await expect(page.getByText('Scan to join')).not.toBeVisible();
  });

  test('shows serving indicator for team A initially', async ({ page }) => {
    await createMatchViaUI(page);

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

test.describe('Scoreboard Tap-to-Score', () => {
  test('tap Team A scores a point', async ({ page }) => {
    await createMatchViaUI(page);

    // Tap Team A zone
    await page.getByTestId('score-team-a').click();
    await page.waitForTimeout(500);

    // Team A score should be 15
    const scores = page.locator('.text-\\[8rem\\]');
    await expect(scores.nth(0)).toHaveText('15');
    await expect(scores.nth(1)).toHaveText('0');
  });

  test('tap Team B scores a point', async ({ page }) => {
    await createMatchViaUI(page);

    // Tap Team B zone
    await page.getByTestId('score-team-b').click();
    await page.waitForTimeout(500);

    // Team B score should be 15
    const scores = page.locator('.text-\\[8rem\\]');
    await expect(scores.nth(0)).toHaveText('0');
    await expect(scores.nth(1)).toHaveText('15');
  });

  test('undo reverses the last point', async ({ page }) => {
    await createMatchViaUI(page);

    // Score a point for Team A
    await page.getByTestId('score-team-a').click();
    await page.waitForTimeout(500);

    const scores = page.locator('.text-\\[8rem\\]');
    await expect(scores.nth(0)).toHaveText('15');

    // Undo
    await page.getByTestId('undo-button').click();
    await page.waitForTimeout(500);

    // Should be back to 0-0
    await expect(scores.nth(0)).toHaveText('0');
    await expect(scores.nth(1)).toHaveText('0');
  });

  test('undo button is disabled when no points scored', async ({ page }) => {
    await createMatchViaUI(page);

    const undoButton = page.getByTestId('undo-button');
    await expect(undoButton).toBeDisabled();
  });

  test('debounce prevents rapid double-tap', async ({ page }) => {
    await createMatchViaUI(page);

    // Rapid double-tap Team A (within 400ms debounce)
    const teamA = page.getByTestId('score-team-a');
    await teamA.click();
    await teamA.click(); // immediate second click — should be debounced
    await page.waitForTimeout(500);

    // Only one point should have been scored (15, not 30)
    const scores = page.locator('.text-\\[8rem\\]');
    await expect(scores.nth(0)).toHaveText('15');
  });
});
