import { test, expect } from '@playwright/test';
import { createMatchViaUI, openScoreboard, scoreGame } from './helpers';

test.describe('Match Completion', () => {
  test('scoreboard shows completion overlay when match ends', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Rey', 'Reina', 'Duke', 'Duquesa', 'Single Set');
    await setupPage.close();

    const page = await browser.newPage();
    await openScoreboard(page, matchId);

    // Win 6 games for team A (single set)
    for (let i = 0; i < 6; i++) {
      await scoreGame(page, 'a');
    }

    // Should show completion
    await expect(page.getByText('VAMOS!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('REY & REINA')).toBeVisible();
    await expect(page.getByText('wins!')).toBeVisible();
    await expect(page.getByText('6-0')).toBeVisible();

    await page.close();
  });

  test('completion shows correct set scores for multi-set match', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Rojo', 'Carmesi', 'Azul', 'Celeste', 'Short Sets');
    await setupPage.close();

    const page = await browser.newPage();
    await openScoreboard(page, matchId);

    // Set 1: A wins 4-2
    await scoreGame(page, 'a');
    await scoreGame(page, 'a');
    await scoreGame(page, 'b');
    await scoreGame(page, 'a');
    await scoreGame(page, 'b');
    await scoreGame(page, 'a');

    await expect(page.getByText('Game 1 · Set 2')).toBeVisible({ timeout: 3000 });

    // Set 2: A wins 4-1
    await scoreGame(page, 'a');
    await scoreGame(page, 'b');
    await scoreGame(page, 'a');
    await scoreGame(page, 'a');
    await scoreGame(page, 'a');

    // Should show both set scores
    await expect(page.getByText('VAMOS!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('4-2')).toBeVisible();
    await expect(page.getByText('4-1')).toBeVisible();

    await page.close();
  });

  test('New Match button on completion goes to home', async ({ browser }) => {
    const setupPage = await browser.newPage();
    const matchId = await createMatchViaUI(setupPage, 'Final', 'Ultimo', 'Otro', 'Mas', 'Single Set');
    await setupPage.close();

    const page = await browser.newPage();
    await openScoreboard(page, matchId);

    // Win match
    for (let i = 0; i < 6; i++) {
      await scoreGame(page, 'a');
    }

    await expect(page.getByText('VAMOS!')).toBeVisible({ timeout: 5000 });

    // Click New Match
    await page.getByText('New Match').click();
    await expect(page).toHaveURL('/');

    await page.close();
  });
});
