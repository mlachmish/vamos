import { test, expect } from '@playwright/test';
import { createMatchViaUI, openRemote, openScoreboard, scorePointRemote, scoreGameRemote } from './helpers';

test.describe('Real-time Sync', () => {
  test('scoreboard updates when remote scores a point', async ({ browser }) => {
    // Create match
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Los Rayos', 'Las Sombras');
    await setupPage.close();

    // Open both views
    const scoreboard = await browser.newPage();
    const remote = await browser.newPage();

    await openScoreboard(scoreboard, matchId);
    await openRemote(remote, matchId);

    // Verify initial state on scoreboard — both scores are 0
    const scoreElements = scoreboard.locator('.text-\\[8rem\\]');
    await expect(scoreElements.nth(0)).toHaveText('0');
    await expect(scoreElements.nth(1)).toHaveText('0');

    // Score a point for Team A on remote
    await scorePointRemote(remote, 'a');

    // Scoreboard should update to show 15
    await expect(scoreElements.nth(0)).toHaveText('15', { timeout: 5000 });

    // Score another point for Team B on remote
    await scorePointRemote(remote, 'b');

    // Scoreboard should show 15 - 15
    await expect(scoreElements.nth(1)).toHaveText('15', { timeout: 5000 });

    await scoreboard.close();
    await remote.close();
  });

  test('scoreboard updates when remote completes a game', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Los Rayos', 'Las Sombras');
    await setupPage.close();

    const scoreboard = await browser.newPage();
    const remote = await browser.newPage();

    await openScoreboard(scoreboard, matchId);
    await openRemote(remote, matchId);

    // Win a game on remote
    await scoreGameRemote(remote, 'a');

    // Scoreboard should show game score reset to 0-0 and set score 1-0
    const scoreElements = scoreboard.locator('.text-\\[8rem\\]');
    await expect(scoreElements.nth(0)).toHaveText('0', { timeout: 10000 });

    await scoreboard.close();
    await remote.close();
  });

  test('scoreboard reverts when remote uses undo', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Los Rayos', 'Las Sombras');
    await setupPage.close();

    const scoreboard = await browser.newPage();
    const remote = await browser.newPage();

    await openScoreboard(scoreboard, matchId);
    await openRemote(remote, matchId);

    // Score two points
    await scorePointRemote(remote, 'a');
    await scorePointRemote(remote, 'a');

    const scoreElements = scoreboard.locator('.text-\\[8rem\\]');
    await expect(scoreElements.nth(0)).toHaveText('30', { timeout: 5000 });

    // Undo on remote
    await remote.getByText('Undo').click();
    await remote.waitForTimeout(300);

    // Scoreboard should revert to 15
    await expect(scoreElements.nth(0)).toHaveText('15', { timeout: 5000 });

    await scoreboard.close();
    await remote.close();
  });
});
