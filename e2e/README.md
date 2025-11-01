# E2E Mobile Testing Guide

This directory contains end-to-end tests specifically designed for mobile device testing, including keyboard overlay detection and visual regression testing.

## Quick Start

```bash
# Run all tests on all configured mobile devices
npm run test:e2e

# Run only on specific devices (iPhone 13 and Pixel 5)
npm run test:e2e:mobile

# Run specific test suites
npm run test:e2e:keyboard   # Mobile keyboard overlay tests
npm run test:e2e:visual     # Visual regression tests
npm run test:e2e:smoke      # Quick smoke tests

# Run tests with UI (great for debugging)
npm run test:e2e:ui

# Run tests in headed mode (see the browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug
```

## Configured Mobile Devices

Tests run on the following device configurations:

**iPhone:**
- iPhone SE (375x667) - Smallest iOS screen, good for minimum size testing
- iPhone 13 (390x844) - Standard modern iPhone
- iPhone 13 Pro Max (428x926) - Large iPhone screen

**Android:**
- Pixel 5 (393x851) - Google reference device
- Galaxy S9+ (360x740) - Samsung device

**Tablet:**
- iPad Pro (1024x1366) - Larger mobile screen testing

## Test Files

### `mobile-keyboard.spec.ts`
Tests for mobile keyboard overlay issues:
- Verifies input fields remain visible when keyboard appears
- Checks submit buttons are accessible with keyboard open
- Tests touch target sizes (minimum 44px height)
- Validates scroll-to-input behavior

### `mobile-visual.spec.ts`
Visual regression tests:
- Captures screenshots across all devices
- Tests dark mode appearance
- Validates responsive breakpoints
- Checks for content overflow
- Tests landscape orientation

### `mobile-smoke.spec.ts`
Quick smoke tests:
- Verifies core functionality on mobile
- Tests page responsiveness
- Validates text readability
- Checks performance metrics

## Common Use Cases

### Before Pushing Code
```bash
npm run test:e2e:smoke
```
Quick check that nothing major is broken on mobile.

### After UI Changes
```bash
npm run test:e2e:visual
```
Capture visual regressions across devices.

### Testing Forms
```bash
npm run test:e2e:keyboard
```
Ensure keyboard doesn't hide input fields.

### Debugging a Specific Test
```bash
npm run test:e2e:debug -- --grep "keyboard overlay"
```

## Viewing Test Results

After tests run, an HTML report is generated:
```bash
npx playwright show-report
```

Screenshots and traces are saved in `test-results/` directory.

## Tips

1. **Visual Tests**: First run generates baseline screenshots. Subsequent runs compare against baselines.

2. **Device Selection**: Edit `playwright.config.ts` to add/remove device configurations.

3. **Network Throttling**: Tests can be configured to simulate slow networks. See `playwright.config.ts`.

4. **CI Integration**: Tests automatically use CI-optimized settings (retry on failure, sequential execution).

## Troubleshooting

**Tests timing out?**
- Check that `./dev.sh` starts successfully
- Increase timeout in `playwright.config.ts` webServer section

**Visual diffs failing?**
- Review screenshots in HTML report
- Update baselines: `npm run test:e2e:visual -- --update-snapshots`

**Flaky keyboard tests?**
- Keyboard animations can cause timing issues
- Tests include 300ms waits for keyboard to settle
- Consider increasing wait times if needed

## Mobile-Specific Considerations

- Tests use actual mobile viewports and user agents
- Touch events are simulated (not mouse events)
- Device pixel ratios are correctly configured
- Mobile-specific CSS is tested (@media queries)

## Next Steps

- Add tests for your specific mobile workflows
- Configure additional device types as needed
- Set up CI/CD pipeline integration
- Add network throttling tests for slow connections
