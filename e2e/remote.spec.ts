import { test, expect } from '@playwright/test';
import { createMatchViaUI, openRemote } from './helpers';

test.describe('Remote Control', () => {
  let matchId: string;

  test.beforeEach(async ({ page, browser }) => {
    // Create a match in one page, then open remote in the same page
    const setupPage = await browser.newPage();
    matchId = await createMatchViaUI(setupPage, 'Los Halcones', 'Las Fieras');
    await setupPage.close();

    await openRemote(page, matchId);
  });

  test('shows both team names as tap zones', async ({ page }) => {
    await expect(page.getByText('LOS HALCONES')).toBeVisible();
    await expect(page.getByText('LAS FIERAS')).toBeVisible();
    // Both "TAP TO SCORE" labels
    const tapLabels = page.getByText('TAP TO SCORE');
    await expect(tapLabels).toHaveCount(2);
  });

  test('shows score summary bar', async ({ page }) => {
    // Should show game score, set number, and set scores
    await expect(page.getByText('Set 1')).toBeVisible();
    await expect(page.getByText('0-0')).toBeVisible();
  });

  test('shows undo button', async ({ page }) => {
    await expect(page.getByText('Undo')).toBeVisible();
  });

  test('undo button is visually disabled when no history', async ({ page }) => {
    const undoButton = page.getByRole('button').filter({ hasText: 'Undo' });
    // Should have disabled attribute and reduced opacity
    await expect(undoButton).toBeDisabled();
  });

  test('tapping team A scores a point', async ({ page }) => {
    // Tap Team A zone
    await page.getByText('TAP TO SCORE').first().click();
    await page.waitForTimeout(300);

    // Score should update to 15 for team A
    const summaryBar = page.locator('.bg-surface.text-sm.font-mono');
    const teamAScore = summaryBar.locator('.text-team-a.font-bold');
    await expect(teamAScore).toHaveText('15');
  });

  test('tapping team B scores a point', async ({ page }) => {
    // Tap Team B zone
    await page.getByText('TAP TO SCORE').last().click();
    await page.waitForTimeout(300);

    // Score should update to 15 for team B
    const summaryBar = page.locator('.bg-surface.text-sm.font-mono');
    const teamBScore = summaryBar.locator('.text-team-b.font-bold');
    await expect(teamBScore).toHaveText('15');
  });

  test('undo becomes enabled after scoring a point', async ({ page }) => {
    const undoButton = page.getByRole('button').filter({ hasText: 'Undo' });
    await expect(undoButton).toBeDisabled();

    // Score a point
    await page.getByText('TAP TO SCORE').first().click();
    await page.waitForTimeout(300);

    await expect(undoButton).toBeEnabled();
  });

  test('shows match not found for invalid ID', async ({ page }) => {
    await page.goto('/match/invalid-match-xyz/remote');
    await expect(page.getByText('Match not found')).toBeVisible();
    await expect(page.getByText('Back to home')).toBeVisible();
  });
});
