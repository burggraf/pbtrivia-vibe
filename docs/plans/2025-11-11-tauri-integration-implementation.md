# Tauri 2.0 Display App Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Package the trivia-party-display web application as a native macOS app using Tauri 2.0 with auto-update support, fullscreen capabilities, and code signing.

**Architecture:** Hybrid integration approach - add Tauri's `src-tauri/` directory alongside existing Vite + React frontend. Frontend code remains unchanged. Tauri provides native window wrapper, build system, and updater infrastructure. PocketBase connection remains remote (no changes to client code).

**Tech Stack:** Tauri 2.0, Rust 1.70+, existing React + TypeScript + Vite stack

---

## Prerequisites Verification

### Task 1: Verify System Requirements

**Files:**
- None (system check only)

**Step 1: Check Rust installation**

Run:
```bash
rustc --version
cargo --version
```

Expected: Rust 1.70+ and cargo installed

If not installed, run:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

**Step 2: Check Xcode Command Line Tools**

Run:
```bash
xcode-select -p
```

Expected: Path like `/Library/Developer/CommandLineTools`

If not installed, run:
```bash
xcode-select --install
```

**Step 3: Verify pnpm**

Run:
```bash
pnpm --version
```

Expected: Version 8.0.0 or higher

**Step 4: Document verification**

Create verification note (no commit yet, we'll commit after Tauri setup):
```bash
echo "System requirements verified on $(date)" > trivia-party-display/TAURI_SETUP.md
```

---

## Phase 1: Initial Tauri Setup

### Task 2: Install Tauri CLI and API

**Files:**
- Modify: `trivia-party-display/package.json`

**Step 1: Navigate to display app directory**

Run:
```bash
cd trivia-party-display
```

**Step 2: Add Tauri CLI as dev dependency**

Run:
```bash
pnpm add -D @tauri-apps/cli@^2.0.0
```

Expected: Package added to devDependencies

**Step 3: Add Tauri API and plugins**

Run:
```bash
pnpm add @tauri-apps/api@^2.0.0 @tauri-apps/plugin-updater@^2.0.0
```

Expected: Packages added to dependencies

**Step 4: Verify installation**

Run:
```bash
pnpm list @tauri-apps/cli @tauri-apps/api @tauri-apps/plugin-updater
```

Expected: All three packages listed with version 2.x

**Step 5: Commit dependency additions**

Run:
```bash
git add package.json pnpm-lock.yaml ../TAURI_SETUP.md
git commit -m "chore: add Tauri 2.0 dependencies to display app"
```

### Task 3: Initialize Tauri Project

**Files:**
- Creates: `trivia-party-display/src-tauri/` (entire directory structure)
- Modifies: `trivia-party-display/package.json` (adds scripts)

**Step 1: Run Tauri init**

Run:
```bash
cd trivia-party-display
pnpm tauri init
```

When prompted, provide these answers:
- **App name:** `Trivia Party Display`
- **Window title:** `Trivia Party Display`
- **Web assets location:** `../dist`
- **Dev server URL:** `http://localhost:5174`
- **Frontend dev command:** `pnpm dev`
- **Frontend build command:** `pnpm build`

Expected: Creates `src-tauri/` directory with Cargo.toml, tauri.conf.json, src/main.rs

**Step 2: Verify created files**

Run:
```bash
ls -la src-tauri/
cat src-tauri/tauri.conf.json
```

Expected: Directory contains Cargo.toml, tauri.conf.json, src/, icons/, capabilities/

**Step 3: Update package.json scripts**

Edit `trivia-party-display/package.json` to add Tauri scripts to existing scripts section:

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5174",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:icon": "tauri icon"
  }
}
```

**Step 4: Test initialization**

Run:
```bash
pnpm tauri:dev
```

Expected: App builds and opens in a native window showing the display app UI. Press Cmd+Q to quit.

**Step 5: Commit Tauri initialization**

Run:
```bash
git add package.json src-tauri/
git commit -m "feat: initialize Tauri 2.0 for display app

- Add src-tauri directory with default configuration
- Configure build and dev commands
- Set web assets location to ../dist
- Add tauri scripts to package.json"
```

### Task 4: Configure Basic Window Settings

**Files:**
- Modify: `trivia-party-display/src-tauri/tauri.conf.json`

**Step 1: Read current configuration**

Run:
```bash
cat src-tauri/tauri.conf.json
```

**Step 2: Update window configuration**

Edit `trivia-party-display/src-tauri/tauri.conf.json`, find the `"windows"` array and replace the first window object:

```json
{
  "windows": [
    {
      "title": "Trivia Party Display",
      "width": 1920,
      "height": 1080,
      "resizable": true,
      "fullscreen": false,
      "decorations": false,
      "alwaysOnTop": false,
      "center": true
    }
  ]
}
```

**Step 3: Test window configuration**

Run:
```bash
pnpm tauri:dev
```

Expected: Window opens borderless (no title bar), 1920x1080, centered on screen. Press Cmd+Q to quit.

**Step 4: Commit window configuration**

Run:
```bash
git add src-tauri/tauri.conf.json
git commit -m "feat: configure borderless display window

- Set window to 1920x1080 default size
- Remove window decorations (borderless)
- Center window on launch
- Enable resizing for setup flexibility"
```

### Task 5: Configure Bundle Settings

**Files:**
- Modify: `trivia-party-display/src-tauri/tauri.conf.json`

**Step 1: Update bundle identifier and metadata**

Edit `trivia-party-display/src-tauri/tauri.conf.json`, find the `"bundle"` section and update:

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "identifier": "com.triviaparty.display",
    "publisher": "Trivia Party",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "resources": [],
    "copyright": "Copyright © 2025",
    "category": "Entertainment",
    "shortDescription": "Trivia Party Display Screen",
    "longDescription": "Display application for Trivia Party trivia game system. Shows questions, answers, and scores on a projector or TV during gameplay.",
    "macOS": {
      "minimumSystemVersion": "10.13",
      "exceptionDomain": ""
    }
  }
}
```

**Step 2: Verify bundle configuration**

Run:
```bash
cat src-tauri/tauri.conf.json | grep -A 20 '"bundle"'
```

Expected: Shows updated bundle settings

**Step 3: Commit bundle configuration**

Run:
```bash
git add src-tauri/tauri.conf.json
git commit -m "feat: configure bundle metadata

- Set bundle identifier to com.triviaparty.display
- Add app description and category
- Configure macOS minimum version (10.13)"
```

---

## Phase 2: Window Features

### Task 6: Add Fullscreen Toggle Support

**Files:**
- Create: `trivia-party-display/src/lib/window.ts`
- Modify: `trivia-party-display/src/App.tsx`

**Step 1: Create window utility module**

Create `trivia-party-display/src/lib/window.ts`:

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

export async function toggleFullscreen(): Promise<void> {
  const window = getCurrentWindow();
  const isFullscreen = await window.isFullscreen();
  await window.setFullscreen(!isFullscreen);
}

export async function isFullscreen(): Promise<boolean> {
  const window = getCurrentWindow();
  return await window.isFullscreen();
}

export async function setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
  const window = getCurrentWindow();
  await window.setAlwaysOnTop(alwaysOnTop);
}
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
pnpm build
```

Expected: Build succeeds with no errors

**Step 3: Test in dev mode**

Run:
```bash
pnpm tauri:dev
```

Expected: App launches successfully (we haven't wired up the functions yet, just verifying compilation)

**Step 4: Commit window utilities**

Run:
```bash
git add src/lib/window.ts
git commit -m "feat: add window control utilities

- Add toggleFullscreen function
- Add isFullscreen check
- Add setAlwaysOnTop control
- Uses Tauri window API"
```

### Task 7: Add Keyboard Shortcut for Fullscreen

**Files:**
- Modify: `trivia-party-display/src/App.tsx`

**Step 1: Add keyboard event listener to App.tsx**

Edit `trivia-party-display/src/App.tsx`, add import at top:

```typescript
import { useEffect } from 'react';
import { toggleFullscreen } from './lib/window';
```

**Step 2: Add keyboard listener effect**

In the `App` component function, add this effect before the return statement:

```typescript
useEffect(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
    // Cmd+F or Ctrl+F to toggle fullscreen
    if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
      event.preventDefault();
      toggleFullscreen().catch(console.error);
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

**Step 3: Test fullscreen toggle**

Run:
```bash
pnpm tauri:dev
```

When app opens, press **Cmd+F** (or **Ctrl+F**).

Expected: Window enters fullscreen mode (hides dock and menu bar). Press Cmd+F again to exit fullscreen.

**Step 4: Commit keyboard shortcut**

Run:
```bash
git add src/App.tsx
git commit -m "feat: add Cmd+F keyboard shortcut for fullscreen

- Listen for Cmd+F (macOS) and Ctrl+F (other platforms)
- Toggle fullscreen mode on/off
- Prevent default browser behavior"
```

### Task 8: Add Display Selection Support

**Files:**
- Modify: `trivia-party-display/src/lib/window.ts`
- Create: `trivia-party-display/src/components/DisplaySelector.tsx`

**Step 1: Add monitor detection to window utilities**

Edit `trivia-party-display/src/lib/window.ts`, add these functions:

```typescript
import { availableMonitors, currentMonitor, PhysicalPosition } from '@tauri-apps/api/window';
import type { Monitor } from '@tauri-apps/api/window';

export async function getAvailableDisplays(): Promise<Monitor[]> {
  return await availableMonitors();
}

export async function getCurrentDisplay(): Promise<Monitor | null> {
  return await currentMonitor();
}

export async function moveToDisplay(monitor: Monitor): Promise<void> {
  const window = getCurrentWindow();

  // Position window at the center of the target monitor
  const x = monitor.position.x + Math.floor(monitor.size.width / 2) - 960; // 960 = half of 1920
  const y = monitor.position.y + Math.floor(monitor.size.height / 2) - 540; // 540 = half of 1080

  await window.setPosition(new PhysicalPosition(x, y));
}
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
pnpm build
```

Expected: Build succeeds with no errors

**Step 3: Create display selector component**

Create `trivia-party-display/src/components/DisplaySelector.tsx`:

```typescript
import { useEffect, useState } from 'react';
import type { Monitor } from '@tauri-apps/api/window';
import { getAvailableDisplays, getCurrentDisplay, moveToDisplay } from '../lib/window';

export function DisplaySelector() {
  const [displays, setDisplays] = useState<Monitor[]>([]);
  const [currentDisplay, setCurrentDisplay] = useState<Monitor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDisplays();
  }, []);

  async function loadDisplays() {
    try {
      const [available, current] = await Promise.all([
        getAvailableDisplays(),
        getCurrentDisplay()
      ]);
      setDisplays(available);
      setCurrentDisplay(current);
    } catch (error) {
      console.error('Failed to load displays:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisplayChange(monitor: Monitor) {
    try {
      await moveToDisplay(monitor);
      setCurrentDisplay(monitor);
    } catch (error) {
      console.error('Failed to move to display:', error);
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading displays...</div>;
  }

  if (displays.length <= 1) {
    return null; // Don't show selector if only one display
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Display:</label>
      <select
        className="px-2 py-1 border rounded text-sm"
        value={currentDisplay?.name || ''}
        onChange={(e) => {
          const monitor = displays.find(d => d.name === e.target.value);
          if (monitor) handleDisplayChange(monitor);
        }}
      >
        {displays.map((display) => (
          <option key={display.name} value={display.name}>
            {display.name} ({display.size.width}×{display.size.height})
          </option>
        ))}
      </select>
    </div>
  );
}
```

**Step 4: Verify compilation**

Run:
```bash
pnpm build
```

Expected: Build succeeds with no errors

**Step 5: Commit display selection**

Run:
```bash
git add src/lib/window.ts src/components/DisplaySelector.tsx
git commit -m "feat: add multi-monitor display selection

- Detect available monitors with Tauri API
- Create DisplaySelector component
- Move window to selected display
- Hide selector if only one display present"
```

### Task 9: Integrate Display Selector into UI

**Files:**
- Modify: `trivia-party-display/src/App.tsx`

**Step 1: Import DisplaySelector**

Edit `trivia-party-display/src/App.tsx`, add import:

```typescript
import { DisplaySelector } from './components/DisplaySelector';
```

**Step 2: Add DisplaySelector to the UI**

Find the appropriate location in the render output (likely near the top of the app) and add:

```tsx
{/* Display controls - only visible in Tauri environment */}
{window.__TAURI__ && (
  <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 p-2 rounded shadow-lg">
    <DisplaySelector />
  </div>
)}
```

**Step 3: Test multi-monitor support**

Run:
```bash
pnpm tauri:dev
```

Expected:
- If single monitor: No display selector appears
- If multiple monitors: Dropdown appears in top-right corner with monitor list
- Selecting a different monitor moves the window to that display

**Step 4: Commit UI integration**

Run:
```bash
git add src/App.tsx
git commit -m "feat: integrate display selector into UI

- Add DisplaySelector in top-right corner
- Only show in Tauri environment (not web)
- Conditionally render based on __TAURI__ global"
```

---

## Phase 3: Auto-Update System

### Task 10: Configure Updater Plugin

**Files:**
- Modify: `trivia-party-display/src-tauri/Cargo.toml`
- Modify: `trivia-party-display/src-tauri/tauri.conf.json`

**Step 1: Add updater plugin to Rust dependencies**

Edit `trivia-party-display/src-tauri/Cargo.toml`, add to `[dependencies]` section:

```toml
tauri-plugin-updater = "2.0.0"
```

**Step 2: Register plugin in main.rs**

Edit `trivia-party-display/src-tauri/src/main.rs`, modify the `tauri::Builder` setup:

Find the `tauri::Builder::default()` chain and add the plugin:

```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 3: Generate update keys**

Run:
```bash
cd src-tauri
pnpm tauri signer generate -w ~/.tauri/trivia-display.key
```

Expected: Outputs public key and saves private key to `~/.tauri/trivia-display.key`

**IMPORTANT:** Copy the public key from output (starts with `dW50cnVzdGVk...`)

**Step 4: Configure updater in tauri.conf.json**

Edit `trivia-party-display/src-tauri/tauri.conf.json`, find or add `"plugins"` section at root level:

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/YOUR_USERNAME/trivia-party/releases/latest/download/latest.json"
      ],
      "pubkey": "PASTE_YOUR_PUBLIC_KEY_HERE",
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

Replace `YOUR_USERNAME` with actual GitHub username and `PASTE_YOUR_PUBLIC_KEY_HERE` with the public key from Step 3.

**Step 5: Verify build**

Run:
```bash
pnpm build
```

Expected: Build succeeds with no errors

**Step 6: Commit updater configuration**

Run:
```bash
git add ../src-tauri/Cargo.toml ../src-tauri/src/main.rs ../src-tauri/tauri.conf.json
git commit -m "feat: configure auto-updater plugin

- Add tauri-plugin-updater dependency
- Register plugin in main.rs
- Generate and configure signing keys
- Set GitHub Releases as update endpoint

Note: Private key stored in ~/.tauri/trivia-display.key (not in repo)"
```

### Task 11: Implement Update Check UI

**Files:**
- Create: `trivia-party-display/src/lib/updater.ts`
- Create: `trivia-party-display/src/components/UpdateNotification.tsx`

**Step 1: Create updater utility module**

Create `trivia-party-display/src/lib/updater.ts`:

```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion?: string;
  body?: string;
}

export async function checkForUpdates(): Promise<UpdateInfo> {
  try {
    const update = await check();

    if (update?.available) {
      return {
        available: true,
        currentVersion: update.currentVersion,
        latestVersion: update.version,
        body: update.body
      };
    }

    return {
      available: false,
      currentVersion: update?.currentVersion || 'unknown'
    };
  } catch (error) {
    console.error('Update check failed:', error);
    throw error;
  }
}

export async function downloadAndInstallUpdate(): Promise<void> {
  try {
    const update = await check();

    if (update?.available) {
      await update.downloadAndInstall();
      await relaunch();
    }
  } catch (error) {
    console.error('Update installation failed:', error);
    throw error;
  }
}
```

**Step 2: Add process plugin dependency**

Edit `trivia-party-display/src-tauri/Cargo.toml`, add to `[dependencies]`:

```toml
tauri-plugin-process = "2.0.0"
```

**Step 3: Register process plugin**

Edit `trivia-party-display/src-tauri/src/main.rs`, add plugin:

```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 4: Create update notification component**

Create `trivia-party-display/src/components/UpdateNotification.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { checkForUpdates, downloadAndInstallUpdate, type UpdateInfo } from '../lib/updater';

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for updates on mount
    checkForUpdates()
      .then(setUpdateInfo)
      .catch((err) => {
        console.error('Update check failed:', err);
        // Fail silently - don't disrupt user experience
      });
  }, []);

  async function handleInstallUpdate() {
    setInstalling(true);
    setError(null);

    try {
      await downloadAndInstallUpdate();
      // App will relaunch automatically
    } catch (err) {
      setError('Failed to install update. Please try again later.');
      setInstalling(false);
    }
  }

  if (!updateInfo?.available) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex flex-col gap-2">
        <div className="font-semibold">Update Available</div>
        <div className="text-sm">
          Version {updateInfo.latestVersion} is available (current: {updateInfo.currentVersion})
        </div>
        {updateInfo.body && (
          <div className="text-xs opacity-90 max-h-20 overflow-y-auto">
            {updateInfo.body}
          </div>
        )}
        {error && (
          <div className="text-xs bg-red-600 p-2 rounded">
            {error}
          </div>
        )}
        <button
          onClick={handleInstallUpdate}
          disabled={installing}
          className="bg-white text-blue-500 px-4 py-2 rounded font-medium hover:bg-gray-100 disabled:opacity-50"
        >
          {installing ? 'Installing...' : 'Install Update'}
        </button>
      </div>
    </div>
  );
}
```

**Step 5: Verify compilation**

Run:
```bash
pnpm build
```

Expected: Build succeeds

**Step 6: Commit update UI**

Run:
```bash
git add src/lib/updater.ts src/components/UpdateNotification.tsx ../src-tauri/Cargo.toml ../src-tauri/src/main.rs
git commit -m "feat: add update notification UI

- Create updater utility functions
- Add UpdateNotification component
- Check for updates on app launch
- Show notification when update available
- Handle download and installation"
```

### Task 12: Integrate Update Notification

**Files:**
- Modify: `trivia-party-display/src/App.tsx`

**Step 1: Import UpdateNotification**

Edit `trivia-party-display/src/App.tsx`, add import:

```typescript
import { UpdateNotification } from './components/UpdateNotification';
```

**Step 2: Add UpdateNotification to render**

Add near the end of the component's return statement (before closing fragment or root element):

```tsx
{/* Update notification - only in Tauri environment */}
{window.__TAURI__ && <UpdateNotification />}
```

**Step 3: Test in development**

Run:
```bash
pnpm tauri:dev
```

Expected: App launches. No update notification appears (no updates available in dev mode).

**Step 4: Commit integration**

Run:
```bash
git add src/App.tsx
git commit -m "feat: integrate update notification into app

- Add UpdateNotification to App component
- Only render in Tauri environment
- Automatic check on launch"
```

---

## Phase 4: Build and Distribution Setup

### Task 13: Configure Release Build Settings

**Files:**
- Modify: `trivia-party-display/src-tauri/tauri.conf.json`

**Step 1: Update version in tauri.conf.json**

Edit `trivia-party-display/src-tauri/tauri.conf.json`, update `"version"` field:

```json
{
  "version": "1.0.0"
}
```

**Step 2: Sync version in package.json**

Edit `trivia-party-display/package.json`, update `"version"` field:

```json
{
  "version": "1.0.0"
}
```

**Step 3: Configure build settings**

Edit `trivia-party-display/src-tauri/tauri.conf.json`, add/update `"build"` section in bundle:

```json
{
  "bundle": {
    "createUpdaterArtifacts": true,
    "macOS": {
      "minimumSystemVersion": "10.13",
      "frameworks": [],
      "exceptionDomain": ""
    }
  }
}
```

**Step 4: Test production build**

Run:
```bash
pnpm tauri:build
```

Expected: Build completes successfully. Creates DMG file in `src-tauri/target/release/bundle/dmg/`

**Note:** Build will NOT be signed yet (that requires Apple Developer certificate).

**Step 5: Commit build configuration**

Run:
```bash
git add src-tauri/tauri.conf.json package.json
git commit -m "feat: configure release build settings

- Set initial version to 1.0.0
- Enable updater artifact generation
- Configure macOS bundle settings
- Sync version across package.json and tauri.conf.json"
```

### Task 14: Create App Icons

**Files:**
- Create: `trivia-party-display/app-icon.png` (source icon)
- Modifies: `trivia-party-display/src-tauri/icons/*` (generated icons)

**Step 1: Create or obtain source icon**

You need a 1024x1024 PNG icon file. For now, create a placeholder:

Create `trivia-party-display/app-icon.png` with content (or use existing logo):
- Either create a proper icon
- Or copy an existing image as placeholder

**Step 2: Generate icon set**

Run:
```bash
pnpm tauri:icon app-icon.png
```

Expected: Generates icons in `src-tauri/icons/` directory for all platforms

**Step 3: Verify generated icons**

Run:
```bash
ls -la src-tauri/icons/
```

Expected: Multiple icon files (.png, .icns, .ico) present

**Step 4: Test with new icons**

Run:
```bash
pnpm tauri:dev
```

Expected: App opens with new icon visible in dock

**Step 5: Commit icons**

Run:
```bash
git add app-icon.png src-tauri/icons/
git commit -m "feat: add application icons

- Add source icon (1024x1024)
- Generate icon set for all platforms
- Icons used for dock, window, and installer"
```

### Task 15: Add Build Documentation

**Files:**
- Create: `trivia-party-display/BUILD.md`

**Step 1: Create build documentation**

Create `trivia-party-display/BUILD.md`:

```markdown
# Building Trivia Party Display

## Prerequisites

- Rust 1.70+ (install via [rustup](https://rustup.rs/))
- Xcode Command Line Tools: `xcode-select --install`
- pnpm package manager
- Node.js 18+

## Development Build

```bash
cd trivia-party-display
pnpm install
pnpm tauri:dev
```

This launches the app in development mode with hot reload.

## Production Build

```bash
cd trivia-party-display
pnpm install
pnpm tauri:build
```

Builds are created in `src-tauri/target/release/bundle/`:
- `dmg/` - macOS installer
- `macos/` - .app bundle

## Code Signing (Optional)

To distribute outside the Mac App Store, you need:

1. Apple Developer account ($99/year)
2. "Developer ID Application" certificate installed in Keychain
3. Configure in `tauri.conf.json`:

```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)"
    }
  }
}
```

## Notarization (Required for macOS 10.15+)

After signing, notarize with Apple:

```bash
xcrun notarytool submit src-tauri/target/release/bundle/dmg/Trivia\ Party\ Display_1.0.0_x64.dmg \
  --apple-id your-apple-id@example.com \
  --password your-app-specific-password \
  --team-id YOUR_TEAM_ID \
  --wait
```

## Update Signing

Updates are signed automatically during build using the private key in `~/.tauri/trivia-display.key`.

**IMPORTANT:** Keep this private key secure and backed up. The public key is in `tauri.conf.json`.

## Troubleshooting

### Build fails with Rust errors
- Update Rust: `rustup update`
- Clean build: `cd src-tauri && cargo clean`

### App won't open on another Mac
- Not signed: macOS Gatekeeper blocks unsigned apps
- Solution: Right-click → Open (first time only) or sign the app

### Icons not showing
- Regenerate: `pnpm tauri:icon app-icon.png`
- Clean build: `rm -rf src-tauri/target/`
```

**Step 2: Commit documentation**

Run:
```bash
git add BUILD.md
git commit -m "docs: add build instructions for display app

- Document prerequisites and dependencies
- Add development and production build steps
- Include code signing instructions
- Add troubleshooting section"
```

---

## Phase 5: Testing and Verification

### Task 16: Test Window Features

**Files:**
- Create: `trivia-party-display/TESTING.md`

**Step 1: Create testing checklist**

Create `trivia-party-display/TESTING.md`:

```markdown
# Display App Testing Checklist

## Window Features

- [ ] App launches in borderless window mode (no title bar)
- [ ] Window is 1920x1080 by default
- [ ] Window is centered on primary display
- [ ] Window can be resized
- [ ] Cmd+F enters fullscreen mode
- [ ] Cmd+F exits fullscreen mode
- [ ] Fullscreen hides dock and menu bar
- [ ] Display selector appears when multiple monitors present
- [ ] Can switch between monitors using selector
- [ ] Window moves to selected monitor
- [ ] Display selector hidden when single monitor

## PocketBase Connection

- [ ] App connects to remote PocketBase server
- [ ] QR code displays correctly for joining
- [ ] Game data updates in real-time
- [ ] WebSocket connection stable
- [ ] Network errors handled gracefully

## UI/UX

- [ ] All components render correctly in borderless window
- [ ] Controls visible and accessible
- [ ] Dark mode works (if applicable)
- [ ] Responsive layout works at different window sizes
- [ ] Performance smooth (60fps)

## Update System

- [ ] Update check runs on launch (no errors in console)
- [ ] Update notification appears when update available (test with older version)
- [ ] Update downloads and installs successfully
- [ ] App relaunches after update

## Build Artifacts

- [ ] Production build completes without errors
- [ ] DMG file created successfully
- [ ] DMG mounts correctly
- [ ] App installs from DMG
- [ ] Installed app launches without warnings (if signed)

## Regression Testing

- [ ] All existing display app features work
- [ ] Question display works
- [ ] Answer display works
- [ ] Score display works
- [ ] Timer display works
- [ ] Animations work
```

**Step 2: Commit testing checklist**

Run:
```bash
git add TESTING.md
git commit -m "docs: add testing checklist for Tauri features

- Window feature tests
- PocketBase connection tests
- UI/UX verification
- Update system tests
- Build artifact verification"
```

### Task 17: Manual Testing Pass

**Files:**
- None (manual testing only)

**Step 1: Launch development build**

Run:
```bash
pnpm tauri:dev
```

**Step 2: Test window features**

Work through the "Window Features" section of `TESTING.md`:
- Verify borderless mode
- Test Cmd+F fullscreen toggle
- If multiple monitors available, test display selector
- Check window resizing

**Step 3: Test PocketBase connection**

- Ensure PocketBase server is running (from main project)
- Verify display app connects successfully
- Check that game data displays correctly

**Step 4: Test UI responsiveness**

- Resize window to various sizes
- Check that all content remains visible and usable
- Verify no layout issues

**Step 5: Document any issues**

If you find issues, document them in the console output or create GitHub issues. For this task, just verify basic functionality works.

**Step 6: Create test completion marker**

Run:
```bash
echo "Manual testing completed on $(date)" >> TESTING.md
echo "Platform: $(uname -a)" >> TESTING.md
```

**Step 7: Commit test results**

Run:
```bash
git add TESTING.md
git commit -m "test: complete manual testing pass

- Verified window features working
- Confirmed PocketBase connection
- UI rendering correctly
- Ready for production build"
```

---

## Phase 6: Final Integration

### Task 18: Update Main Project Documentation

**Files:**
- Modify: `../CLAUDE.md`

**Step 1: Add display app Tauri section to CLAUDE.md**

Edit the main project's `CLAUDE.md` (in parent directory), add to the "Display App" section:

```markdown
### Display App

The **display app** (also called **display screen**) is a separate standalone application located in `./trivia-party-display/` with its own `package.json`. It is used for presenting the game on a shared screen/projector during gameplay.

**Technology:** Built with Tauri 2.0 for native macOS distribution (Windows/Android TV/Apple TV planned).

**Key Features:**
- Native macOS application (not browser-based)
- Borderless window mode for clean projector display
- Fullscreen support (Cmd+F to toggle)
- Multi-monitor support with display selection
- Auto-update system (GitHub Releases)
- Connects to remote PocketBase server (same as web version)

**Development:**
```bash
cd trivia-party-display
pnpm tauri:dev
```

**Production Build:**
```bash
cd trivia-party-display
pnpm tauri:build
```

See `trivia-party-display/BUILD.md` for detailed build instructions.
```

**Step 2: Commit documentation update**

Run:
```bash
git add ../CLAUDE.md
git commit -m "docs: document Tauri display app in CLAUDE.md

- Add display app technology stack
- Document key Tauri features
- Add development and build commands
- Reference BUILD.md for details"
```

### Task 19: Create Release Notes

**Files:**
- Create: `trivia-party-display/CHANGELOG.md`

**Step 1: Create changelog**

Create `trivia-party-display/CHANGELOG.md`:

```markdown
# Changelog

All notable changes to the Trivia Party Display application will be documented in this file.

## [1.0.0] - 2025-11-11

### Added

- Native macOS application using Tauri 2.0
- Borderless window mode for clean projector/TV display
- Fullscreen support with Cmd+F keyboard shortcut
- Multi-monitor support with display selection dropdown
- Auto-update system using GitHub Releases
- Code signing and notarization support (requires Apple Developer account)

### Technical

- Tauri 2.0 integration with existing React + Vite + TypeScript stack
- Rust backend with updater and process plugins
- Window management API for fullscreen and monitor control
- Update notification UI with automatic download and installation
- DMG installer generation for macOS distribution

### Maintained

- All existing display app features unchanged
- Remote PocketBase connection (same as web version)
- Real-time game data synchronization
- QR code display for player joining
- Question, answer, and score displays

## [0.x.x] - Previous Versions

Web-based display application (browser only). See git history for details.
```

**Step 2: Commit changelog**

Run:
```bash
git add CHANGELOG.md
git commit -m "docs: add changelog for v1.0.0 release

- Document new Tauri features
- List technical improvements
- Note maintained web app features"
```

### Task 20: Final Build and Verification

**Files:**
- None (build verification only)

**Step 1: Clean previous builds**

Run:
```bash
rm -rf src-tauri/target/
rm -rf dist/
```

**Step 2: Run production build**

Run:
```bash
pnpm install
pnpm tauri:build
```

Expected: Build completes successfully. Output shows:
```
    Finished `release` profile [optimized] target(s) in Xm XXs
    Bundling Trivia Party Display.app (...)
    Bundling Trivia Party Display_1.0.0_x64.dmg (...)
```

**Step 3: Verify build artifacts**

Run:
```bash
ls -lh src-tauri/target/release/bundle/dmg/
ls -lh src-tauri/target/release/bundle/macos/
```

Expected: DMG and .app files present with reasonable sizes (~10-20MB)

**Step 4: Test DMG installation**

1. Open Finder
2. Navigate to `src-tauri/target/release/bundle/dmg/`
3. Double-click the DMG file
4. DMG mounts and shows installer
5. Drag app to Applications folder
6. Open app from Applications

Expected: App launches successfully (may show warning if unsigned)

**Step 5: Document build completion**

Run:
```bash
echo "Production build verified on $(date)" >> BUILD.md
echo "DMG size: $(du -h src-tauri/target/release/bundle/dmg/*.dmg | cut -f1)" >> BUILD.md
```

**Step 6: Final commit**

Run:
```bash
git add BUILD.md
git commit -m "build: verify production build artifacts

- DMG installer created successfully
- App bundle functional
- Installation process tested
- Ready for release"
```

---

## Post-Implementation Steps

After completing all tasks:

1. **Merge to main branch:**
   ```bash
   git push -u origin feature/tauri-display-app
   ```
   Then create PR on GitHub and merge to main.

2. **Set up GitHub Release:**
   - Create release on GitHub with tag `v1.0.0`
   - Upload DMG file from `src-tauri/target/release/bundle/dmg/`
   - Upload updater artifacts (`.sig` files) from same directory
   - Create `latest.json` manifest (see Tauri updater docs)

3. **Code Signing (when ready):**
   - Obtain Apple Developer certificate
   - Configure signing identity in `tauri.conf.json`
   - Rebuild and notarize with Apple
   - Upload signed DMG to GitHub Release

4. **Documentation:**
   - Update main README with download link
   - Add usage instructions for end users
   - Document update process

5. **Testing:**
   - Test auto-update by releasing v1.0.1
   - Verify update notification and installation works
   - Test on multiple macOS versions if possible

---

## Notes for Future Platforms

### Windows Support
- Add Windows build target in `tauri.conf.json`
- Generate MSI installer
- Code sign with Windows certificate
- Test on Windows 10/11

### Android TV
- Requires Tauri Mobile (experimental in v2)
- Add Android build configuration
- APK signing with Android keystore
- Test on Android TV emulator and device

### Apple TV
- May require custom solution (Tauri tvOS not yet supported)
- Consider React Native or native Swift alternative
- App Store submission required

See design document (`docs/plans/2025-11-11-tauri-display-app-design.md`) for detailed multi-platform strategy.
