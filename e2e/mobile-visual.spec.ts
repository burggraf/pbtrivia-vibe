import { test, expect, devices } from '@playwright/test';

/**
 * Mobile Visual Regression Tests
 *
 * These tests capture screenshots across different mobile devices to ensure
 * consistent visual appearance and catch layout issues.
 */

test.describe('Mobile Visual - Auth Page', () => {
  const mobileDevices = [
    { name: 'iphone-se', device: devices['iPhone SE'], width: 375 },
    { name: 'iphone-13', device: devices['iPhone 13'], width: 390 },
    { name: 'iphone-13-pro-max', device: devices['iPhone 13 Pro Max'], width: 428 },
    { name: 'pixel-5', device: devices['Pixel 5'], width: 393 },
    { name: 'galaxy-s9-plus', device: devices['Galaxy S9+'], width: 360 },
  ];

  for (const { name, device } of mobileDevices) {
    test(`${name}: login page renders correctly`, async ({ browser }) => {
      const context = await browser.newContext(device);
      const page = await context.newPage();

      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      // Take screenshot
      await expect(page).toHaveScreenshot(`auth-login-${name}.png`, {
        fullPage: true,
        animations: 'disabled',
      });

      await context.close();
    });

    test(`${name}: register page renders correctly`, async ({ browser }) => {
      const context = await browser.newContext(device);
      const page = await context.newPage();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Switch to register mode
      await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();

      // Wait for animation
      await page.waitForTimeout(200);

      // Take screenshot
      await expect(page).toHaveScreenshot(`auth-register-${name}.png`, {
        fullPage: true,
        animations: 'disabled',
      });

      await context.close();
    });
  }
});

test.describe('Mobile Visual - Dark Mode', () => {
  test('auth page in dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle to dark mode
    // Find the theme toggle button by looking for common theme toggle patterns
    page.locator('button').filter({ hasText: /theme/i }).or(
      page.locator('button[aria-label*="theme"]')
    ).or(
      page.locator('button svg').locator('..').first()
    );

    // Try to find and click theme toggle
    const toggleButton = page.locator('button').first(); // ThemeToggle is usually at top
    await toggleButton.click();

    await page.waitForTimeout(200);

    // Capture dark mode
    await expect(page).toHaveScreenshot('auth-login-dark-mode.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Mobile Visual - Responsive Layout', () => {
  test('layout adapts correctly at mobile breakpoints', async ({ browser }) => {
    const breakpoints = [
      { name: 'mobile-xs', width: 320, height: 568 },
      { name: 'mobile-sm', width: 375, height: 667 },
      { name: 'mobile-md', width: 390, height: 844 },
      { name: 'mobile-lg', width: 428, height: 926 },
    ];

    for (const { name, width, height } of breakpoints) {
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      });

      const page = await context.newPage();
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify no horizontal scrolling
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance

      // Take screenshot
      await expect(page).toHaveScreenshot(`auth-responsive-${name}.png`, {
        fullPage: true,
        animations: 'disabled',
      });

      await context.close();
    }
  });
});

test.describe('Mobile Visual - Content Overflow', () => {
  test('content does not overflow container on small screens', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalOverflow).toBe(false);

    // Check all text content is visible (not cut off)
    const elements = await page.locator('body *:visible').all();

    for (const element of elements.slice(0, 20)) { // Check first 20 elements
      const box = await element.boundingBox();
      if (box) {
        const viewportWidth = page.viewportSize()!.width;
        expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth + 1);
      }
    }
  });

  test('long email addresses don\'t break layout', async ({ page }) => {
    await page.goto('/');

    // Try entering a very long email
    const longEmail = 'verylongemailaddress.with.many.dots@subdomain.example.com';
    await page.getByLabel('Email').fill(longEmail);

    // Check input doesn't overflow
    const emailInput = page.getByLabel('Email');
    const box = await emailInput.boundingBox();
    const viewportWidth = page.viewportSize()!.width;

    expect(box).toBeTruthy();
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewportWidth);
  });
});

test.describe('Mobile Visual - Interactive States', () => {
  test('button states are visible on mobile', async ({ page }) => {
    await page.goto('/');

    const submitButton = page.getByRole('button', { name: 'Sign In' });

    // Normal state
    await expect(page).toHaveScreenshot('button-state-normal.png', {
      clip: await submitButton.boundingBox() || undefined,
      animations: 'disabled',
    });

    // Hover/active state (simulate touch)
    await submitButton.hover();
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot('button-state-hover.png', {
      clip: await submitButton.boundingBox() || undefined,
      animations: 'disabled',
    });
  });

  test('form validation errors are visible', async ({ page }) => {
    await page.goto('/');

    // Trigger validation by submitting empty form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for validation
    await page.waitForTimeout(200);

    // Capture error state
    await expect(page).toHaveScreenshot('form-validation-errors.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Mobile Visual - Landscape Orientation', () => {
  test('auth page in landscape mode', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
      viewport: { width: 844, height: 390 }, // Landscape dimensions
    });

    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure content is accessible in landscape
    const submitButton = page.getByRole('button', { name: 'Sign In' });
    await expect(submitButton).toBeVisible();

    // Take screenshot
    await expect(page).toHaveScreenshot('auth-landscape-iphone-13.png', {
      fullPage: true,
      animations: 'disabled',
    });

    await context.close();
  });
});
