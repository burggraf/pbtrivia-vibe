#!/usr/bin/env node

/**
 * Syncs version from root package.json to display app's package.json and tauri.conf.json
 * Runs automatically before display app build/dev commands via npm lifecycle hooks
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// File paths
const rootPackagePath = join(rootDir, 'package.json');
const displayPackagePath = join(rootDir, 'trivia-party-display', 'package.json');
const tauriConfigPath = join(rootDir, 'trivia-party-display', 'src-tauri', 'tauri.conf.json');

try {
  // 1. Read root package.json and extract version
  const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));
  const version = rootPackage.version;

  if (!version) {
    console.error('✗ Error: No version found in root package.json');
    process.exit(1);
  }

  // 2. Read display app package.json
  const displayPackage = JSON.parse(readFileSync(displayPackagePath, 'utf8'));

  // 3. Read tauri.conf.json
  const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf8'));

  // 4. Check if already synced (idempotency)
  if (displayPackage.version === version && tauriConfig.version === version) {
    console.log(`✓ Version already synced to ${version}`);
    process.exit(0);
  }

  // 5. Update versions
  displayPackage.version = version;
  tauriConfig.version = version;

  // 6. Write files back with 2-space indentation
  writeFileSync(displayPackagePath, JSON.stringify(displayPackage, null, 2) + '\n', 'utf8');
  writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n', 'utf8');

  console.log(`✓ Version synced to ${version}`);
  process.exit(0);

} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`✗ Error: Cannot read ${error.path}`);
  } else if (error instanceof SyntaxError) {
    console.error(`✗ Error: Invalid JSON - ${error.message}`);
  } else {
    console.error(`✗ Error: ${error.message}`);
  }
  process.exit(1);
}
