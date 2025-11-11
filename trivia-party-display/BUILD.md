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
