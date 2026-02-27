import { test, expect } from '@playwright/test';
import { createMatchViaUI, openRemote, openScoreboard, scoreGameRemote } from './helpers';

test.describe('Match Completion', () => {
  test('scoreboard shows completion overlay when match ends', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Los Reyes', 'Los Duques', 'Single Set');
    await setupPage.close();

    const scoreboard = await browser.newPage();
    const remote = await browser.newPage();

    await openScoreboard(scoreboard, matchId);
    await openRemote(remote, matchId);

    // Win 6 games for team A (single set)
    for (let i = 0; i < 6; i++) {
      await scoreGameRemote(remote, 'a');
    }

    // Scoreboard should show completion
    await expect(scoreboard.getByText('VAMOS!')).toBeVisible({ timeout: 5000 });
    await expect(scoreboard.getByText('LOS REYES')).toBeVisible();
    await expect(scoreboard.getByText('wins!')).toBeVisible();
    await expect(scoreboard.getByText('6-0')).toBeVisible();

    await scoreboard.close();
    await remote.close();
  });

  test('remote shows completion overlay when match ends', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Los Leones', 'Los Tigres', 'Single Set');
    await setupPage.close();

    const remote = await browser.newPage();
    await openRemote(remote, matchId);

    // Win match
    for (let i = 0; i < 6; i++) {
      await scoreGameRemote(remote, 'a');
    }

    // Remote should show winner
    await expect(remote.getByText('VAMOS!')).toBeVisible({ timeout: 5000 });
    await expect(remote.getByText('LOS LEONES')).toBeVisible();
    await expect(remote.getByText('wins!')).toBeVisible();

    await remote.close();
  });

  test('completion shows correct set scores for multi-set match', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Los Rojos', 'Los Azules', 'Short Sets');
    await setupPage.close();

    const remote = await browser.newPage();
    await openRemote(remote, matchId);

    // Set 1: A wins 4-2
    await scoreGameRemote(remote, 'a');
    await scoreGameRemote(remote, 'a');
    await scoreGameRemote(remote, 'b');
    await scoreGameRemote(remote, 'a');
    await scoreGameRemote(remote, 'b');
    await scoreGameRemote(remote, 'a');

    await expect(remote.getByText('Set 2')).toBeVisible({ timeout: 3000 });

    // Set 2: A wins 4-1
    await scoreGameRemote(remote, 'a');
    await scoreGameRemote(remote, 'b');
    await scoreGameRemote(remote, 'a');
    await scoreGameRemote(remote, 'a');
    await scoreGameRemote(remote, 'a');

    // Should show both set scores
    await expect(remote.getByText('VAMOS!')).toBeVisible({ timeout: 5000 });
    await expect(remote.getByText('4-2')).toBeVisible();
    await expect(remote.getByText('4-1')).toBeVisible();

    await remote.close();
  });

  test('New Match button on scoreboard completion goes to home', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Los Finales', 'Los Otros', 'Single Set');
    await setupPage.close();

    const scoreboard = await browser.newPage();
    const remote = await browser.newPage();

    await openScoreboard(scoreboard, matchId);
    await openRemote(remote, matchId);

    // Win match
    for (let i = 0; i < 6; i++) {
      await scoreGameRemote(remote, 'a');
    }

    await expect(scoreboard.getByText('VAMOS!')).toBeVisible({ timeout: 5000 });

    // Click New Match on scoreboard
    await scoreboard.getByText('New Match').click();
    await expect(scoreboard).toHaveURL('/');

    await scoreboard.close();
    await remote.close();
  });
});
