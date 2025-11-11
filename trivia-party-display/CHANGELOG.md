# Changelog

All notable changes to the Trivia Party Display application will be documented in this file.

## [1.0.0] - 2025-11-11

### Added

- Native macOS application using Tauri 2.0
- Borderless window mode for clean projector/TV display
- Fullscreen support with Cmd+F keyboard shortcut
- Multi-monitor support with display selection dropdown
- Auto-update system using GitHub Releases
- Code signing and notarization support (requires Apple Developer account)

### Technical

- Tauri 2.0 integration with existing React + Vite + TypeScript stack
- Rust backend with updater and process plugins
- Window management API for fullscreen and monitor control
- Update notification UI with automatic download and installation
- DMG installer generation for macOS distribution

### Maintained

- All existing display app features unchanged
- Remote PocketBase connection (same as web version)
- Real-time game data synchronization
- QR code display for player joining
- Question, answer, and score displays

## [0.x.x] - Previous Versions

Web-based display application (browser only). See git history for details.
