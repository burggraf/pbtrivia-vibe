/**
 * Get the main app URL for QR codes
 * Display app runs on :5174, main app runs on :5173
 */
export function getMainAppUrl(): string {
  const { protocol, hostname } = window.location

  // Check if we're in production (standard ports 80/443 or no port in URL)
  const currentPort = window.location.port
  const isProduction = !currentPort || currentPort === '80' || currentPort === '443'

  if (isProduction) {
    // Production: use same origin (reverse proxy handles routing)
    return `${protocol}//${hostname}`
  }

  // Development: use network hostname with main app port (5173)
  // Display app runs on 5174, main app runs on 5173
  return `${protocol}//${hostname}:5173`
}
