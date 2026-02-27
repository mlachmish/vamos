import { test, expect } from '@playwright/test';
import { createMatchViaUI, openScoreboard, scorePoint, scoreGame } from './helpers';

test.describe('Real-time Sync', () => {
  test('second scoreboard updates when first scores a point', async ({ browser }) => {
    // Create match
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage);
    await setupPage.close();

    // Open two scoreboard views
    const scoreboard1 = await browser.newPage();
    const scoreboard2 = await browser.newPage();

    await openScoreboard(scoreboard1, matchId);
    await openScoreboard(scoreboard2, matchId);

    // Verify initial state on scoreboard2
    const scoreElements = scoreboard2.locator('.text-\\[8rem\\]');
    await expect(scoreElements.nth(0)).toHaveText('0');
    await expect(scoreElements.nth(1)).toHaveText('0');

    // Score a point for Team A on scoreboard1
    await scorePoint(scoreboard1, 'a');

    // Scoreboard2 should update to show 15
    await expect(scoreElements.nth(0)).toHaveText('15', { timeout: 5000 });

    // Score another point for Team B on scoreboard1
    await scorePoint(scoreboard1, 'b');

    // Scoreboard2 should show 15 - 15
    await expect(scoreElements.nth(1)).toHaveText('15', { timeout: 5000 });

    await scoreboard1.close();
    await scoreboard2.close();
  });

  test('second scoreboard updates when first completes a game', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage);
    await setupPage.close();

    const scoreboard1 = await browser.newPage();
    const scoreboard2 = await browser.newPage();

    await openScoreboard(scoreboard1, matchId);
    await openScoreboard(scoreboard2, matchId);

    // Win a game on scoreboard1
    await scoreGame(scoreboard1, 'a');

    // Scoreboard2 should show game score reset to 0-0 and set score 1-0
    const scoreElements = scoreboard2.locator('.text-\\[8rem\\]');
    await expect(scoreElements.nth(0)).toHaveText('0', { timeout: 10000 });

    await scoreboard1.close();
    await scoreboard2.close();
  });

  test('second scoreboard reverts when first uses undo', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage);
    await setupPage.close();

    const scoreboard1 = await browser.newPage();
    const scoreboard2 = await browser.newPage();

    await openScoreboard(scoreboard1, matchId);
    await openScoreboard(scoreboard2, matchId);

    // Score two points
    await scorePoint(scoreboard1, 'a');
    await scorePoint(scoreboard1, 'a');

    const scoreElements = scoreboard2.locator('.text-\\[8rem\\]');
    await expect(scoreElements.nth(0)).toHaveText('30', { timeout: 5000 });

    // Undo on scoreboard1
    await scoreboard1.getByTestId('undo-button').click();
    await scoreboard1.waitForTimeout(300);

    // Scoreboard2 should revert to 15
    await expect(scoreElements.nth(0)).toHaveText('15', { timeout: 5000 });

    await scoreboard1.close();
    await scoreboard2.close();
  });
});
