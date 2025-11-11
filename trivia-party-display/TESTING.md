# Display App Testing Checklist

## Window Features

- [ ] App launches in borderless window mode (no title bar)
- [ ] Window is 1920x1080 by default
- [ ] Window is centered on primary display
- [ ] Window can be resized
- [ ] Cmd+F enters fullscreen mode
- [ ] Cmd+F exits fullscreen mode
- [ ] Fullscreen hides dock and menu bar
- [ ] Display selector appears when multiple monitors present
- [ ] Can switch between monitors using selector
- [ ] Window moves to selected monitor
- [ ] Display selector hidden when single monitor

## PocketBase Connection

- [ ] App connects to remote PocketBase server
- [ ] QR code displays correctly for joining
- [ ] Game data updates in real-time
- [ ] WebSocket connection stable
- [ ] Network errors handled gracefully

## UI/UX

- [ ] All components render correctly in borderless window
- [ ] Controls visible and accessible
- [ ] Dark mode works (if applicable)
- [ ] Responsive layout works at different window sizes
- [ ] Performance smooth (60fps)

## Update System

- [ ] Update check runs on launch (no errors in console)
- [ ] Update notification appears when update available (test with older version)
- [ ] Update downloads and installs successfully
- [ ] App relaunches after update

## Build Artifacts

- [ ] Production build completes without errors
- [ ] DMG file created successfully
- [ ] DMG mounts correctly
- [ ] App installs from DMG
- [ ] Installed app launches without warnings (if signed)

## Regression Testing

- [ ] All existing display app features work
- [ ] Question display works
- [ ] Answer display works
- [ ] Score display works
- [ ] Timer display works
- [ ] Animations work
