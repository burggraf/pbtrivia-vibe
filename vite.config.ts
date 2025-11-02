import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import os from 'os'

/**
 * Get the local network IP address for dev server
 * Returns the first non-internal IPv4 address found
 */
function getNetworkAddress(): string | undefined {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name]
    if (!nets) continue

    for (const net of nets) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return undefined
}

/**
 * Plugin to inject network IP address into environment variables
 */
function networkUrlPlugin() {
  return {
    name: 'network-url',
    configureServer(server) {
      // Hook into server start to display actual URL
      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address()
        const networkIp = getNetworkAddress()

        if (networkIp && address && typeof address === 'object') {
          const port = address.port
          const networkUrl = `http://${networkIp}:${port}`
          console.log(`\n  🌐 QR codes will use: ${networkUrl}\n`)
        }
      })
    },
    config(config, { command }) {
      // Only inject in dev mode
      if (command === 'serve') {
        const networkIp = getNetworkAddress()
        if (networkIp) {
          // Inject only the IP address - port will be determined at runtime
          config.define = {
            ...config.define,
            'import.meta.env.VITE_NETWORK_IP': JSON.stringify(networkIp)
          }
        }
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), networkUrlPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Listen on all network interfaces to allow network access
    host: '0.0.0.0',
    port: 5173,
  }
})