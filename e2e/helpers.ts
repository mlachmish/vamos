import { Page, expect } from '@playwright/test';

/**
 * Creates a match through the UI and returns the match ID.
 * Ends on the scoreboard page.
 */
export async function createMatchViaUI(
  page: Page,
  teamAP1 = 'Juan',
  teamAP2 = 'Maria',
  teamBP1 = 'Pedro',
  teamBP2 = 'Ana',
  format: 'Standard' | 'Golden Point' | 'Short Sets' | 'Single Set' = 'Standard'
): Promise<string> {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Match' }).click();

  const inputs = page.getByPlaceholder('Player name...');
  await inputs.nth(0).fill(teamAP1);
  await inputs.nth(1).fill(teamAP2);
  await inputs.nth(2).fill(teamBP1);
  await inputs.nth(3).fill(teamBP2);

  if (format !== 'Standard') {
    await page.getByText(format, { exact: true }).click();
  }

  await page.getByRole('button', { name: 'Start Match' }).click();
  await page.waitForURL(/\/match\/.*\/scoreboard/);

  const url = page.url();
  const matchId = url.split('/match/')[1].split('/')[0];
  return matchId;
}

/**
 * Opens the scoreboard page for a given match ID.
 */
export async function openScoreboard(page: Page, matchId: string) {
  await page.goto(`/match/${matchId}/scoreboard`);
  await page.waitForSelector('[data-testid="score-team-a"]');
}

/**
 * Scores a point for a team on the scoreboard.
 * Waits for the DB round-trip to complete before returning.
 */
export async function scorePoint(page: Page, team: 'a' | 'b') {
  await page.getByTestId(`score-team-${team}`).click();
  // Wait for: debounce (400ms) + DB round-trip + confetti + real-time subscription updates
  await page.waitForTimeout(650);
}

/**
 * Scores N points for a team.
 */
export async function scorePoints(page: Page, team: 'a' | 'b', count: number) {
  for (let i = 0; i < count; i++) {
    await scorePoint(page, team);
  }
}

/**
 * Scores a full game for a team (4 consecutive points from 0-0).
 * Waits an extra 200ms after the game to ensure UI has fully updated.
 */
export async function scoreGame(page: Page, team: 'a' | 'b') {
  await scorePoints(page, team, 4);
  // Extra wait for game completion effects (confetti, set progression, etc.)
  await page.waitForTimeout(200);
}

/**
 * Gets the current game score displayed on the scoreboard.
 */
export async function getGameScore(page: Page): Promise<{ a: string; b: string }> {
  const teamA = page.getByTestId('score-team-a').locator('.text-\\[8rem\\]');
  const teamB = page.getByTestId('score-team-b').locator('.text-\\[8rem\\]');
  return {
    a: (await teamA.textContent()) ?? '',
    b: (await teamB.textContent()) ?? '',
  };
}
