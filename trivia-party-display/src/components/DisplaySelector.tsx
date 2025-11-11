import { useEffect, useState } from 'react';
import type { Monitor } from '@tauri-apps/api/window';
import { getAvailableDisplays, getCurrentDisplay, moveToDisplay } from '../lib/window';

export function DisplaySelector() {
  const [displays, setDisplays] = useState<Monitor[]>([]);
  const [currentDisplay, setCurrentDisplay] = useState<Monitor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDisplays();
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
    } finally {
      setLoading(false);
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

  if (loading) {
    return <div className="text-sm text-gray-500">Loading displays...</div>;
  }

  if (displays.length <= 1) {
    return null; // Don't show selector if only one display
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Display:</label>
      <select
        className="px-2 py-1 border rounded text-sm"
        value={currentDisplay?.name ?? ''}
        onChange={(e) => {
          const monitor = displays.find(d => d.name === e.target.value);
          if (monitor) handleDisplayChange(monitor);
        }}
      >
        {displays.map((display) => (
          <option key={display.name ?? ''} value={display.name ?? ''}>
            {display.name} ({display.size.width}×{display.size.height})
          </option>
        ))}
      </select>
    </div>
  );
}
