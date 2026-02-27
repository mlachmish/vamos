import { test, expect } from '@playwright/test';
import { createMatchViaUI, openScoreboard, scoreGame } from './helpers';

test.describe('Full Match Flow', () => {
  test('play and win a complete short sets match', async ({ browser }) => {
    // Create a Short Sets match (best of 3, first to 4 games per set)
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Carlos', 'Diego', 'Sofia', 'Luna', 'Short Sets');
    await setupPage.close();

    const page = await browser.newPage();
    await openScoreboard(page, matchId);

    // --- Set 1: Team A wins 4-0 ---
    for (let i = 0; i < 4; i++) {
      await scoreGame(page, 'a');
    }

    // Should now be in Set 2
    await expect(page.getByText('Set 2')).toBeVisible({ timeout: 3000 });

    // --- Set 2: Team A wins 4-0 ---
    for (let i = 0; i < 4; i++) {
      await scoreGame(page, 'a');
    }

    // Match should be complete — winner screen
    await expect(page.getByText('VAMOS!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('CARLOS & DIEGO')).toBeVisible();
    await expect(page.getByText('wins!')).toBeVisible();

    // Should show set scores (both sets are 4-0)
    const setScores = page.getByText('4-0');
    await expect(setScores.first()).toBeVisible();
    expect(await setScores.count()).toBe(2);

    // "New Match" link should be present
    await expect(page.getByText('New Match')).toBeVisible();

    await page.close();
  });

  test('play a 3-set match where team B wins', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Pablo', 'Lucia', 'Marco', 'Elena', 'Short Sets');
    await setupPage.close();

    const page = await browser.newPage();
    await openScoreboard(page, matchId);

    // --- Set 1: Team A wins 4-0 ---
    for (let i = 0; i < 4; i++) {
      await scoreGame(page, 'a');
    }
    await expect(page.getByText('Set 2')).toBeVisible({ timeout: 3000 });

    // --- Set 2: Team B wins 4-0 ---
    for (let i = 0; i < 4; i++) {
      await scoreGame(page, 'b');
    }
    await expect(page.getByText('Set 3')).toBeVisible({ timeout: 3000 });

    // --- Set 3: Team B wins 4-0 ---
    for (let i = 0; i < 4; i++) {
      await scoreGame(page, 'b');
    }

    // Team B wins the match
    await expect(page.getByText('VAMOS!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('MARCO & ELENA')).toBeVisible();
    await expect(page.getByText('wins!')).toBeVisible();

    await page.close();
  });

  test('New Match link on completion screen navigates to home', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Rapido', 'Veloz', 'Lento', 'Calmo', 'Single Set');
    await setupPage.close();

    const page = await browser.newPage();
    await openScoreboard(page, matchId);

    // Win a single set match: 6-0
    for (let i = 0; i < 6; i++) {
      await scoreGame(page, 'a');
    }

    await expect(page.getByText('VAMOS!')).toBeVisible({ timeout: 5000 });

    // Click "New Match"
    await page.getByText('New Match').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'VAMOS' })).toBeVisible();

    await page.close();
  });
});
