import { useEffect, useState } from 'react';
import type { Monitor } from '@tauri-apps/api/window';
import { toggleFullscreen, getAvailableDisplays, getCurrentDisplay, moveToDisplay, isFullscreen } from '../lib/window';

export function ControlPanel() {
  const [displays, setDisplays] = useState<Monitor[]>([]);
  const [currentDisplay, setCurrentDisplay] = useState<Monitor | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    loadDisplays();
    checkFullscreen();
  }, []);

  async function loadDisplays() {
    try {
      const [available, current] = await Promise.all([
        getAvailableDisplays(),
        getCurrentDisplay()
      ]);
      setDisplays(available);
      setCurrentDisplay(current);
    } catch (error) {
      console.error('Failed to load displays:', error);
    }
  }

  async function checkFullscreen() {
    try {
      const fs = await isFullscreen();
      setFullscreen(fs);
    } catch (error) {
      console.error('Failed to check fullscreen:', error);
    }
  }

  async function handleToggleFullscreen() {
    try {
      await toggleFullscreen();
      // Update state after a short delay to allow window to transition
      setTimeout(() => checkFullscreen(), 100);
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  }

  async function handleDisplayChange(monitor: Monitor) {
    try {
      await moveToDisplay(monitor);
      setCurrentDisplay(monitor);
    } catch (error) {
      console.error('Failed to move to display:', error);
    }
  }

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed top-4 right-4 z-50 bg-gray-800/80 hover:bg-gray-800 text-white p-2 rounded shadow-lg"
        title="Show controls"
      >
        ⚙️
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg space-y-3 min-w-[250px]">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Display Controls</h3>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          title="Hide controls"
        >
          ✕
        </button>
      </div>

      {/* Fullscreen toggle */}
      <div>
        <button
          onClick={handleToggleFullscreen}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition-colors"
        >
          {fullscreen ? '⊡ Exit Fullscreen' : '⛶ Enter Fullscreen'}
        </button>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
          Shortcut: Cmd+F
        </div>
      </div>

      {/* Display selector */}
      {displays.length > 1 && (
        <div>
          <label className="text-sm font-medium block mb-1">Display:</label>
          <select
            className="w-full px-3 py-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
            value={currentDisplay?.name ?? ''}
            onChange={(e) => {
              const monitor = displays.find(d => d.name === e.target.value);
              if (monitor) handleDisplayChange(monitor);
            }}
          >
            {displays.map((display, index) => (
              <option key={display.name ?? index} value={display.name ?? ''}>
                Display {index + 1}: {display.size.width}×{display.size.height}
              </option>
            ))}
          </select>
        </div>
      )}

      {displays.length === 1 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Single display detected
        </div>
      )}
    </div>
  );
}
