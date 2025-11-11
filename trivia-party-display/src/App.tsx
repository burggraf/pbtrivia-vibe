import { useEffect } from 'react';
import { DisplayProvider, useDisplay } from '@/contexts/DisplayContext'
import { CodeDisplay } from '@/components/CodeDisplay'
import { GameDisplay } from '@/components/GameDisplay'
import { ErrorBanner } from '@/components/ErrorBanner'
import { toggleFullscreen } from './lib/window';

function AppContent() {
  const { currentScreen, error, clearError, initialize } = useDisplay()

  return (
    <>
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
