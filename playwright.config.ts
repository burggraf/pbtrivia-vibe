import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers and mobile devices */
  projects: [
    // Desktop browsers for comparison
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // iPhone devices - test various screen sizes
    {
      name: 'iphone-13',
      use: {
        ...devices['iPhone 13'],
        // iPhone 13: 390x844
      },
    },
    {
      name: 'iphone-13-pro-max',
      use: {
        ...devices['iPhone 13 Pro Max'],
        // iPhone 13 Pro Max: 428x926 (larger screen)
      },
    },
    {
      name: 'iphone-se',
      use: {
        ...devices['iPhone SE'],
        // iPhone SE: 375x667 (smaller screen - good for minimum size testing)
      },
    },

    // Android devices - test different manufacturers
    {
      name: 'pixel-5',
      use: {
        ...devices['Pixel 5'],
        // Pixel 5: 393x851
      },
    },
    {
      name: 'galaxy-s9-plus',
      use: {
        ...devices['Galaxy S9+'],
        // Galaxy S9+: 360x740
      },
    },

    // Tablet for larger mobile screens
    {
      name: 'ipad-pro',
      use: {
        ...devices['iPad Pro'],
        // iPad Pro: 1024x1366
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: './dev.sh',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for PocketBase + Vite to start
  },
});
