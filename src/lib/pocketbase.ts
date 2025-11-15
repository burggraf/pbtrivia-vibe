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

/**
 * Generate a file URL for a PocketBase record
 * @param collectionName - Name of the collection
 * @param recordId - ID of the record
 * @param filename - Name of the file
 * @param options - Optional query parameters (e.g., { thumb: '100x100' })
 * @returns Full URL to the file
 */
export function getFileUrl(
  collectionName: string,
  recordId: string,
  filename: string,
  options?: Record<string, string>
): string {
  if (!filename) return '';

  const baseUrl = getPocketBaseUrl();
  let url = `${baseUrl}/api/files/${collectionName}/${recordId}/${filename}`;

  // Add query parameters if provided
  if (options && Object.keys(options).length > 0) {
    const params = new URLSearchParams(options);
    url += `?${params.toString()}`;
  }

  return url;
}

export default pb;