import { useEffect, useState } from 'react';
import { checkForUpdates, downloadAndInstallUpdate, type UpdateInfo } from '../lib/updater';

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for updates on mount
    checkForUpdates()
      .then(setUpdateInfo)
      .catch((err) => {
        console.error('Update check failed:', err);
        // Fail silently - don't disrupt user experience
      });
  }, []);

  async function handleInstallUpdate() {
    setInstalling(true);
    setError(null);

    try {
      await downloadAndInstallUpdate();
      // App will relaunch automatically
    } catch (err) {
      setError('Failed to install update. Please try again later.');
      setInstalling(false);
    }
  }

  if (!updateInfo?.available) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex flex-col gap-2">
        <div className="font-semibold">Update Available</div>
        <div className="text-sm">
          Version {updateInfo.latestVersion} is available (current: {updateInfo.currentVersion})
        </div>
        {updateInfo.body && (
          <div className="text-xs opacity-90 max-h-20 overflow-y-auto">
            {updateInfo.body}
          </div>
        )}
        {error && (
          <div className="text-xs bg-red-600 p-2 rounded">
            {error}
          </div>
        )}
        <button
          onClick={handleInstallUpdate}
          disabled={installing}
          className="bg-white text-blue-500 px-4 py-2 rounded font-medium hover:bg-gray-100 disabled:opacity-50"
        >
          {installing ? 'Installing...' : 'Install Update'}
        </button>
      </div>
    </div>
  );
}
