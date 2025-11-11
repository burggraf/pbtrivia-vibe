# Tauri 2.0 Integration for Display App

**Date:** 2025-11-11
**Status:** Design Approved
**Target Platform:** macOS (initial), Windows/Android TV/Apple TV (future)

## Overview

Transform the trivia-party-display web application into a native application using Tauri 2.0, enabling better distribution, installation, and display capabilities for projector/TV usage.

## Goals

### Primary
- Package display app as native macOS application for easier distribution
- Provide fullscreen, borderless window modes for projector/TV display
- Implement auto-update system for seamless version updates
- Enable multi-monitor support for display selection

### Future
- Extend to additional platforms (Windows, Android TV, Apple TV)
- Mac App Store distribution
- Add native OS integrations as needed

## Design Decisions

### Architecture Approach: Hybrid Integration

**Chosen approach:** Add Tauri following conventions while keeping frontend mostly unchanged.

**Rationale:**
- Balances minimal disruption with sustainable long-term structure
- Follows Tauri conventions for better documentation/community support
- Enables future native features without major refactoring
- Supports multi-platform expansion

**Rejected alternatives:**
- **Standard Tauri structure:** Too much initial restructuring, overkill for current needs
- **Minimal wrapper:** Would complicate future native features and platform additions

### Data Architecture

**PocketBase connection:** Remote server connection (unchanged from web version)

- Display app connects to PocketBase running on host's machine over network
- No bundling of PocketBase in native app
- Maintains existing HTTP/WebSocket communication patterns
- PocketBase client code remains unchanged

## Technical Architecture

### Project Structure

```
trivia-party-display/
├── src/                    # Existing React frontend (unchanged)
│   ├── components/
│   ├── lib/
│   └── App.tsx
├── dist/                   # Vite build output (bundled by Tauri)
├── src-tauri/              # NEW: Tauri Rust backend
│   ├── src/
│   │   └── main.rs         # Rust entry point (minimal window setup)
│   ├── tauri.conf.json     # Tauri configuration
│   ├── Cargo.toml          # Rust dependencies
│   ├── icons/              # App icons (all platforms)
│   └── capabilities/       # Permission definitions (v2 security)
├── package.json            # Updated with tauri CLI scripts
├── vite.config.ts          # Minor adjustments if needed
└── node_modules/
```

### Key Configuration Files

#### tauri.conf.json
Central configuration for:
- Window properties (fullscreen, borderless, multi-monitor)
- Build settings (bundle identifier, version, code signing)
- Auto-updater configuration (endpoints, signature validation)
- Permissions and capabilities (frontend access control)

#### src-tauri/src/main.rs
Minimal Rust code:
- Window initialization with display settings
- Future IPC command handlers (for native features)
- Currently just boots window with WebView

#### package.json Scripts
New scripts:
- `pnpm tauri dev` - Development mode (Vite + Tauri window)
- `pnpm tauri build` - Production bundle (builds + signs + packages)
- `pnpm tauri icon` - Generate icon set from source image

### Window Configuration

**Display features:**
- **Borderless mode:** No title bar or window controls (`decorations: false`)
- **Fullscreen support:** True fullscreen hiding dock/menu bar
- **Multi-monitor:** API to detect displays and move window
- **Resizable:** User can adjust window size when not fullscreen

**Initial window config (tauri.conf.json):**
```json
{
  "windows": [{
    "title": "Trivia Party Display",
    "fullscreen": false,
    "decorations": false,
    "resizable": true,
    "alwaysOnTop": false,
    "width": 1920,
    "height": 1080
  }]
}
```

**User controls:**
- Keyboard shortcut (Cmd+F) to toggle fullscreen
- Menu items for display selection
- Window state persists across app restarts

**Workflow:**
1. User opens app in window mode for setup
2. Selects target display (if multi-monitor)
3. Enters fullscreen for game presentation
4. Exits fullscreen to control settings

## Auto-Update System

### Architecture

**Update flow:**
1. App checks for updates on launch (or configurable intervals)
2. Fetches manifest from update server (JSON with version, URL, signature)
3. Downloads new version in background if available
4. Prompts user to install or installs on next restart
5. Validates signature before installing (security requirement)

**Infrastructure components:**
- **Update server:** Static file hosting (GitHub Releases initially)
- **Manifest endpoint:** JSON at predictable URL pattern
- **Signed bundles:** Each release signed with private key
- **Public key:** Embedded in app to verify signatures

### Configuration

**tauri.conf.json:**
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://your-domain.com/display/{{target}}/{{current_version}}"
      ],
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

**Recommended implementation:**
- Use GitHub Releases for initial hosting (free, reliable, CDN)
- Tauri CLI auto-generates signatures during build
- Add React UI for update notifications
- Graceful fallback if update check fails (app still functional)

**Note:** Mac App Store builds won't use this system (Apple handles updates). This is for direct distribution only.

## Build Process & Code Signing

### macOS Code Signing

**Requirements for direct distribution:**
- Apple Developer account ($99/year)
- "Developer ID Application" certificate for app signing
- "Developer ID Installer" certificate for DMG/PKG signing
- Notarization (Apple's malware scan) for macOS Catalina+

**Build types:**
1. **Development builds:** No signing, runs with warning locally
2. **Distribution builds:** Full signing + notarization

**Build command:**
```bash
pnpm tauri build
```

**Automated steps:**
1. Builds Vite frontend (`pnpm run build`)
2. Compiles Rust backend
3. Creates .app bundle
4. Signs with certificate (if configured)
5. Creates DMG installer
6. Notarizes with Apple (if credentials provided)

### Signing Configuration

**tauri.conf.json:**
```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
      "entitlements": null,
      "providerShortName": "TEAM_ID"
    }
  }
}
```

**Credential storage:**
- Environment variables for CI/CD (not in git)
- macOS Keychain for local certificate storage
- Apple ID app-specific password for notarization

**Phased approach:**
1. Develop without signing (local testing)
2. Add signing for external beta testing
3. Document signing setup for CI/CD pipeline

## Dependencies

### New Dependencies

**Development dependencies:**
```json
{
  "@tauri-apps/cli": "^2.0.0"
}
```

**Runtime dependencies:**
```json
{
  "@tauri-apps/api": "^2.0.0",
  "@tauri-apps/plugin-updater": "^2.0.0"
}
```

### System Requirements

**Rust toolchain:**
- Rust 1.70+ (installed via rustup)
- Xcode Command Line Tools (macOS)

**No changes to existing stack:**
- React, Vite, TypeScript unchanged
- PocketBase client unchanged
- Tailwind, Radix UI components work as-is
- All existing dev tooling compatible

### Version Management

**Version synchronization:**
- App version in `package.json`
- App version in `tauri.conf.json`
- Rust crate version in `src-tauri/Cargo.toml`

**Recommendation:** Script to keep versions in sync across all three files.

### Bundle Sizes

**Approximate sizes:**
- Web build: ~500KB-1MB (current)
- macOS .app: ~10-15MB (includes Rust runtime + WebView)
- DMG installer: ~12-18MB compressed

## Testing Strategy

### Development Testing

**Environment:**
- `pnpm tauri dev` for local development
- Hot reload works same as Vite
- Test on physical macOS system (VM testing limited)
- PocketBase connection with remote server

### Pre-Release Testing Checklist

**Window behavior:**
- [ ] Borderless mode displays correctly
- [ ] Fullscreen toggle works (Cmd+F or menu)
- [ ] Multi-monitor detection and switching
- [ ] Window state persists across restarts

**PocketBase connectivity:**
- [ ] Connects to remote PocketBase successfully
- [ ] Real-time subscriptions work in native app
- [ ] WebSocket connections remain stable
- [ ] Network behavior matches web version

**Update system:**
- [ ] Update check on launch works
- [ ] Download and install flow completes
- [ ] Signature verification blocks tampered updates
- [ ] Graceful handling of network failures

**Build artifacts:**
- [ ] Unsigned build runs locally with expected warning
- [ ] Signed build runs without warnings
- [ ] DMG installer mounts and installs correctly
- [ ] App survives macOS restart

### Testing Environments

1. **Development:** Unsigned builds on developer Mac
2. **Beta:** Signed builds for external testers (5-10 people)
3. **Production:** Fully notarized releases for public download

### Verification Tools

**Code signing verification:**
```bash
# Verify signature
codesign --verify --deep --strict YourApp.app

# Check Gatekeeper acceptance
spctl --assess --verbose YourApp.app
```

**Runtime debugging:**
- Tauri's built-in dev tools
- Browser dev tools (same as web version)
- Rust logging for backend issues

## Implementation Phases

### Phase 1: Initial Tauri Setup
1. Install Rust toolchain
2. Install Tauri CLI
3. Run `pnpm tauri init` in display app directory
4. Configure basic window settings
5. Test development build

### Phase 2: Window Features
1. Configure borderless window mode
2. Implement fullscreen toggle
3. Add multi-monitor detection
4. Add keyboard shortcuts and menu items
5. Test on multiple displays

### Phase 3: Auto-Update System
1. Configure updater plugin
2. Set up GitHub Releases infrastructure
3. Generate signing keys for updates
4. Add update check UI in React
5. Test update flow end-to-end

### Phase 4: Code Signing & Distribution
1. Obtain Apple Developer certificate
2. Configure signing in Tauri
3. Test signing locally
4. Set up notarization
5. Create first signed release

### Phase 5: Beta Testing
1. Distribute signed build to testers
2. Gather feedback on installation/usage
3. Test update system with real release
4. Fix issues discovered in testing

### Phase 6: Production Release
1. Create production release on GitHub
2. Document installation process
3. Set up update manifest
4. Monitor initial deployments

## Future Considerations

### Multi-Platform Expansion

**Windows:**
- Similar Tauri configuration
- Code signing with Authenticode
- Windows-specific build pipeline
- MSI installer generation

**Android TV:**
- Tauri mobile support (experimental in v2)
- APK generation and signing
- Android-specific UI adjustments
- Google Play distribution

**Apple TV:**
- tvOS support (may require custom solution)
- App Store submission requirements
- Remote control input handling
- tvOS-specific constraints

### Mac App Store Distribution

**Additional requirements:**
- App sandbox entitlements
- App Store submission process
- Apple review guidelines compliance
- Separate build configuration

**Changes needed:**
- Disable custom updater (Apple handles updates)
- Add sandboxing permissions
- Test with sandbox restrictions
- Prepare marketing materials

### Native Feature Integration

**Potential future features:**
- System tray icon/menu
- Keyboard shortcuts (global)
- Screen recording integration
- Native notifications
- File system access (local caching)

**Implementation approach:**
- Add Rust IPC commands in main.rs
- Call from React via Tauri API
- Define permissions in capabilities
- Test on all target platforms

## Success Criteria

### Launch Criteria
- [ ] macOS app builds and runs on fresh Mac
- [ ] Installation process smooth for non-technical users
- [ ] Fullscreen mode works on projector/TV
- [ ] PocketBase connection reliable in native app
- [ ] Auto-updates deliver new versions successfully

### Quality Metrics
- App launches in <2 seconds
- No crashes during 4-hour game session
- Update check doesn't impact app performance
- DMG size under 20MB
- Signed app passes Gatekeeper without warnings

### User Experience
- Installation: drag .app to Applications folder (standard macOS)
- First launch: no scary warnings (proper signing)
- Updates: non-intrusive notification, installs smoothly
- Display setup: easy to select monitor and enter fullscreen
- Reliability: same stability as web version

## Risks & Mitigations

### Risk: Code Signing Complexity
**Mitigation:** Start with unsigned builds for testing, document signing process thoroughly, use CI/CD for consistent signing

### Risk: Auto-Update Infrastructure
**Mitigation:** Use GitHub Releases initially (free, reliable), have manual download fallback, test update flow extensively

### Risk: Platform-Specific Issues
**Mitigation:** Test on multiple macOS versions, gather beta tester feedback early, maintain web version as fallback

### Risk: Bundle Size Growth
**Mitigation:** Monitor bundle size, optimize Rust dependencies, use release builds with optimizations

### Risk: Breaking PocketBase Connectivity
**Mitigation:** Maintain existing client code unchanged, thorough testing with remote server, WebSocket stability testing

## References

- [Tauri 2.0 Documentation](https://v2.tauri.app/)
- [Tauri Updater Plugin](https://v2.tauri.app/plugin/updater/)
- [macOS Code Signing Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [GitHub Releases for Distribution](https://docs.github.com/en/repositories/releasing-projects-on-github)
