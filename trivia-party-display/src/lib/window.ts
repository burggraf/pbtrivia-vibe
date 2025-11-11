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
