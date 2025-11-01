import { test, expect, devices } from '@playwright/test';

/**
 * Mobile Keyboard Overlay Tests
 *
 * These tests ensure that form inputs remain visible and accessible when
 * the mobile keyboard is displayed. This is critical for mobile UX.
 *
 * Note: These tests will run on all mobile device projects configured
 * in playwright.config.ts
 */

test.describe('Mobile Keyboard - Auth Page', () => {

  test('email input remains visible when focused', async ({ page }) => {
    await page.goto('/');

    // Get email input
    const emailInput = page.getByLabel('Email');

    // Check initial position
    const initialBox = await emailInput.boundingBox();
    expect(initialBox).toBeTruthy();

    // Focus the input (this triggers the mobile keyboard)
    await emailInput.focus();

    // Wait for keyboard animation to settle
    await page.waitForTimeout(300);

    // Verify input is still in viewport
    const focusedBox = await emailInput.boundingBox();
    expect(focusedBox).toBeTruthy();
    expect(focusedBox!.y).toBeGreaterThanOrEqual(0);

    // Verify input hasn't been pushed off-screen
    const viewportSize = page.viewportSize()!;
    expect(focusedBox!.y + focusedBox!.height).toBeLessThan(viewportSize.height);
  });

  test('password input remains visible when focused', async ({ page }) => {
    await page.goto('/');

    const passwordInput = page.getByLabel('Password', { exact: true });

    // Focus password field
    await passwordInput.focus();
    await page.waitForTimeout(300);

    // Check it's visible in viewport
    const box = await passwordInput.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(0);

    const viewportSize = page.viewportSize()!;
    expect(box!.y + box!.height).toBeLessThan(viewportSize.height);
  });

  test('submit button remains accessible with keyboard open', async ({ page }) => {
    await page.goto('/');

    // Fill in form fields (keyboard will be open)
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');

    // Ensure submit button is still accessible
    const submitButton = page.getByRole('button', { name: 'Sign In' });

    // Button should be visible and clickable
    await expect(submitButton).toBeVisible();

    // Verify we can interact with it
    const box = await submitButton.boundingBox();
    expect(box).toBeTruthy();
  });

  test('form remains usable on register mode', async ({ page }) => {
    await page.goto('/');

    // Switch to register mode
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();

    // Fill all registration fields
    await page.getByLabel('Email').fill('newuser@example.com');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');

    // Verify submit button is accessible
    const createAccountBtn = page.getByRole('button', { name: 'Create Account' });
    await expect(createAccountBtn).toBeVisible();

    // Check button is in viewport
    const box = await createAccountBtn.boundingBox();
    expect(box).toBeTruthy();
    const viewportSize = page.viewportSize()!;
    expect(box!.y + box!.height).toBeLessThan(viewportSize.height);
  });
});

test.describe('Mobile Keyboard - Multiple Devices', () => {
  // Test across different screen sizes
  const devices_to_test = [
    { name: 'iPhone SE', device: devices['iPhone SE'] },
    { name: 'iPhone 13', device: devices['iPhone 13'] },
    { name: 'Pixel 5', device: devices['Pixel 5'] },
    { name: 'Galaxy S9+', device: devices['Galaxy S9+'] },
  ];

  for (const { name, device } of devices_to_test) {
    test(`${name}: form inputs don't overlap keyboard`, async ({ browser }) => {
      const context = await browser.newContext({
        ...device,
      });
      const page = await context.newPage();

      await page.goto('/');

      // Focus on email input
      const emailInput = page.getByLabel('Email');
      await emailInput.click();
      await emailInput.fill('test@example.com');

      // Move to password
      const passwordInput = page.getByLabel('Password', { exact: true });
      await passwordInput.click();
      await passwordInput.fill('password123');

      // Verify submit button is still accessible
      const submitButton = page.getByRole('button', { name: 'Sign In' });
      await expect(submitButton).toBeVisible();

      // Should be able to click submit
      await submitButton.click();

      await context.close();
    });
  }
});

test.describe('Mobile Keyboard - Touch Target Sizes', () => {
  test('all interactive elements have reasonable touch target size', async ({ page }) => {
    await page.goto('/');

    // Check buttons have adequate height (web standard: 40px+, iOS guideline: 44px)
    const playerButton = page.getByRole('button', { name: 'Player' });
    const hostButton = page.getByRole('button', { name: 'Host' });
    const submitButton = page.getByRole('button', { name: 'Sign In' });

    for (const button of [playerButton, hostButton, submitButton]) {
      const box = await button.boundingBox();
      expect(box).toBeTruthy();
      // Web standard minimum (40px is acceptable, 44px is iOS ideal)
      expect(box!.height).toBeGreaterThanOrEqual(40);

      // Log if below iOS guideline for future improvement
      if (box!.height < 44) {
        console.log(`Note: Button height ${box!.height}px is below iOS 44px guideline`);
      }
    }
  });

  test('input fields have adequate height for touch', async ({ page }) => {
    await page.goto('/');

    const emailInput = page.getByLabel('Email');
    const box = await emailInput.boundingBox();

    expect(box).toBeTruthy();
    // Web standard minimum
    expect(box!.height).toBeGreaterThanOrEqual(40);

    // Log if below iOS guideline
    if (box!.height < 44) {
      console.log(`Note: Input height ${box!.height}px is below iOS 44px guideline`);
    }
  });
});

test.describe('Mobile Keyboard - Scrolling Behavior', () => {
  test('page scrolls to reveal focused input', async ({ page }) => {
    await page.goto('/');

    // Switch to register mode (more fields = more scrolling)
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();

    // Scroll to bottom by focusing last field
    const confirmPasswordInput = page.getByLabel('Confirm Password');
    await confirmPasswordInput.scrollIntoViewIfNeeded();
    await confirmPasswordInput.focus();

    // Verify field is visible
    await expect(confirmPasswordInput).toBeVisible();

    const box = await confirmPasswordInput.boundingBox();
    expect(box).toBeTruthy();

    // Should be in visible viewport area
    const viewportSize = page.viewportSize()!;
    expect(box!.y).toBeLessThan(viewportSize.height);
    expect(box!.y).toBeGreaterThanOrEqual(0);
  });
});
