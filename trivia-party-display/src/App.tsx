import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { exit } from '@tauri-apps/plugin-process'
import { DisplayProvider, useDisplay } from '@/contexts/DisplayContext'
import { CodeDisplay } from '@/components/CodeDisplay'
import { GameDisplay } from '@/components/GameDisplay'
import { ErrorBanner } from '@/components/ErrorBanner'
import { UpdateNotification } from './components/UpdateNotification'
import { TextSizeTest } from '@/components/TextSizeTest'
import { TextSizeProvider } from '@/contexts/TextSizeContext'
import { isAndroid } from '@/lib/platform'

function AppContent() {
  const { currentScreen, error, clearError, initialize } = useDisplay()
  // TEMPORARY: Force test mode to be on for font size testing
  const [isTestMode] = useState(false)

  // Check for test mode in URL hash
  // useEffect(() => {
  //   const checkTestMode = () => {
  //     setIsTestMode(window.location.hash === '#test')
  //   }
  //   checkTestMode()
  //   window.addEventListener('hashchange', checkTestMode)
  //   return () => window.removeEventListener('hashchange', checkTestMode)
  // }, [])

  // Android TV: Back button exits app
  useEffect(() => {
    if (!isAndroid()) return;

    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unlisten = await listen('android-back-button', async () => {
          console.log('Android back button pressed - exiting app');
          await exit(0);
        });
      } catch (err) {
        console.error('Failed to set up Android back button listener:', err);
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  // Show test mode if hash is #test
  if (isTestMode) {
    return (
      <TextSizeProvider>
        <TextSizeTest />
      </TextSizeProvider>
    )
  }

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

      {/* Update notification - only in Tauri environment */}
      {window.__TAURI__ && <UpdateNotification />}
    </>
  )
}

export default function App() {
  return (
    <DisplayProvider>
      <AppContent />
    </DisplayProvider>
  )
}
