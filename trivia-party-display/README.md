# Trivia Party Display Application

Standalone display application for showing trivia game content on TVs and large screens.

## Development

```bash
# Install dependencies
pnpm install

# Start development server (port 5174)
pnpm run dev

# Build for production
pnpm run build
```

## Architecture

- Completely standalone React app
- Connects to PocketBase on localhost:8090 (dev) or same origin (prod)
- Claimed by hosts using 6-digit codes
- Real-time game synchronization via PocketBase subscriptions

## Testing

Requires PocketBase running on port 8090 and main Trivia Party app for host functionality.
