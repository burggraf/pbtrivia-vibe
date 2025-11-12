#!/bin/bash
# Build script for unsigned development builds (no auto-updater)

cd "$(dirname "$0")"

# Temporarily disable updater in config
cp src-tauri/tauri.conf.json src-tauri/tauri.conf.json.bak
cat src-tauri/tauri.conf.json | jq '.plugins.updater.active = false' > src-tauri/tauri.conf.json.tmp
mv src-tauri/tauri.conf.json.tmp src-tauri/tauri.conf.json

# Build
pnpm run tauri:build

# Restore original config
mv src-tauri/tauri.conf.json.bak src-tauri/tauri.conf.json

echo ""
echo "Build complete! Bundles are in:"
echo "  src-tauri/target/release/bundle/"
