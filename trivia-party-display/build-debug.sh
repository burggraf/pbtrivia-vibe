#!/bin/bash
# Build script for debug production builds (no auto-updater, with devtools)

cd "$(dirname "$0")"

# Temporarily disable updater in config and keep devtools
cp src-tauri/tauri.conf.json src-tauri/tauri.conf.json.bak
cat src-tauri/tauri.conf.json | jq '.plugins.updater.active = false' > src-tauri/tauri.conf.json.tmp
mv src-tauri/tauri.conf.json.tmp src-tauri/tauri.conf.json

# Build with production environment but dev profile for devtools
echo "Building debug production build..."
pnpm run tauri build -- --debug

# Restore original config
mv src-tauri/tauri.conf.json.bak src-tauri/tauri.conf.json

echo ""
echo "Debug build complete! Bundles are in:"
echo "  src-tauri/target/debug/bundle/"
