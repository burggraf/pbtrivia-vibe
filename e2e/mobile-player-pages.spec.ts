import { test, expect } from '@playwright/test';

/**
 * Mobile Player Pages Tests
 *
 * Tests for player-facing pages on mobile devices:
 * - /lobby - Player lobby with game joining
 * - /game/:id - Gameplay page with questions and answers
 *
 * NOTE: These tests require authentication and will be skipped until
 * test credentials are configured. To enable:
 * 1. Create test user accounts in PocketBase
 * 2. Use Playwright's storage state to save authentication
 * 3. Remove .skip() from tests
 */

/**
 * Helper to authenticate a test user
 * Using actual test credentials: player1@test.com / TestPass123!
 */
async function loginTestUser(page: any, email = 'player1@test.com', password = 'TestPass123!') {
  await page.goto('/');
  await page.getByRole('button', { name: 'Player', exact: true }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/lobby/, { timeout: 10000 });
}

test.describe('Mobile Lobby Page', () => {

  test('lobby page loads and displays correctly on mobile', async ({ page }) => {
    await loginTestUser(page);

    // Verify page elements are visible
    await expect(page.getByRole('heading', { name: 'Lobby' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    // Verify join game section (CardTitle is not a semantic heading)
    await expect(page.getByText('Join a Game')).toBeVisible();
    await expect(page.getByPlaceholder('ABC123')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join Game' })).toBeVisible();
  });

  test('lobby page has no horizontal scroll on mobile', async ({ page }) => {
    await loginTestUser(page);

    // Verify no horizontal scrolling
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('game code input is touch-friendly on mobile', async ({ page }) => {
    await loginTestUser(page);

    const gameCodeInput = page.getByPlaceholder('ABC123');

    // Verify input is visible and accessible
    await expect(gameCodeInput).toBeVisible();

    // Check input size (should be large enough for touch)
    const box = await gameCodeInput.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(44); // iOS guideline

    // Verify input is centered and easy to see
    const viewportSize = page.viewportSize()!;
    expect(box!.x).toBeGreaterThan(0);
    expect(box!.x + box!.width).toBeLessThan(viewportSize.width);
  });

  test('join game button is large enough for touch on mobile', async ({ page }) => {
    await loginTestUser(page);

    const joinButton = page.getByRole('button', { name: 'Join Game' });

    // Verify button is visible
    await expect(joinButton).toBeVisible();

    // Check button size
    const box = await joinButton.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(44); // iOS guideline for touch targets
  });

  test('game code input works with mobile keyboard', async ({ page }) => {
    await loginTestUser(page);

    const gameCodeInput = page.getByPlaceholder('ABC123');

    // Focus input (triggers keyboard)
    await gameCodeInput.focus();
    await page.waitForTimeout(300); // Wait for keyboard animation

    // Verify input is still visible with keyboard open
    const box = await gameCodeInput.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(0);

    const viewportSize = page.viewportSize()!;
    expect(box!.y + box!.height).toBeLessThan(viewportSize.height);

    // Type a game code
    await gameCodeInput.fill('ABC123');

    // Verify join button is still accessible with keyboard open
    const joinButton = page.getByRole('button', { name: 'Join Game' });
    await expect(joinButton).toBeVisible();
  });

  test('join button is disabled when input is empty (good UX)', async ({ page }) => {
    await loginTestUser(page);

    // Verify join button is disabled when there's no game code
    const joinButton = page.getByRole('button', { name: 'Join Game' });
    await expect(joinButton).toBeDisabled();

    // Enter a game code
    const gameCodeInput = page.getByPlaceholder('ABC123');
    await gameCodeInput.fill('TEST01');

    // Button should now be enabled
    await expect(joinButton).toBeEnabled();
  });

  test('navigation buttons are accessible on mobile', async ({ page }) => {
    await loginTestUser(page);

    // Verify all navigation buttons are accessible
    const logoutButton = page.getByRole('button', { name: 'Logout' });

    await expect(logoutButton).toBeVisible();

    // Check button sizes
    const logoutBox = await logoutButton.boundingBox();
    expect(logoutBox).toBeTruthy();

    // FIXED: Logout button is now 44px (meets both web standard and iOS guideline)
    // Changed from size="sm" (36px) to size="default" with min-h-11 (44px)
    expect(logoutBox!.height).toBeGreaterThanOrEqual(44); // iOS guideline

    console.log(`✅ Logout button height ${logoutBox!.height}px meets both web standard (40px) and iOS guideline (44px)`);
  });

  test('theme toggle works on mobile', async ({ page }) => {
    await loginTestUser(page);

    // Find theme toggle button
    const themeToggle = page.locator('[aria-label*="theme" i], button:has-text("Theme"), button:has-text("Dark"), button:has-text("Light")').first();

    if (await themeToggle.isVisible()) {
      // Click theme toggle
      await themeToggle.click();

      // Wait for theme change animation
      await page.waitForTimeout(300);

      // Page should still be functional
      await expect(page.getByRole('heading', { name: 'Lobby' })).toBeVisible();
    }
  });
});

test.describe('Mobile Game Page', () => {

  test.skip('game page loads correctly on mobile', async ({ page }) => {
    // This test would require:
    // 1. Login as a player
    // 2. Join a game
    // 3. Navigate to game page
    // For now, we'll just test direct navigation with auth

    await loginTestUser(page);

    // Try to navigate to a game page (will need valid game ID)
    // This is a placeholder - actual implementation would need a real game
  });

  test.skip('game page has no horizontal scroll on mobile', async ({ page }) => {
    await loginTestUser(page);

    // Would navigate to actual game page
    // Then verify no horizontal scrolling
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test.skip('question text is readable on mobile', async ({ page }) => {
    // This test would verify:
    // - Question text has adequate font size (14px minimum)
    // - Text wraps properly on small screens
    // - No text overflow
    // Requires active game with question
  });

  test.skip('answer buttons are large enough for touch', async ({ page }) => {
    // This test would verify:
    // - Each answer button is at least 44px height
    // - Buttons have adequate spacing between them
    // - Buttons are full-width on mobile for easy tapping
    // Requires active game with question
  });

  test.skip('answer button states are visible on mobile', async ({ page }) => {
    // This test would verify:
    // - Unselected state is clear
    // - Selected state is clearly indicated
    // - Disabled state (after answering) is obvious
    // - Correct/incorrect states are clearly shown
    // Requires active game with question
  });

  test.skip('scoreboard is readable on mobile', async ({ page }) => {
    // This test would verify:
    // - Team names are readable
    // - Scores are clearly displayed
    // - Scoreboard fits within viewport
    // - No horizontal scrolling in scoreboard
    // Requires active game
  });

  test.skip('navigation buttons work on mobile game page', async ({ page }) => {
    // This test would verify:
    // - "← Lobby" button is visible and accessible
    // - Logout button is visible and accessible
    // - Theme toggle works
    // - All buttons have adequate touch target size
    // Requires active game
  });

  test.skip('game page layout adapts to small screens', async ({ page }) => {
    // This test would verify:
    // - Header elements stack properly on mobile
    // - Question card is properly sized
    // - Answer buttons stack vertically
    // - Scoreboard adapts to narrow screens
    // Requires active game
  });

  test.skip('answer submission works on mobile', async ({ page }) => {
    // This test would verify:
    // - Can tap answer button
    // - Button shows loading state
    // - Answer is submitted successfully
    // - UI updates to show answer was recorded
    // Requires active game with question
  });

  test.skip('game transitions work smoothly on mobile', async ({ page }) => {
    // This test would verify:
    // - Transition from lobby to question works
    // - Transition between questions works
    // - Transition to answer reveal works
    // - Transition to scoreboard works
    // - Transition to game end works
    // Requires active game with host control
  });
});

test.describe('Mobile Team Selection Modal', () => {

  test.skip('team selection modal is usable on mobile', async ({ page }) => {
    // This test would verify:
    // - Modal appears when joining game
    // - Modal fits within mobile viewport
    // - Team list is scrollable if many teams
    // - Buttons are large enough for touch
    // Requires joining an active game
  });

  test.skip('can select existing team on mobile', async ({ page }) => {
    // This test would verify:
    // - Can tap team from list
    // - Selection is visually clear
    // - Confirm button works
    // Requires joining an active game with existing teams
  });

  test.skip('can create new team on mobile', async ({ page }) => {
    // This test would verify:
    // - "Create New Team" option is accessible
    // - Team name input works with mobile keyboard
    // - Input doesn't get hidden by keyboard
    // - Can submit new team name
    // Requires joining an active game
  });

  test.skip('team modal can be dismissed on mobile', async ({ page }) => {
    // This test would verify:
    // - Can close modal with close button
    // - Close button is easily tappable
    // - Backdrop tap closes modal (if implemented)
    // Requires joining an active game
  });
});

/**
 * SETUP NOTES:
 *
 * To enable these tests, you need to:
 *
 * 1. Create test user accounts in PocketBase:
 *    - player1@test.com / TestPass123!
 *    - player2@test.com / TestPass123!
 *
 * 2. Create test game(s) with known codes:
 *    - Use PocketBase admin panel or API
 *    - Create game with code "TEST01"
 *    - Set game status to "ready"
 *
 * 3. Use Playwright's storage state for authentication:
 *    - Run a setup script to login and save auth state
 *    - Reuse saved auth state in tests for faster execution
 *
 * 4. Consider using API helpers:
 *    - Create helper functions to set up game state
 *    - Create games, teams, questions programmatically
 *    - Reset state between tests
 *
 * Example setup script:
 * ```typescript
 * // e2e/auth.setup.ts
 * import { test as setup } from '@playwright/test';
 *
 * setup('authenticate as player', async ({ page }) => {
 *   await page.goto('/');
 *   await page.getByRole('button', { name: 'Player' }).click();
 *   await page.getByLabel('Email').fill('player1@test.com');
 *   await page.getByLabel('Password').fill('TestPass123!');
 *   await page.getByRole('button', { name: 'Sign In' }).click();
 *   await page.waitForURL(/\/lobby/);
 *   await page.context().storageState({ path: 'e2e/.auth/player.json' });
 * });
 * ```
 *
 * Then in playwright.config.ts:
 * ```typescript
 * projects: [
 *   { name: 'setup', testMatch: /.*\.setup\.ts/ },
 *   {
 *     name: 'iphone-13',
 *     use: {
 *       ...devices['iPhone 13'],
 *       storageState: 'e2e/.auth/player.json'
 *     },
 *     dependencies: ['setup']
 *   }
 * ]
 * ```
 */
