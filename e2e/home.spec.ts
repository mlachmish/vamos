import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('shows VAMOS title and subtitle', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'VAMOS' })).toBeVisible();
    await expect(page.getByText('Padel Scoreboard')).toBeVisible();
  });

  test('shows New Match button and Join input', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'New Match' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter match code...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join' })).toBeVisible();
  });

  test('New Match button shows setup form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Match' }).click();

    await expect(page.getByText('New Match', { exact: false })).toBeVisible();
    await expect(page.getByText('Team A')).toBeVisible();
    await expect(page.getByText('Team B')).toBeVisible();
    await expect(page.getByPlaceholder('Player name...')).toHaveCount(4);
    await expect(page.getByText('Format')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Match' })).toBeVisible();
  });

  test('Back button returns to main view', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Match' }).click();
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();

    await page.getByRole('button', { name: 'Back' }).click();
    // Should be back to the main view with the New Match button
    await expect(page.getByRole('button', { name: 'New Match' })).toBeVisible();
    // Setup form should be gone
    await expect(page.getByText('Team A')).not.toBeVisible();
  });

  test('Join navigates to scoreboard view with entered code', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Enter match code...').fill('test-match-123');
    await page.getByRole('button', { name: 'Join' }).click();

    await expect(page).toHaveURL(/\/match\/test-match-123\/scoreboard/);
  });

  test('Join works with Enter key', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Enter match code...').fill('abc123');
    await page.getByPlaceholder('Enter match code...').press('Enter');

    await expect(page).toHaveURL(/\/match\/abc123\/scoreboard/);
  });
});
