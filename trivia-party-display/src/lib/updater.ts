import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion?: string;
  body?: string;
}

export async function checkForUpdates(): Promise<UpdateInfo> {
  try {
    const update = await check();

    if (update?.available) {
      return {
        available: true,
        currentVersion: update.currentVersion,
        latestVersion: update.version,
        body: update.body
      };
    }

    return {
      available: false,
      currentVersion: update?.currentVersion || 'unknown'
    };
  } catch (error) {
    console.error('Update check failed:', error);
    throw error;
  }
}

export async function downloadAndInstallUpdate(): Promise<void> {
  try {
    const update = await check();

    if (update?.available) {
      await update.downloadAndInstall();
      await relaunch();
    }
  } catch (error) {
    console.error('Update installation failed:', error);
    throw error;
  }
}
