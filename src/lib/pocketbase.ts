import PocketBase from 'pocketbase';

function getPocketBaseUrl(): string {
  // Auto-detect PocketBase URL based on current page
  // Development: Direct access to PocketBase on port 8090
  // Production: Same origin via Nginx reverse proxy
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;

  // Development mode detection:
  // - If running on a non-standard port (not 80/443), it's a dev server
  // - Dev servers run on ports like 5173, 5174, etc.
  const isDevMode = port && port !== '80' && port !== '443';

  if (isDevMode) {
    // Development: Connect directly to PocketBase on port 8090
    // Works for localhost, 127.0.0.1, and LAN IPs like 192.168.1.122
    return `${protocol}//${hostname}:8090`;
  }

  // Production: Use same origin (Nginx reverse proxy handles routing)
  return `${protocol}//${hostname}`;
}

const pb = new PocketBase(getPocketBaseUrl());

// Disable auto-cancellation for better experience in React
pb.autoCancellation(false);

export default pb;