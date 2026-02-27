import { test, expect } from '@playwright/test';

test.describe('Match Setup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Match' }).click();
  });

  test('can enter team names', async ({ page }) => {
    const inputs = page.getByPlaceholder('Team name...');
    await inputs.nth(0).fill('Los Lobos');
    await inputs.nth(1).fill('Las Aguilas');

    await expect(inputs.nth(0)).toHaveValue('Los Lobos');
    await expect(inputs.nth(1)).toHaveValue('Las Aguilas');
  });

  test('Start Match is disabled without both team names', async ({ page }) => {
    const startButton = page.getByRole('button', { name: 'Start Match' });

    // Both empty — disabled
    await expect(startButton).toBeDisabled();

    // Only team A — still disabled
    await page.getByPlaceholder('Team name...').nth(0).fill('Los Lobos');
    await expect(startButton).toBeDisabled();

    // Clear A, fill B — still disabled
    await page.getByPlaceholder('Team name...').nth(0).clear();
    await page.getByPlaceholder('Team name...').nth(1).fill('Las Aguilas');
    await expect(startButton).toBeDisabled();

    // Both filled — enabled
    await page.getByPlaceholder('Team name...').nth(0).fill('Los Lobos');
    await expect(startButton).toBeEnabled();
  });

  test('Standard format is selected by default', async ({ page }) => {
    const standardButton = page.getByText('Standard').first();
    // The selected format has accent border styling
    await expect(standardButton.locator('..')).toHaveClass(/border-accent/);
  });

  test('can select different formats', async ({ page }) => {
    // Click Golden Point
    await page.getByText('Golden Point', { exact: true }).click();
    const goldenButton = page.getByText('Golden Point', { exact: true }).locator('..');
    await expect(goldenButton).toHaveClass(/border-accent/);

    // Click Short Sets
    await page.getByText('Short Sets', { exact: true }).click();
    const shortButton = page.getByText('Short Sets', { exact: true }).locator('..');
    await expect(shortButton).toHaveClass(/border-accent/);

    // Click Single Set
    await page.getByText('Single Set', { exact: true }).click();
    const singleButton = page.getByText('Single Set', { exact: true }).locator('..');
    await expect(singleButton).toHaveClass(/border-accent/);
  });

  test('shows all four format options with descriptions', async ({ page }) => {
    await expect(page.getByText('Standard')).toBeVisible();
    await expect(page.getByText('Best of 3, deuce/advantage')).toBeVisible();

    await expect(page.getByText('Golden Point', { exact: true })).toBeVisible();
    await expect(page.getByText('Best of 3, no deuce')).toBeVisible();

    await expect(page.getByText('Short Sets', { exact: true })).toBeVisible();
    await expect(page.getByText('Best of 3, first to 4')).toBeVisible();

    await expect(page.getByText('Single Set', { exact: true })).toBeVisible();
    await expect(page.getByText('One set to 6 games')).toBeVisible();
  });

  test('Start Match creates match and navigates to scoreboard', async ({ page }) => {
    await page.getByPlaceholder('Team name...').nth(0).fill('Los Toros');
    await page.getByPlaceholder('Team name...').nth(1).fill('Las Panteras');

    await page.getByRole('button', { name: 'Start Match' }).click();
    await page.waitForURL(/\/match\/.*\/scoreboard/);

    // Should show the team names on the scoreboard
    await expect(page.getByText('LOS TOROS')).toBeVisible();
    await expect(page.getByText('LAS PANTERAS')).toBeVisible();
  });
});
