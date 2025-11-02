/**
 * Get the public URL for QR codes and external access
 * Replaces localhost with network IP when available
 */
export function getPublicUrl(): string {
  const { protocol, hostname, port } = window.location

  // If we're on localhost, try to use network IP from environment
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check for network IP injected by Vite plugin (dev mode only)
    const networkIp = import.meta.env.VITE_NETWORK_IP
    if (networkIp) {
      // Use the network IP with the actual current port
      return `${protocol}//${networkIp}${port ? `:${port}` : ''}`
    }

    // Fallback: check for full URL in .env.local (manual override)
    const networkUrl = import.meta.env.VITE_NETWORK_URL
    if (networkUrl) {
      return networkUrl
    }

    // Last resort: warn and use localhost
    console.warn('Using localhost for QR code. In dev mode, ensure Vite config has network detection enabled.')
  }

  // Use current origin (hostname:port) - for production or when already on network IP
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`
}
