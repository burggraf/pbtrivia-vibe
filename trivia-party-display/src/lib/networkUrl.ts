/**
 * Get the main app URL for QR codes
 * Display app runs on :5174, main app runs on :5173
 */
export function getMainAppUrl(): string {
  const { protocol, hostname } = window.location

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
