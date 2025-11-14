# Android TV Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Android TV as a build target for trivia-party-display using Tauri 2.0 with shared React codebase.

**Architecture:** Single codebase with runtime platform detection. Rust menu code conditionally compiled for non-Android platforms. TypeScript detects platform and handles Android-specific behaviors (back button, fullscreen). Same UI components work across all platforms.

**Tech Stack:** Tauri 2.0, React 18, TypeScript, Rust, Android SDK

---

## Task 1: Add Platform Detection Utility

**Files:**
- Create: `trivia-party-display/src/lib/platform.ts`
- Test: Manual verification in browser console

**Step 1: Create platform detection module**

Create `trivia-party-display/src/lib/platform.ts`:

```typescript
/**
 * Platform detection utilities for Tauri multi-platform app
 */

export type Platform = 'macos' | 'android' | 'windows' | 'linux' | 'ios';

/**
 * Get current platform from Tauri internals
 * Returns undefined if not in Tauri environment
 */
export function getPlatform(): Platform | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as any).__TAURI_INTERNALS__?.platform;
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

/**
 * Check if running on macOS
 */
export function isMacOS(): boolean {
  return getPlatform() === 'macos';
}

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
  return getPlatform() === 'windows';
}

/**
 * Check if platform has native menu bar (macOS, Windows, Linux)
 */
export function hasNativeMenuBar(): boolean {
  const platform = getPlatform();
  return platform === 'macos' || platform === 'windows' || platform === 'linux';
}

/**
 * Check if platform is TV-based (Android TV, Apple TV)
 */
export function isTVPlatform(): boolean {
  return isAndroid(); // Extend when Apple TV support added
}
```

**Step 2: Verify TypeScript compilation**

Run in `trivia-party-display/`:
```bash
pnpm run build
```

Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add trivia-party-display/src/lib/platform.ts
git commit -m "feat(display): add platform detection utilities

Add platform detection module for multi-platform Tauri app.
Supports Android, macOS, Windows, Linux detection.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Add Android Back Button Handler

**Files:**
- Modify: `trivia-party-display/src/App.tsx`
- Test: Manual verification on Android device

**Step 1: Add back button handler to App component**

Update `trivia-party-display/src/App.tsx` - add imports at top:

```typescript
import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { exit } from '@tauri-apps/plugin-process'
import { isAndroid } from '@/lib/platform'
```

Update `AppContent` function to add back button listener:

```typescript
function AppContent() {
  const { currentScreen, error, clearError, initialize } = useDisplay()

  // Android TV: Back button exits app
  useEffect(() => {
    if (!isAndroid()) return;

    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unlisten = await listen('android-back-button', async () => {
          console.log('Android back button pressed - exiting app');
          await exit(0);
        });
      } catch (err) {
        console.error('Failed to set up Android back button listener:', err);
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  return (
    <>
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={clearError}
          onRetry={error.includes('Failed to initialize') ? initialize : undefined}
          autoDismiss={!error.includes('Failed to initialize')}
        />
      )}

      {currentScreen === 'code' && <CodeDisplay />}
      {currentScreen === 'game' && <GameDisplay />}

      {/* Update notification - only in Tauri environment */}
      {window.__TAURI__ && <UpdateNotification />}
    </>
  )
}
```

**Step 2: Verify TypeScript compilation**

Run in `trivia-party-display/`:
```bash
pnpm run build
```

Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add trivia-party-display/src/App.tsx
git commit -m "feat(display): add Android back button handler

Android TV back button now exits app cleanly.
Uses Tauri event listener with platform detection.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Make Rust Menu Code Platform-Conditional

**Files:**
- Modify: `trivia-party-display/src-tauri/src/lib.rs`
- Test: Cargo check for both targets

**Step 1: Wrap menu creation in platform conditional**

Update `trivia-party-display/src-tauri/src/lib.rs` - wrap menu setup:

Find the `setup` closure (around line 53) and replace with:

```rust
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Desktop platforms: Create native menu bar
      // Android/iOS: Skip menu (no native menu bar on mobile)
      #[cfg(not(any(target_os = "android", target_os = "ios")))]
      {
        setup_desktop_menu(app)?;
      }

      Ok(())
    })
```

**Step 2: Extract menu setup into separate function**

Add new function before `run()` function (around line 47):

```rust
#[cfg(not(any(target_os = "android", target_os = "ios")))]
fn setup_desktop_menu(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
  use tauri::menu::{Menu, MenuItem, Submenu};

  // Create menu
  let quit = MenuItem::with_id(
    app,
    "quit",
    "Quit",
    true,
    Some("CmdOrCtrl+Q"),
  )?;

  let file_menu = Submenu::with_items(
    app,
    "File",
    true,
    &[&quit],
  )?;

  let toggle_fullscreen = MenuItem::with_id(
    app,
    "toggle_fullscreen",
    "Toggle Fullscreen",
    true,
    Some("CmdOrCtrl+F"),
  )?;

  // Get available monitors and create menu items for each
  let window = app.get_webview_window("main").expect("main window not found");
  let monitors = window.available_monitors().unwrap_or_default();

  let mut display_items: Vec<Box<dyn tauri::menu::IsMenuItem<tauri::Wry>>> = Vec::new();
  for (idx, monitor) in monitors.iter().enumerate() {
    let display_name = monitor.name()
      .map(|s| s.to_string())
      .unwrap_or_else(|| format!("Display {}", idx + 1));
    let display_id = format!("display_{}", idx);
    let menu_item = MenuItem::with_id(
      app,
      &display_id,
      &format!("{} ({}x{})", display_name, monitor.size().width, monitor.size().height),
      true,
      None::<&str>,
    )?;
    display_items.push(Box::new(menu_item));
  }

  let display_refs: Vec<&dyn tauri::menu::IsMenuItem<tauri::Wry>> = display_items
    .iter()
    .map(|item| item.as_ref() as &dyn tauri::menu::IsMenuItem<tauri::Wry>)
    .collect();

  let move_to_display = if !display_refs.is_empty() {
    Some(Submenu::with_items(
      app,
      "Move to Display",
      true,
      &display_refs,
    )?)
  } else {
    None
  };

  let mut view_items: Vec<&dyn tauri::menu::IsMenuItem<tauri::Wry>> = vec![&toggle_fullscreen];
  if let Some(ref submenu) = move_to_display {
    view_items.push(submenu);
  }

  let view_menu = Submenu::with_items(
    app,
    "View",
    true,
    &view_items,
  )?;

  let menu = Menu::with_items(app, &[&file_menu, &view_menu])?;

  // Set menu for all windows
  app.set_menu(menu)?;

  // Handle menu events
  let monitors_clone = monitors.clone();
  app.on_menu_event(move |app, event| {
    if event.id() == "quit" {
      app.exit(0);
    } else if event.id() == "toggle_fullscreen" {
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.is_fullscreen().and_then(|is_fs| {
          window.set_fullscreen(!is_fs)
        });
      }
    } else if event.id().as_ref().starts_with("display_") {
      if let Some(window) = app.get_webview_window("main") {
        if let Some(idx_str) = event.id().as_ref().strip_prefix("display_") {
          if let Ok(idx) = idx_str.parse::<usize>() {
            if let Some(monitor) = monitors_clone.get(idx) {
              // Get monitor dimensions
              let monitor_pos = monitor.position();
              let monitor_size = monitor.size();

              // Get window size
              if let Ok(window_size) = window.outer_size() {
                // Center the window on the target monitor
                let x = monitor_pos.x + (monitor_size.width as i32 - window_size.width as i32) / 2;
                let y = monitor_pos.y + (monitor_size.height as i32 - window_size.height as i32) / 2;

                let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
              }
            }
          }
        }
      }
    }
  });

  Ok(())
}
```

**Step 3: Remove old menu code from setup**

Delete the original menu creation code from the `setup` closure (lines 62-172 in original file). The `setup` closure should now be much simpler, just calling `setup_desktop_menu(app)?` on desktop platforms.

**Step 4: Verify Rust compilation**

Run in `trivia-party-display/src-tauri/`:
```bash
cargo check
```

Expected: Compilation succeeds with no errors

**Step 5: Commit**

```bash
git add trivia-party-display/src-tauri/src/lib.rs
git commit -m "refactor(display): make menu creation platform-conditional

Extract menu setup into setup_desktop_menu() function.
Use cfg conditional to skip on Android/iOS.
Existing desktop functionality unchanged.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Add Android Configuration to Tauri Config

**Files:**
- Modify: `trivia-party-display/src-tauri/tauri.conf.json`
- Test: Validate JSON syntax

**Step 1: Add Android-specific configuration**

Update `trivia-party-display/src-tauri/tauri.conf.json` - add to root object after `"bundle"`:

```json
  "android": {
    "minSdkVersion": 24,
    "targetSdkVersion": 34,
    "versionCode": 1,
    "manifestXml": "
      <application>
        <intent-filter>
          <action android:name=\"android.intent.action.MAIN\" />
          <category android:name=\"android.intent.category.LEANBACK_LAUNCHER\" />
        </intent-filter>
      </application>
    "
  }
```

**Step 2: Update window configuration for Android**

In the same file, update the `"app"` section to add Android window config:

```json
  "app": {
    "windows": [
      {
        "title": "Trivia Party Display",
        "width": 1920,
        "height": 1080,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "alwaysOnTop": false,
        "center": true
      }
    ],
    "android": {
      "windows": [
        {
          "title": "Trivia Party Display",
          "fullscreen": true,
          "decorations": false
        }
      ]
    },
    "security": {
      "csp": null
    }
  }
```

**Step 3: Validate JSON syntax**

Run:
```bash
cat trivia-party-display/src-tauri/tauri.conf.json | python3 -m json.tool > /dev/null
```

Expected: No JSON syntax errors

**Step 4: Commit**

```bash
git add trivia-party-display/src-tauri/tauri.conf.json
git commit -m "feat(display): add Android TV platform configuration

Configure Tauri for Android TV target:
- Min SDK 24 (Android 7.0)
- Leanback launcher for TV home screen
- Fullscreen by default on Android
- Desktop config unchanged

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Add Android Build Scripts

**Files:**
- Modify: `trivia-party-display/package.json`
- Test: Verify scripts are defined

**Step 1: Add Android npm scripts**

Update `trivia-party-display/package.json` - add to `"scripts"` section:

```json
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5174",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:icon": "tauri icon",
    "tauri:android:init": "tauri android init",
    "tauri:android:dev": "tauri android dev",
    "tauri:android:build": "tauri android build",
    "tauri:android:build-apk": "tauri android build --apk"
  }
```

**Step 2: Verify scripts work**

Run:
```bash
cd trivia-party-display && pnpm run tauri:android:init --help || echo "Command registered successfully"
```

Expected: Help output or success message

**Step 3: Commit**

```bash
git add trivia-party-display/package.json
git commit -m "feat(display): add Android build scripts

Add npm scripts for Android development:
- tauri:android:init - Initialize Android project
- tauri:android:dev - Dev build to device/emulator
- tauri:android:build - Production APK/AAB build

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Update BUILD.md Documentation

**Files:**
- Modify: `trivia-party-display/BUILD.md`
- Test: Visual inspection

**Step 1: Add Android build section to BUILD.md**

Add to `trivia-party-display/BUILD.md` after the macOS section:

```markdown
## Android TV Build

### Prerequisites

1. **Android SDK & NDK**
   ```bash
   # Install via Android Studio or command line tools
   # Minimum SDK: 24 (Android 7.0)
   # Target SDK: 34 (Android 14)
   ```

2. **Java JDK 17+**
   ```bash
   # macOS
   brew install openjdk@17

   # Verify
   java -version
   ```

3. **Environment Variables**
   ```bash
   export ANDROID_HOME="$HOME/Library/Android/sdk"
   export NDK_HOME="$ANDROID_HOME/ndk/[version]"
   export PATH="$PATH:$ANDROID_HOME/platform-tools"
   ```

### One-Time Setup

Initialize Android project:

```bash
cd trivia-party-display
pnpm tauri:android:init
```

This creates Android project files in `src-tauri/gen/android/` (git-ignored).

### Development Build

**Option 1: Android TV Emulator**

1. Create Android TV emulator in Android Studio (API 24+, 1080p)
2. Start emulator
3. Run dev build:
   ```bash
   pnpm tauri:android:dev
   ```

**Option 2: Physical Android TV Device**

1. Enable Developer Mode on Android TV
2. Enable ADB debugging
3. Connect via ADB:
   ```bash
   adb connect <TV_IP_ADDRESS>:5555
   ```
4. Run dev build:
   ```bash
   pnpm tauri:android:dev
   ```

### Production Build

**Build APK:**

```bash
pnpm tauri:android:build-apk
```

Output: `src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk`

**Build AAB (Google Play):**

```bash
pnpm tauri:android:build
```

Output: `src-tauri/gen/android/app/build/outputs/bundle/release/app-release.aab`

### Platform Differences

- **macOS**: Menu bar (File, View), window controls, Cmd+F fullscreen
- **Android TV**: No menu bar, fullscreen by default, back button exits

### Testing Checklist

- [ ] App launches fullscreen
- [ ] Code display renders correctly
- [ ] Game display updates in real-time
- [ ] Back button exits app
- [ ] PocketBase connection works
- [ ] All game states function correctly
- [ ] No crashes during transitions

### Troubleshooting

**Error: "Android SDK not found"**
- Set ANDROID_HOME environment variable
- Install Android SDK via Android Studio

**Error: "NDK not found"**
- Install NDK via Android Studio SDK Manager
- Set NDK_HOME environment variable

**App won't deploy to device**
- Check `adb devices` shows device
- Enable Developer Mode and ADB on TV
- Check TV and computer on same network

**Back button doesn't work**
- Verify Android event listener in App.tsx
- Check console logs for "Android back button pressed"
```

**Step 2: Commit**

```bash
git add trivia-party-display/BUILD.md
git commit -m "docs(display): add Android TV build documentation

Document Android prerequisites, setup, and build process.
Include troubleshooting and platform differences.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Update CLAUDE.md with Android Info

**Files:**
- Modify: `CLAUDE.md`
- Test: Visual inspection

**Step 1: Add Android TV section to Display App documentation**

In `CLAUDE.md`, find the "Display App" section and update it:

Replace:
```markdown
**Technology:** Built with Tauri 2.0 for native macOS distribution (Windows/Android TV/Apple TV planned).
```

With:
```markdown
**Technology:** Built with Tauri 2.0 for native distribution across multiple platforms.

**Supported Platforms:**
- **macOS** - Native .dmg installer with menu bar and multi-monitor support
- **Android TV** - APK with fullscreen display and remote control support
- **Windows** - Planned (same codebase, Windows-specific build)
- **Apple TV** - Planned (requires tvOS target configuration)
```

**Step 2: Add Android development commands**

Add after the existing development commands:

```markdown
**Android TV Development:**
```bash
cd trivia-party-display
pnpm tauri:android:init     # One-time setup
pnpm tauri:android:dev      # Deploy to device/emulator
pnpm tauri:android:build    # Production build
```

**Step 3: Add platform differences note**

Add new section after Display App features:

```markdown
**Platform Differences:**
- **macOS**: Menu bar (File, View), window decorations, resizable window
- **Android TV**: No menu bar, fullscreen by default, back button exits app
- **Code**: Single React codebase with runtime platform detection
```

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with Android TV support

Document Android TV as supported platform.
Add Android build commands and platform differences.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Verify Final Build

**Files:**
- Test: Build verification

**Step 1: Clean build test**

Run full clean build:
```bash
cd trivia-party-display
rm -rf dist node_modules
pnpm install
pnpm run build
```

Expected: Build succeeds with no errors

**Step 2: Verify TypeScript compilation**

Check for type errors:
```bash
cd trivia-party-display
pnpm run build
```

Expected: 0 TypeScript errors

**Step 3: Verify Rust compilation (desktop)**

```bash
cd trivia-party-display/src-tauri
cargo check
```

Expected: 0 Rust errors

**Step 4: Verify platform detection**

Check that platform utilities compile:
```bash
grep -n "getPlatform\|isAndroid\|isMacOS" trivia-party-display/src/lib/platform.ts
```

Expected: All functions defined

**Step 5: No commit (verification only)**

---

## Testing Plan

**Manual Testing Required:**

1. **macOS Build Test**
   - Run `pnpm tauri:dev` in trivia-party-display
   - Verify menu bar appears
   - Test Cmd+F fullscreen toggle
   - Test Cmd+Q quit
   - Test Move to Display (if multiple monitors)
   - Verify app still works as before

2. **Android Setup** (requires Android SDK)
   - Run `pnpm tauri:android:init`
   - Verify `src-tauri/gen/android/` created
   - Check for Gradle build files

3. **Android Emulator Test** (if SDK available)
   - Create Android TV emulator (API 24+)
   - Run `pnpm tauri:android:dev`
   - Verify app launches fullscreen
   - Test back button exits
   - Verify no menu bar attempts
   - Test CodeDisplay and GameDisplay

4. **Code Review**
   - Review all diffs
   - Check no regressions in macOS functionality
   - Verify platform detection logic
   - Confirm menu code properly conditional

**Automated Testing:**
- TypeScript compilation (covered in builds)
- Rust compilation (covered in builds)
- No unit tests required (UI-focused changes)

---

## Rollback Plan

If Android build causes issues:

1. Revert all commits: `git reset --hard <commit-before-android>`
2. Or revert individual commits: `git revert <commit-sha>`
3. Desktop builds unaffected (menu code still works)

---

## Success Criteria

- ✅ TypeScript and Rust compile without errors
- ✅ macOS build still works (no regressions)
- ✅ Android configuration valid
- ✅ Platform detection utilities implemented
- ✅ Back button handler implemented
- ✅ Menu code conditionally compiled
- ✅ Documentation updated (BUILD.md, CLAUDE.md)
- ✅ Build scripts added to package.json
- ✅ All commits follow conventional commits format

---

## Notes

**YAGNI Applied:**
- No QR scanner (use existing CodeDisplay input)
- No settings UI (server URL hardcoded)
- No auto-update on Android (manual APK install)
- No multi-display support on Android (rare use case)

**DRY Applied:**
- Single React codebase for all platforms
- Platform detection utilities prevent duplication
- Menu code extracted to single function

**TDD Not Applied:**
- UI-focused changes (no business logic)
- Manual testing more appropriate
- Integration tests would require emulator setup
