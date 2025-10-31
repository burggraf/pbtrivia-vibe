import PocketBase from 'pocketbase';

function getPocketBaseUrl(): string {
  const envUrl = import.meta.env.VITE_POCKETBASE_URL || '';

  // If env URL starts with https://, it's production - use as-is
  if (envUrl.startsWith('https://')) {
    return envUrl;
  }

  // Otherwise (http:// or empty), use runtime detection for development
  const hostname = window.location.hostname;
  return `http://${hostname}:8090`;
}

const pb = new PocketBase(getPocketBaseUrl());

// Disable auto-cancellation for better experience in React
pb.autoCancellation(false);

export default pb;