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
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 9999,
          backgroundColor: '#1f2937',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          border: '2px solid #4b5563',
          cursor: 'pointer',
          fontSize: '20px'
        }}
        title="Show controls"
      >
        ⚙️
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      zIndex: 9999,
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      minWidth: '280px',
      border: '2px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontWeight: '600', fontSize: '16px', margin: 0 }}>Display Controls</h3>
        <button
          onClick={() => setVisible(false)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '4px'
          }}
          title="Hide controls"
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <button
          onClick={handleToggleFullscreen}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {fullscreen ? '⊡ Exit Fullscreen' : '⛶ Enter Fullscreen'}
        </button>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', textAlign: 'center' }}>
          Shortcut: Cmd+F
        </div>
      </div>

      {displays.length > 1 && (
        <div>
          <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Display:</label>
          <select
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
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
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          Single display detected
        </div>
      )}
    </div>
  );
}
