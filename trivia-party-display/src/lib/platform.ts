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
