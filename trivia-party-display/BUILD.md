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

## Production Build Verification

Production build verified on Mon Nov 11 11:25:00 PST 2024

### Build Artifacts

- **DMG Installer**: `src-tauri/target/release/bundle/dmg/Trivia Party Display_1.0.0_aarch64.dmg` (4.3M)
- **App Bundle**: `src-tauri/target/release/bundle/macos/Trivia Party Display.app` (12M)
- **Updater Archive**: `src-tauri/target/release/bundle/macos/Trivia Party Display.app.tar.gz` (4.4M)

### Build Details

- **Platform**: macOS (Apple Silicon - aarch64)
- **Build Time**: 1m 34s
- **Rust Profile**: release [optimized]
- **Status**: Successfully built and bundled

### Installation Testing

**Manual DMG Installation Test Required:**

1. Open Finder and navigate to:
   ```
   src-tauri/target/release/bundle/dmg/
   ```

2. Double-click `Trivia Party Display_1.0.0_aarch64.dmg` to mount the disk image

3. Drag "Trivia Party Display.app" to the Applications folder

4. Launch from Applications folder or Spotlight

5. On first launch, if Gatekeeper blocks the app:
   - Right-click the app → "Open"
   - Click "Open" in the security dialog
   - Subsequent launches will work normally

### Known Issues

- Build warning about missing `TAURI_SIGNING_PRIVATE_KEY` for update signing (non-critical for local testing)
- App is unsigned - users will need to right-click → Open on first launch
- For production distribution, code signing and notarization are recommended (see "Code Signing" section)

### Next Steps for Distribution

1. **Code Signing**: Obtain Apple Developer certificate and sign the app
2. **Notarization**: Submit to Apple for notarization (required for macOS 10.15+)
3. **Update Signing**: Configure `TAURI_SIGNING_PRIVATE_KEY` for auto-update support
4. **GitHub Release**: Upload DMG to GitHub Releases for distribution

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

**Signed Release APK (Recommended):**

```bash
pnpm run tauri:android:build-release
```

This script automatically:
- Creates keystore if it doesn't exist (`~/.tauri/trivia-party-display.keystore`)
- Adds signing configuration to build.gradle.kts
- Builds signed release APK

Output: `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk`

**Custom Keystore Location:**

Set environment variables before running the build:

```bash
export ANDROID_KEYSTORE_PATH="/path/to/your.keystore"
export ANDROID_KEYSTORE_PASSWORD="your-store-password"
export ANDROID_KEY_ALIAS="your-key-alias"
export ANDROID_KEY_PASSWORD="your-key-password"
pnpm run tauri:android:build-release
```

**Manual Build (Unsigned):**

```bash
pnpm tauri:android:build-apk
```

Output: `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk`

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

