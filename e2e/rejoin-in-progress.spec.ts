import { test, expect } from '@playwright/test';

/**
 * Rejoin In-Progress Games Tests
 *
 * Tests for allowing registered players to rejoin games that are already in-progress
 * while blocking unregistered players from joining.
 */

test.describe('Rejoin In-Progress Games', () => {
  test('registered player can rejoin in-progress game', async ({ page, context }) => {
    // Setup: Create host and start game
    const hostPage = await context.newPage();
    await hostPage.goto('/');

    // Host login
    await hostPage.fill('input[type="email"]', 'host@example.com');
    await hostPage.fill('input[type="password"]', 'password123');
    await hostPage.click('button:has-text("Sign In")');
    await hostPage.waitForURL('**/host');

    // Create and start game
    await hostPage.click('button:has-text("New Game")');
    await hostPage.fill('input[placeholder*="Game Name"]', 'Test Rejoin Game');
    await hostPage.click('button:has-text("Create")');

    // Get game code
    const gameCodeElement = await hostPage.locator('[data-testid="game-code"]');
    const gameCode = await gameCodeElement.textContent();

    // Mark game as ready
    await hostPage.click('button:has-text("Ready")');

    // Player joins game
    await page.goto('/');
    await page.fill('input[type="email"]', 'player@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/lobby');

    await page.fill('input[placeholder*="ABC123"]', gameCode!);
    await page.click('button:has-text("Join Game")');

    // Select team
    await page.click('button:has-text("Team A")');
    await page.waitForURL(`**/game/${gameCode}`);

    // Host starts game (changes status to "in-progress")
    await hostPage.click('button:has-text("Start Game")');

    // Player disconnects (simulated by going back to lobby)
    await page.goto('/lobby');

    // Player tries to rejoin - should succeed
    await page.fill('input[placeholder*="ABC123"]', gameCode!);
    await page.click('button:has-text("Join Game")');

    // Should navigate directly to game page
    await expect(page).toHaveURL(`**/game/${gameCode}`);
    await expect(page.locator('h1')).toContainText('Test Rejoin Game');
  });

  test('unregistered player cannot join in-progress game', async ({ page, context }) => {
    // Setup: Create host and start game
    const hostPage = await context.newPage();
    await hostPage.goto('/');

    await hostPage.fill('input[type="email"]', 'host@example.com');
    await hostPage.fill('input[type="password"]', 'password123');
    await hostPage.click('button:has-text("Sign In")');
    await hostPage.waitForURL('**/host');

    await hostPage.click('button:has-text("New Game")');
    await hostPage.fill('input[placeholder*="Game Name"]', 'Test Block Game');
    await hostPage.click('button:has-text("Create")');

    const gameCodeElement = await hostPage.locator('[data-testid="game-code"]');
    const gameCode = await gameCodeElement.textContent();

    await hostPage.click('button:has-text("Ready")');
    await hostPage.click('button:has-text("Start Game")');

    // New player tries to join in-progress game
    await page.goto('/');
    await page.fill('input[type="email"]', 'newplayer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/lobby');

    await page.fill('input[placeholder*="ABC123"]', gameCode!);
    await page.click('button:has-text("Join Game")');

    // Should see error message
    await expect(page.locator('text=This game is already in progress')).toBeVisible();
    await expect(page).toHaveURL('**/lobby');
  });
});
