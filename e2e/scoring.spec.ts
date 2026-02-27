import { test, expect } from '@playwright/test';
import { createMatchViaUI, openRemote, scorePointRemote, scorePointsRemote, scoreGameRemote, getRemoteGameScore } from './helpers';

test.describe('Scoring Flow', () => {
  let matchId: string;

  async function setupMatch(page: any, browser: any, format: 'Standard' | 'Golden Point' | 'Short Sets' | 'Single Set' = 'Standard') {
    const setupPage = await browser.newPage();
    matchId = await createMatchViaUI(setupPage, 'Los Toros', 'Las Panteras', format);
    await setupPage.close();
    await openRemote(page, matchId);
  }

  test('scores points in sequence: 0 → 15 → 30 → 40', async ({ page, browser }) => {
    await setupMatch(page, browser);

    await scorePointRemote(page, 'a');
    let score = await getRemoteGameScore(page);
    expect(score.a).toBe('15');

    await scorePointRemote(page, 'a');
    score = await getRemoteGameScore(page);
    expect(score.a).toBe('30');

    await scorePointRemote(page, 'a');
    score = await getRemoteGameScore(page);
    expect(score.a).toBe('40');
  });

  test('wins a game after 4 consecutive points', async ({ page, browser }) => {
    await setupMatch(page, browser);

    // Score 4 points for team A — wins the game
    await scoreGameRemote(page, 'a');

    // Game score resets to 0-0, set score should show 1-0
    const score = await getRemoteGameScore(page);
    expect(score.a).toBe('0');
    expect(score.b).toBe('0');

    // Set score should reflect 1-0
    await expect(page.getByText('1-0')).toBeVisible();
  });

  test('handles deuce (40-40)', async ({ page, browser }) => {
    await setupMatch(page, browser);

    // Get to 40-40
    await scorePointsRemote(page, 'a', 3); // 40-0
    await scorePointsRemote(page, 'b', 3); // 40-40

    const score = await getRemoteGameScore(page);
    expect(score.a).toBe('40');
    expect(score.b).toBe('40');
  });

  test('handles advantage after deuce', async ({ page, browser }) => {
    await setupMatch(page, browser);

    // Get to 40-40
    await scorePointsRemote(page, 'a', 3);
    await scorePointsRemote(page, 'b', 3);

    // Advantage A
    await scorePointRemote(page, 'a');
    let score = await getRemoteGameScore(page);
    expect(score.a).toBe('AD');

    // Back to deuce
    await scorePointRemote(page, 'b');
    score = await getRemoteGameScore(page);
    expect(score.a).toBe('40');
    expect(score.b).toBe('40');
  });

  test('wins game from advantage', async ({ page, browser }) => {
    await setupMatch(page, browser);

    // Get to deuce
    await scorePointsRemote(page, 'a', 3);
    await scorePointsRemote(page, 'b', 3);

    // AD → Game
    await scorePointRemote(page, 'a'); // AD
    await scorePointRemote(page, 'a'); // Game

    await expect(page.getByText('1-0')).toBeVisible();
  });

  test('golden point: no deuce, 40-40 next point wins', async ({ page, browser }) => {
    await setupMatch(page, browser, 'Golden Point');

    // Get to 40-40
    await scorePointsRemote(page, 'a', 3);
    await scorePointsRemote(page, 'b', 3);

    // Next point wins immediately
    await scorePointRemote(page, 'b');

    // Should have won the game (score resets, game count changes)
    await expect(page.getByText('0-1')).toBeVisible();
  });

  test('undo reverts last point', async ({ page, browser }) => {
    await setupMatch(page, browser);

    await scorePointRemote(page, 'a'); // 15-0
    await scorePointRemote(page, 'a'); // 30-0

    let score = await getRemoteGameScore(page);
    expect(score.a).toBe('30');

    // Undo
    await page.getByText('Undo').click();
    await page.waitForTimeout(300);

    score = await getRemoteGameScore(page);
    expect(score.a).toBe('15');
  });

  test('undo works across game boundary', async ({ page, browser }) => {
    await setupMatch(page, browser);

    // Win a game
    await scoreGameRemote(page, 'a');
    await expect(page.getByText('1-0')).toBeVisible();

    // Undo — should go back to 40-0 in the game
    await page.getByText('Undo').click();
    await page.waitForTimeout(300);

    const score = await getRemoteGameScore(page);
    expect(score.a).toBe('40');
    expect(score.b).toBe('0');
  });

  test('multiple undo calls restore earlier state', async ({ page, browser }) => {
    await setupMatch(page, browser);

    await scorePointRemote(page, 'a'); // 15-0
    await scorePointRemote(page, 'b'); // 15-15
    await scorePointRemote(page, 'a'); // 30-15

    // Undo three times back to 0-0
    await page.getByText('Undo').click();
    await page.waitForTimeout(500);
    await page.getByText('Undo').click();
    await page.waitForTimeout(500);
    await page.getByText('Undo').click();
    await page.waitForTimeout(500);

    const score = await getRemoteGameScore(page);
    expect(score.a).toBe('0');
    expect(score.b).toBe('0');
  });
});
