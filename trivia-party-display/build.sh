#!/bin/bash
# Build script for signed production builds with auto-updater support

cd "$(dirname "$0")"

# Check if signing keys are configured
if [ -z "$TAURI_SIGNING_PRIVATE_KEY" ] || [ -z "$TAURI_SIGNING_PRIVATE_KEY_PASSWORD" ]; then
  echo "Setting up signing keys from ~/.tauri/trivia-party-display.key"
  export TAURI_SIGNING_PRIVATE_KEY="$HOME/.tauri/trivia-party-display.key"
  export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="trivia-party-2025"
fi

# Build
echo "Building Trivia Party Display with auto-updater support..."
pnpm run tauri:build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Build successful!"
  echo ""
  echo "Bundles created:"
  echo "  DMG: src-tauri/target/release/bundle/dmg/Trivia Party Display_1.0.0_aarch64.dmg"
  echo "  App: src-tauri/target/release/bundle/macos/Trivia Party Display.app"
  echo "  Updater: src-tauri/target/release/bundle/macos/Trivia Party Display.app.tar.gz"
  echo "  Signature: src-tauri/target/release/bundle/macos/Trivia Party Display.app.tar.gz.sig"
else
  echo ""
  echo "❌ Build failed!"
  exit 1
fi
