# Android TV Support Design

**Date:** 2025-11-14
**Status:** Approved
**Platform:** Tauri 2.0 (React + Rust)

## Overview

Add Android TV as a build target for the existing Trivia Party Display app. The app will use the same React/TypeScript codebase as the macOS version, with minimal platform-specific adaptations.

**Goal:** Package the existing `trivia-party-display` app for Android TV with identical functionality to the macOS version.

## Design Principles

1. **Single Codebase**: One React app, one Rust backend, multiple platform targets
2. **KISS Approach**: Simple platform detection, no complex abstractions
3. **Reuse Everything**: All UI components, game logic, PocketBase integration stays identical
4. **Runtime Detection**: Handle platform differences at runtime in TypeScript
5. **Minimal Changes**: Only adapt what's necessary for Android TV

## Architecture

### Shared Components (No Changes)
- All React UI components (CodeDisplay, GameDisplay, game states)
- PocketBase client and real-time subscriptions
- DisplayContext and state management
- Game logic and business rules
- TypeScript utilities and helpers

### Platform-Specific Adaptations

#### macOS (Existing)
- Menu bar with File and View menus
- Toggle Fullscreen (Cmd+F)
- Move to Display (multi-monitor support)
- Quit (Cmd+Q)
- Window decorations, resizable window

#### Android TV (New)
- No menu bar
- Launches fullscreen by default
- Back button exits app
- Immersive mode (no system UI)
- No window decorations

## Implementation Strategy

### 1. Tauri Configuration

**File:** `tauri.conf.json`

Add Android configuration alongside existing macOS config:

```json
{
  "productName": "Trivia Party Display",
  "bundle": {
    "android": {
      "minSdkVersion": 24,
      "targetSdkVersion": 34
    }
  },
  "app": {
    "windows": [
      {
        "fullscreen": false,  // macOS default
        "decorations": true
      }
    ],
    "android": {
      "fullscreen": true,  // Android TV default
      "decorations": false
    }
  }
}
```

**Android-specific settings:**
- Leanback launcher intent for Android TV home screen
- Minimum SDK 24 (Android 7.0) for TV compatibility
- TV permissions (no camera/touch required)

### 2. Rust Backend Changes

**File:** `src-tauri/src/lib.rs`

Conditionally compile menu code for non-Android platforms:

```rust
#[cfg(not(target_os = "android"))]
fn setup_menu(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    // Existing menu creation code
    // File menu, View menu, event handlers
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(not(target_os = "android"))]
            setup_menu(app)?;

            Ok(())
        })
        // ...
}
```

**Existing commands remain unchanged:**
- `get_available_monitors` - won't be called on Android
- `move_to_monitor` - won't be called on Android

### 3. TypeScript Platform Detection

**New file:** `src/lib/platform.ts`

```typescript
export type Platform = 'macos' | 'android' | 'windows' | 'linux' | 'ios';

export function getPlatform(): Platform | undefined {
    return window.__TAURI_INTERNALS__?.platform;
}

export function isAndroid(): boolean {
    return getPlatform() === 'android';
}

export function isMacOS(): boolean {
    return getPlatform() === 'macos';
}
```

### 4. Android Back Button Handler

**Update:** `src/App.tsx` or `src/main.tsx`

Add Tauri event listener for Android back button:

```typescript
import { listen } from '@tauri-apps/api/event';
import { exit } from '@tauri-apps/plugin-process';
import { isAndroid } from '@/lib/platform';

// In app initialization
useEffect(() => {
    if (isAndroid()) {
        const unlisten = listen('android-back-button', () => {
            exit(0);
        });

        return () => {
            unlisten.then(fn => fn());
        };
    }
}, []);
```

### 5. Platform-Specific UI (If Needed)

Most UI stays identical. Any platform-specific rendering:

```typescript
import { isAndroid } from '@/lib/platform';

function SomeComponent() {
    const showDesktopFeature = !isAndroid();

    return (
        <div>
            {showDesktopFeature && <DesktopOnlyButton />}
        </div>
    );
}
```

## Build Configuration

### Package.json Scripts

Add Android-specific scripts to `trivia-party-display/package.json`:

```json
{
  "scripts": {
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:android:init": "tauri android init",
    "tauri:android:dev": "tauri android dev",
    "tauri:android:build": "tauri android build"
  }
}
```

### Development Setup (One-Time)

1. Install Android prerequisites:
   - Android Studio or Android SDK (SDK 24+)
   - Android NDK
   - Java JDK 17+

2. Initialize Android project:
   ```bash
   cd trivia-party-display
   pnpm tauri:android:init
   ```

3. Generated files in `src-tauri/gen/android/` (git-ignored)

### Build Targets

**macOS Development:**
```bash
pnpm tauri:dev
```

**Android TV Development:**
```bash
pnpm tauri:android:dev  # Requires device/emulator
```

**Production Builds:**
```bash
pnpm tauri:build  # → .dmg for macOS
pnpm tauri:android:build  # → .apk for Android
```

## Configuration Management

### Server URL
**Current:** Hardcoded in `src/lib/pocketbase.ts`
**Approach:** Same hardcoded URL for both platforms
**Build-time:** Can be set via environment variable if needed

```typescript
export const pbUrl = import.meta.env.VITE_PB_URL || 'https://trivia.azabab.com';
```

### Platform Detection
All platform-specific behavior detected at runtime. No compile-time flags in TypeScript needed.

## Testing Strategy

### Android TV Emulator
- Use Android Studio's AVD Manager
- Create "Android TV (1080p)" device
- API level 24+ (Android 7.0+)
- Test with D-pad navigation

### Physical Device
- Enable Developer Mode on Android TV
- Connect via ADB over network
- Deploy via `pnpm tauri:android:dev`

### Functionality Testing
- [ ] App launches fullscreen
- [ ] Code display shows correctly
- [ ] Game display updates in real-time
- [ ] Back button exits app
- [ ] PocketBase connection works
- [ ] Game state transitions work
- [ ] No menu bar attempts to render

## Future Considerations

### Additional Platforms
Same pattern applies to:
- **Windows:** Menu bar vs system tray, Alt+F4 handling
- **Apple TV:** tvOS target, focus engine, Siri remote
- **Linux:** Desktop entry, window manager compatibility

### Platform-Specific Features
Possible future additions:
- Android TV: Voice search integration
- Apple TV: Siri remote gestures
- All platforms: Platform-specific analytics

## Migration Path

1. ✅ Design approved
2. Set up git worktree for isolated development
3. Add Android configuration to `tauri.conf.json`
4. Wrap Rust menu code in platform conditionals
5. Add TypeScript platform detection utilities
6. Add Android back button handler
7. Test on Android TV emulator
8. Update documentation (BUILD.md)
9. Test on physical Android TV device
10. Create release APK
11. Merge to main branch

## Success Criteria

- ✅ Same React codebase builds for both platforms
- ✅ macOS functionality unchanged
- ✅ Android TV app launches fullscreen
- ✅ Back button exits on Android TV
- ✅ All game features work identically
- ✅ No platform-specific bugs
- ✅ Build process documented
- ✅ APK size reasonable (<20MB)

## Open Questions

None - design validated and approved.
