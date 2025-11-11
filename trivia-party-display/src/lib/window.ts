import { availableMonitors, currentMonitor, getCurrentWindow, PhysicalPosition } from '@tauri-apps/api/window';
import type { Monitor } from '@tauri-apps/api/window';

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
