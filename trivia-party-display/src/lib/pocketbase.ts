import PocketBase from 'pocketbase';

function getPocketBaseUrl(): string {
  // Check if running in Tauri (desktop app)
  // window.location.protocol will be "tauri:" in Tauri apps
  const isTauriApp = window.location.protocol === 'tauri:' || !!window.__TAURI__;

  console.log('🔍 URL Detection:', {
    protocol: window.location.protocol,
    hasTauriGlobal: !!window.__TAURI__,
    isTauriApp,
    isDev: import.meta.env.DEV,
    mode: import.meta.env.MODE,
    viteUrl: import.meta.env.VITE_POCKETBASE_URL
  });

  if (isTauriApp) {
    // Tauri desktop app - always use localhost for now
    // TODO: Make this configurable via environment variable or settings
    console.log('📺 Using localhost PocketBase URL for Tauri app');
    return 'http://localhost:8090';
  }

  // Web app: Auto-detect PocketBase URL based on current page
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

const pbUrl = getPocketBaseUrl();
console.log('📺 PocketBase URL:', pbUrl);
const pb = new PocketBase(pbUrl);

// Disable auto-cancellation for better experience in React
pb.autoCancellation(false);

// Export both the client and the URL
export default pb;
export { pbUrl };