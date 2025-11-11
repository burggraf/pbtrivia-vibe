import { useEffect } from 'react';
import { DisplayProvider, useDisplay } from '@/contexts/DisplayContext'
import { CodeDisplay } from '@/components/CodeDisplay'
import { GameDisplay } from '@/components/GameDisplay'
import { ErrorBanner } from '@/components/ErrorBanner'
import { toggleFullscreen } from './lib/window';
import { DisplaySelector } from './components/DisplaySelector';
import { UpdateNotification } from './components/UpdateNotification';

function AppContent() {
  const { currentScreen, error, clearError, initialize } = useDisplay()

  return (
    <>
      {/* Display controls - only visible in Tauri environment */}
      {window.__TAURI__ && (
        <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 p-2 rounded shadow-lg">
          <DisplaySelector />
        </div>
      )}

      {error && (
        <ErrorBanner
          message={error}
          onDismiss={clearError}
          onRetry={error.includes('Failed to initialize') ? initialize : undefined}
          autoDismiss={!error.includes('Failed to initialize')}
        />
      )}

      {currentScreen === 'code' && <CodeDisplay />}
      {currentScreen === 'game' && <GameDisplay />}

      {/* Update notification - only in Tauri environment */}
      {window.__TAURI__ && <UpdateNotification />}
    </>
  )
}

export default function App() {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Cmd+F or Ctrl+F to toggle fullscreen
      if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
        event.preventDefault();
        toggleFullscreen().catch(console.error);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <DisplayProvider>
      <AppContent />
    </DisplayProvider>
  )
}
