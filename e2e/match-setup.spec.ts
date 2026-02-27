import { test, expect } from '@playwright/test';

test.describe('Match Setup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Match' }).click();
  });

  test('can enter player names', async ({ page }) => {
    const inputs = page.getByPlaceholder('Player name...');
    await inputs.nth(0).fill('Juan');
    await inputs.nth(1).fill('Maria');
    await inputs.nth(2).fill('Pedro');
    await inputs.nth(3).fill('Ana');

    await expect(inputs.nth(0)).toHaveValue('Juan');
    await expect(inputs.nth(1)).toHaveValue('Maria');
    await expect(inputs.nth(2)).toHaveValue('Pedro');
    await expect(inputs.nth(3)).toHaveValue('Ana');
  });

  test('Start Match is disabled without all four player names', async ({ page }) => {
    const startButton = page.getByRole('button', { name: 'Start Match' });
    const inputs = page.getByPlaceholder('Player name...');

    // All empty — disabled
    await expect(startButton).toBeDisabled();

    // Only one player — still disabled
    await inputs.nth(0).fill('Juan');
    await expect(startButton).toBeDisabled();

    // Three players — still disabled
    await inputs.nth(1).fill('Maria');
    await inputs.nth(2).fill('Pedro');
    await expect(startButton).toBeDisabled();

    // All four filled — enabled
    await inputs.nth(3).fill('Ana');
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
    const inputs = page.getByPlaceholder('Player name...');
    await inputs.nth(0).fill('Carlos');
    await inputs.nth(1).fill('Diego');
    await inputs.nth(2).fill('Sofia');
    await inputs.nth(3).fill('Luna');

    await page.getByRole('button', { name: 'Start Match' }).click();
    await page.waitForURL(/\/match\/.*\/scoreboard/);

    // Should show auto-generated team names on the scoreboard
    await expect(page.getByText('CARLOS & DIEGO')).toBeVisible();
    await expect(page.getByText('SOFIA & LUNA')).toBeVisible();
  });
});
