import { test, expect } from '@playwright/test';

/**
 * Production Real-time Sync Test
 *
 * Tests that Supabase Realtime push updates work correctly on the live production app
 * by opening two browser tabs and verifying that scoring on one tab updates the other.
 */
test.describe('Production Real-time Sync', () => {
  test('two tabs sync when scoring on production app', async ({ browser }) => {
    const PRODUCTION_URL = 'https://vamos-padel.vercel.app';

    // Arrays to collect console logs from both pages
    const consoleLogsPage1: { type: string; text: string }[] = [];
    const consoleLogsPage2: { type: string; text: string }[] = [];

    // STEP 1: Create a new match on the first page
    const page1 = await browser.newPage();

    // Set up console log capture on page1
    page1.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Realtime') || text.includes('Vamos') || text.includes('vamos') || text.includes('supabase')) {
        consoleLogsPage1.push({
          type: msg.type(),
          text: text,
        });
      }
    });

    page1.on('pageerror', (error) => {
      consoleLogsPage1.push({
        type: 'error',
        text: `PAGE ERROR: ${error.message}`,
      });
    });

    await page1.goto(PRODUCTION_URL);

    // Click "New Match"
    await page1.getByRole('button', { name: 'New Match' }).click();

    // Fill in 4 player names
    const inputs = page1.getByPlaceholder('Player name...');
    await inputs.nth(0).fill('Alice');
    await inputs.nth(1).fill('Bob');
    await inputs.nth(2).fill('Charlie');
    await inputs.nth(3).fill('Diana');

    // Start the match
    await page1.getByRole('button', { name: 'Start Match' }).click();

    // Wait for navigation to scoreboard
    await page1.waitForURL(/\/match\/.*\/scoreboard/);

    // STEP 2: Grab the match URL
    const matchUrl = page1.url();
    console.log('Match URL:', matchUrl);

    // Wait for scoreboard to be ready
    await page1.waitForSelector('[data-testid="score-team-a"]', { timeout: 10000 });

    // STEP 3: Open a second page with the same match URL
    const page2 = await browser.newPage();

    // Set up console log capture on page2
    page2.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Realtime') || text.includes('Vamos') || text.includes('vamos') || text.includes('supabase')) {
        consoleLogsPage2.push({
          type: msg.type(),
          text: text,
        });
      }
    });

    // Also capture page errors
    page2.on('pageerror', (error) => {
      consoleLogsPage2.push({
        type: 'error',
        text: `PAGE ERROR: ${error.message}`,
      });
    });

    await page2.goto(matchUrl);
    await page2.waitForSelector('[data-testid="score-team-a"]', { timeout: 10000 });

    // Verify both pages show initial score of 0-0
    const scoreElements1 = page1.locator('.text-\\[8rem\\]');
    const scoreElements2 = page2.locator('.text-\\[8rem\\]');

    await expect(scoreElements1.nth(0)).toHaveText('0', { timeout: 5000 });
    await expect(scoreElements1.nth(1)).toHaveText('0', { timeout: 5000 });
    await expect(scoreElements2.nth(0)).toHaveText('0', { timeout: 5000 });
    await expect(scoreElements2.nth(1)).toHaveText('0', { timeout: 5000 });

    console.log('Both pages showing initial score: 0-0');

    // STEP 4: Click Team A score button on page1
    await page1.getByTestId('score-team-a').click();

    // STEP 5: Wait 3 seconds
    await page1.waitForTimeout(3000);

    // Check if page1 itself updated (verify the click worked)
    const teamAScoreOnPage1 = await scoreElements1.nth(0).textContent();
    console.log('Team A score on page1 after 3 seconds:', teamAScoreOnPage1);

    // STEP 6: Check if score updated on page2
    const teamAScoreOnPage2 = await scoreElements2.nth(0).textContent();
    console.log('Team A score on page2 after 3 seconds:', teamAScoreOnPage2);

    // Assert that page1 shows "15" for Team A (verify click worked)
    await expect(scoreElements1.nth(0)).toHaveText('15', { timeout: 2000 });
    console.log('✓ Page1 updated successfully to 15');

    // Report captured console logs BEFORE the assertion that might fail
    if (consoleLogsPage1.length > 0) {
      console.log('\n--- Console logs from Page 1 (containing "Realtime", "Vamos", or "supabase") ---');
      consoleLogsPage1.forEach((log, index) => {
        console.log(`[${index + 1}] [${log.type}] ${log.text}`);
      });
      console.log('--- End of Page 1 console logs ---\n');
    } else {
      console.log('\nNo relevant console logs captured on Page 1.');
    }

    if (consoleLogsPage2.length > 0) {
      console.log('\n--- Console logs from Page 2 (containing "Realtime", "Vamos", or "supabase") ---');
      consoleLogsPage2.forEach((log, index) => {
        console.log(`[${index + 1}] [${log.type}] ${log.text}`);
      });
      console.log('--- End of Page 2 console logs ---\n');
    } else {
      console.log('\nNo relevant console logs captured on Page 2.');
    }

    // Assert that page2 shows "15" for Team A
    await expect(scoreElements2.nth(0)).toHaveText('15', { timeout: 2000 });

    console.log('SUCCESS: Page2 updated to show Team A with 15 points');

    // Cleanup
    await page1.close();
    await page2.close();
  });
});
