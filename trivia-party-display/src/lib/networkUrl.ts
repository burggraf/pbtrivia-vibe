/**
 * Get the main app URL for QR codes
 * Display app runs on :5174, main app runs on :5173
 */
export function getMainAppUrl(): string {
  // Check for explicitly configured main app URL (e.g. production builds)
  const configuredUrl = import.meta.env.VITE_MAIN_APP_URL
  if (configuredUrl) {
    return configuredUrl
  }

  const { protocol, hostname } = window.location

  // Detect Tauri environment (tauri.localhost or asset protocol)
  if (hostname === 'tauri.localhost' || protocol === 'tauri:' || protocol.startsWith('http') && hostname.includes('tauri')) {
    // In Tauri, we need the actual production URL
    // Fall back to PocketBase URL domain if available
    const pbUrl = import.meta.env.VITE_POCKETBASE_URL
    if (pbUrl) {
      try {
        const url = new URL(pbUrl)
        return `${url.protocol}//${url.hostname}`
      } catch (e) {
        console.error('Failed to parse VITE_POCKETBASE_URL:', e)
      }
    }
    // Default production URL
    console.warn('Tauri environment detected but no VITE_MAIN_APP_URL or VITE_POCKETBASE_URL set, using default')
    return 'https://trivia.azabab.com'
  }

  // If we're on localhost, try to use network IP from environment
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check for network IP injected by Vite plugin (dev mode only)
    const networkIp = import.meta.env.VITE_NETWORK_IP
    if (networkIp) {
      // Use the network IP with main app port (5173)
      return `${protocol}//${networkIp}:5173`
    }

    // Last resort: warn and use localhost with main app port
    console.warn('Using localhost for QR code. In dev mode, ensure Vite config has network detection enabled.')
    return `${protocol}//localhost:5173`
  }

  // Check if we're in production (standard ports 80/443 or no port in URL)
  const currentPort = window.location.port
  const isProduction = !currentPort || currentPort === '80' || currentPort === '443'

  if (isProduction) {
    // Production: use same origin (reverse proxy handles routing)
    return `${protocol}//${hostname}`
  }

  // Development: already on network IP, use it with main app port (5173)
  return `${protocol}//${hostname}:5173`
}
