import { DisplayProvider, useDisplay } from '@/contexts/DisplayContext'
import { CodeDisplay } from '@/components/CodeDisplay'
import { GameDisplay } from '@/components/GameDisplay'
import { ErrorBanner } from '@/components/ErrorBanner'
import { UpdateNotification } from './components/UpdateNotification';

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
