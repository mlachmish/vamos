import { Page, expect } from '@playwright/test';

/**
 * Creates a match through the UI and returns the match ID.
 * Ends on the scoreboard page.
 */
export async function createMatchViaUI(
  page: Page,
  teamA = 'Los Lobos',
  teamB = 'Las Aguilas',
  format: 'Standard' | 'Golden Point' | 'Short Sets' | 'Single Set' = 'Standard'
): Promise<string> {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Match' }).click();

  const inputs = page.getByPlaceholder('Team name...');
  await inputs.nth(0).fill(teamA);
  await inputs.nth(1).fill(teamB);

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
 * Scores a point for a team on the remote page.
 * Waits for the DB round-trip to complete before returning.
 */
export async function scorePointRemote(page: Page, team: 'a' | 'b') {
  // Get current point_history length from the page to know when the update completes
  const teamButton = team === 'a'
    ? page.getByText('TAP TO SCORE').first()
    : page.getByText('TAP TO SCORE').last();
  await teamButton.click();
  // Wait for the optimistic UI update to settle
  await page.waitForTimeout(500);
}

/**
 * Scores N points for a team.
 */
export async function scorePointsRemote(page: Page, team: 'a' | 'b', count: number) {
  for (let i = 0; i < count; i++) {
    await scorePointRemote(page, team);
  }
}

/**
 * Scores a full game for a team (4 consecutive points from 0-0).
 */
export async function scoreGameRemote(page: Page, team: 'a' | 'b') {
  await scorePointsRemote(page, team, 4);
}

/**
 * Opens the remote page for a given match ID.
 */
export async function openRemote(page: Page, matchId: string) {
  await page.goto(`/match/${matchId}/remote`);
  await page.waitForSelector('text=TAP TO SCORE');
}

/**
 * Opens the scoreboard page for a given match ID.
 */
export async function openScoreboard(page: Page, matchId: string) {
  await page.goto(`/match/${matchId}/scoreboard`);
  await page.waitForSelector('text=vs');
}

/**
 * Gets the current game score displayed on the remote page summary bar.
 */
export async function getRemoteGameScore(page: Page): Promise<{ a: string; b: string }> {
  const summaryBar = page.locator('.bg-surface.text-sm.font-mono');
  const teamAScore = summaryBar.locator('.text-team-a.font-bold');
  const teamBScore = summaryBar.locator('.text-team-b.font-bold');
  return {
    a: (await teamAScore.textContent()) ?? '',
    b: (await teamBScore.textContent()) ?? '',
  };
}
