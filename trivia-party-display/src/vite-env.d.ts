/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETWORK_IP?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Tauri global type augmentation
interface Window {
  __TAURI__?: {
    [key: string]: unknown;
  };
}
