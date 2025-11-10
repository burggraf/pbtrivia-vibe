import { DisplayProvider, useDisplay } from '@/contexts/DisplayContext'
import { CodeDisplay } from '@/components/CodeDisplay'
import { GameDisplay } from '@/components/GameDisplay'
import { ErrorBanner } from '@/components/ErrorBanner'

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
  return (
    <DisplayProvider>
      <AppContent />
    </DisplayProvider>
  )
}
