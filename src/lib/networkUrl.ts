/**
 * Get the public URL for QR codes and external access
 * Replaces localhost with network IP when available
 */
export function getPublicUrl(): string {
  const { protocol, hostname, port } = window.location

  // If we're on localhost, try to use network address from env var
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check for environment variable (set in .env or .env.local)
    const networkUrl = import.meta.env.VITE_NETWORK_URL
    if (networkUrl) {
      return networkUrl
    }

    // Try to auto-detect from Vite's network address
    // In development, Vite exposes network address in console
    // For production, fallback to localhost
    console.warn('Using localhost for QR code. Set VITE_NETWORK_URL in .env.local for network access')
  }

  // Use current origin (hostname:port)
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`
}
