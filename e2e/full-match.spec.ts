import { test, expect } from '@playwright/test';
import { createMatchViaUI, openRemote, scoreGameRemote } from './helpers';

test.describe('Full Match Flow', () => {
  test('play and win a complete short sets match', async ({ browser }) => {
    // Create a Short Sets match (best of 3, first to 4 games per set)
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Los Campeones', 'Los Retadores', 'Short Sets');
    await setupPage.close();

    const remote = await browser.newPage();
    await openRemote(remote, matchId);

    // --- Set 1: Team A wins 4-0 ---
    for (let i = 0; i < 4; i++) {
      await scoreGameRemote(remote, 'a');
    }

    // Should now be in Set 2
    await expect(remote.getByText('Set 2')).toBeVisible({ timeout: 3000 });

    // --- Set 2: Team A wins 4-0 ---
    for (let i = 0; i < 4; i++) {
      await scoreGameRemote(remote, 'a');
    }

    // Match should be complete — winner screen
    await expect(remote.getByText('VAMOS!')).toBeVisible({ timeout: 5000 });
    await expect(remote.getByText('LOS CAMPEONES')).toBeVisible();
    await expect(remote.getByText('wins!')).toBeVisible();

    // Should show set scores (both sets are 4-0)
    const setScores = remote.getByText('4-0');
    await expect(setScores.first()).toBeVisible();
    expect(await setScores.count()).toBe(2);

    // "New Match" link should be present
    await expect(remote.getByText('New Match')).toBeVisible();

    await remote.close();
  });

  test('play a 3-set match where team B wins', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Los Primeros', 'Los Segundos', 'Short Sets');
    await setupPage.close();

    const remote = await browser.newPage();
    await openRemote(remote, matchId);

    // --- Set 1: Team A wins 4-0 ---
    for (let i = 0; i < 4; i++) {
      await scoreGameRemote(remote, 'a');
    }
    await expect(remote.getByText('Set 2')).toBeVisible({ timeout: 3000 });

    // --- Set 2: Team B wins 4-0 ---
    for (let i = 0; i < 4; i++) {
      await scoreGameRemote(remote, 'b');
    }
    await expect(remote.getByText('Set 3')).toBeVisible({ timeout: 3000 });

    // --- Set 3: Team B wins 4-0 ---
    for (let i = 0; i < 4; i++) {
      await scoreGameRemote(remote, 'b');
    }

    // Team B wins the match
    await expect(remote.getByText('VAMOS!')).toBeVisible({ timeout: 5000 });
    await expect(remote.getByText('LOS SEGUNDOS')).toBeVisible();
    await expect(remote.getByText('wins!')).toBeVisible();

    await remote.close();
  });

  test('New Match link on completion screen navigates to home', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Los Rapidos', 'Los Lentos', 'Single Set');
    await setupPage.close();

    const remote = await browser.newPage();
    await openRemote(remote, matchId);

    // Win a single set match: 6-0
    for (let i = 0; i < 6; i++) {
      await scoreGameRemote(remote, 'a');
    }

    await expect(remote.getByText('VAMOS!')).toBeVisible({ timeout: 5000 });

    // Click "New Match"
    await remote.getByText('New Match').click();
    await expect(remote).toHaveURL('/');
    await expect(remote.getByRole('heading', { name: 'VAMOS' })).toBeVisible();

    await remote.close();
  });
});
