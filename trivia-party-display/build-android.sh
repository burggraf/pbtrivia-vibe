#!/bin/bash
# Build script for signed Android TV release builds

cd "$(dirname "$0")"

# Ensure Rust/Cargo tools are in PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Android TV Release Build"
echo "========================================"
echo ""

# Check if Android project is initialized
if [ ! -d "src-tauri/gen/android" ]; then
  echo -e "${RED}❌ Android project not initialized!${NC}"
  echo ""
  echo "Run this command first:"
  echo "  pnpm tauri:android:init"
  echo ""
  exit 1
fi

# Setup keystore configuration
KEYSTORE_PATH="${ANDROID_KEYSTORE_PATH:-$HOME/.tauri/trivia-party-display.keystore}"
KEYSTORE_PASSWORD="${ANDROID_KEYSTORE_PASSWORD:-trivia-party-2025}"
KEY_ALIAS="${ANDROID_KEY_ALIAS:-trivia-party-display}"
KEY_PASSWORD="${ANDROID_KEY_PASSWORD:-trivia-party-2025}"

echo "Keystore configuration:"
echo "  Path: $KEYSTORE_PATH"
echo "  Alias: $KEY_ALIAS"
echo ""

# Check if keystore exists
if [ ! -f "$KEYSTORE_PATH" ]; then
  echo -e "${YELLOW}⚠️  Keystore not found at: $KEYSTORE_PATH${NC}"
  echo ""
  echo "Creating new keystore..."
  echo ""

  # Create .tauri directory if it doesn't exist
  mkdir -p "$(dirname "$KEYSTORE_PATH")"

  # Generate keystore
  keytool -genkeypair \
    -keystore "$KEYSTORE_PATH" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=Trivia Party, OU=Development, O=Trivia Party, L=San Francisco, ST=California, C=US"

  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create keystore!${NC}"
    echo ""
    echo "Make sure you have Java keytool installed:"
    echo "  brew install openjdk"
    echo ""
    exit 1
  fi

  echo -e "${GREEN}✅ Keystore created successfully${NC}"
  echo ""
fi

# Add signing configuration to build.gradle.kts if not already present
BUILD_GRADLE="src-tauri/gen/android/app/build.gradle.kts"

if ! grep -q "signingConfigs" "$BUILD_GRADLE"; then
  echo "Adding signing configuration to build.gradle.kts..."

  # Create backup
  cp "$BUILD_GRADLE" "$BUILD_GRADLE.bak"

  # Find the line with 'buildTypes {' and insert signing config before it
  awk -v keystore="$KEYSTORE_PATH" -v storepass="$KEYSTORE_PASSWORD" -v alias="$KEY_ALIAS" -v keypass="$KEY_PASSWORD" '
    /^[[:space:]]*buildTypes {/ {
      print "    signingConfigs {"
      print "        create(\"release\") {"
      print "            storeFile = file(\"" keystore "\")"
      print "            storePassword = \"" storepass "\""
      print "            keyAlias = \"" alias "\""
      print "            keyPassword = \"" keypass "\""
      print "        }"
      print "    }"
      print ""
    }
    { print }
  ' "$BUILD_GRADLE" > "$BUILD_GRADLE.tmp"

  mv "$BUILD_GRADLE.tmp" "$BUILD_GRADLE"

  # Add signingConfig reference to release buildType
  sed -i.bak2 '/getByName("release") {/a\
            signingConfig = signingConfigs.getByName("release")
' "$BUILD_GRADLE"

  rm -f "$BUILD_GRADLE.bak2"

  echo -e "${GREEN}✅ Signing configuration added${NC}"
  echo ""
else
  echo -e "${GREEN}✅ Signing configuration already present${NC}"
  echo ""
fi

# Build the APK
echo "Building signed release APK..."
echo ""

pnpm run tauri:android:build-apk

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}========================================"
  echo "✅ Build successful!"
  echo "========================================${NC}"
  echo ""
  echo "APK location:"
  APK_PATH="src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk"
  if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "  $APK_PATH ($APK_SIZE)"
    echo ""
    echo "Installation:"
    echo "  adb install -r $APK_PATH"
    echo ""
    echo "Or transfer to device and install manually"
  else
    echo -e "  ${YELLOW}APK not found at expected location${NC}"
    echo "  Check: src-tauri/gen/android/app/build/outputs/"
  fi
  echo ""
else
  echo ""
  echo -e "${RED}========================================"
  echo "❌ Build failed!"
  echo "========================================${NC}"
  echo ""
  echo "Common issues:"
  echo "  1. Android SDK/NDK not installed or not in PATH"
  echo "  2. Java version incompatibility (need JDK 17+)"
  echo "  3. Environment variables not set (ANDROID_HOME, NDK_HOME)"
  echo ""
  echo "See BUILD.md for setup instructions"
  echo ""
  exit 1
fi
