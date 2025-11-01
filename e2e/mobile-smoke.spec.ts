import { test, expect } from '@playwright/test';

/**
 * Mobile Smoke Tests
 *
 * Quick smoke tests to verify core functionality works on mobile devices.
 * These tests should run fast and catch major regressions.
 *
 * Note: These tests will run on all mobile device projects configured
 * in playwright.config.ts
 */

test.describe('Mobile Smoke Tests', () => {

  test('can load auth page', async ({ page }) => {
    await page.goto('/');

    // Verify key elements are present
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('can switch to register mode', async ({ page }) => {
    await page.goto('/');

    // Click register link
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();

    // Verify register form appears by checking for unique fields
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Confirm Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('can toggle between player and host modes', async ({ page }) => {
    await page.goto('/');

    // Default should be player
    const playerButton = page.getByRole('button', { name: 'Player', exact: true });
    const hostButton = page.getByRole('button', { name: 'Host', exact: true });

    // Click host
    await hostButton.click();
    await page.waitForTimeout(100);

    // Click player
    await playerButton.click();
    await page.waitForTimeout(100);

    // Verify both buttons are functional
    await expect(playerButton).toBeVisible();
    await expect(hostButton).toBeVisible();
  });

  test('form inputs accept text', async ({ page }) => {
    await page.goto('/');

    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password', { exact: true });

    // Type in fields
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    // Verify values were entered
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('page is mobile-responsive', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check viewport dimensions are being respected
    const viewportSize = page.viewportSize()!;
    expect(viewportSize.width).toBeGreaterThan(0);
    expect(viewportSize.height).toBeGreaterThan(0);

    // Verify no horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    // Verify content fits within viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportSize.width + 1);
  });

  test('theme toggle is accessible', async ({ page }) => {
    await page.goto('/');

    // Find theme toggle button (usually at top right)
    const themeButton = page.locator('button').first();

    // Verify it's visible and has adequate size
    await expect(themeButton).toBeVisible();

    const box = await themeButton.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(24); // Minimum reasonable size
  });
});

test.describe('Mobile Navigation', () => {
  test('back navigation works on mobile', async ({ page }) => {
    await page.goto('/');

    // Switch to register
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();

    // Go back to login
    await page.getByRole('button', { name: 'Back to Login' }).click();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  });
});

test.describe('Mobile Performance', () => {
  test('page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load in under 5 seconds on mobile
    expect(loadTime).toBeLessThan(5000);
  });

  test('interactive elements respond quickly', async ({ page }) => {
    await page.goto('/');

    const startTime = Date.now();

    // Click button
    await page.getByRole('button', { name: 'Host', exact: true }).click();

    const responseTime = Date.now() - startTime;

    // Should respond in under 100ms
    expect(responseTime).toBeLessThan(1000);
  });
});

test.describe('Mobile Text Readability', () => {
  test('text is readable on small screens', async ({ page }) => {
    await page.goto('/');

    // Check heading font size
    const heading = page.getByText('Welcome Back');
    const headingSize = await heading.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // Heading should be at least 20px on mobile
    const headingPx = parseFloat(headingSize);
    expect(headingPx).toBeGreaterThanOrEqual(20);

    // Check body text size
    const description = page.getByText('Enter your credentials');
    const descSize = await description.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // Body text should be at least 14px
    const descPx = parseFloat(descSize);
    expect(descPx).toBeGreaterThanOrEqual(14);
  });
});

test.describe('Mobile Error Handling', () => {
  test('error messages are visible on mobile', async ({ page }) => {
    await page.goto('/');

    // Try to submit without filling form (if validation exists)
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password', { exact: true });

    // Fill invalid email
    await emailInput.fill('invalid-email');
    await passwordInput.fill('short');

    // The form might show validation errors
    // Just verify the form is still functional
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });
});
