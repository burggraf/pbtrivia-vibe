# Controller Screen Dashboard Redesign

**Date:** 2025-11-15
**Status:** Design Approved
**Architecture:** Dashboard Grid Layout

## Overview

Redesign the `/controller` screen to use a card-based dashboard grid layout, improving visual organization, mobile responsiveness, and keyboard-driven workflow. This design replaces the current linear layout with a flexible grid system that scales from mobile to desktop.

## Goals

1. **Simplify Header**: Remove redundant sub-navigation bar, consolidate controls
2. **Improve Visual Hierarchy**: Card-based layout with consistent sizing and spacing
3. **Enhance Mobile Experience**: Responsive grid that adapts to viewport width
4. **Add Keyboard Shortcuts**: Enable keyboard-driven game flow control
5. **Flexible Display Options**: Toggle QR code and join link visibility via settings

## Design Decisions

### Architecture Choice: Dashboard Grid

**Selected over:**
- Command Bar Layout (too dense, less mobile-friendly)
- Hybrid Split View (unnecessary complexity for current needs)

**Rationale:**
- Better visual breathing room and organization
- Natural responsive behavior using CSS Grid
- Cleaner separation of concerns (game info, teams, controls)
- Scales well to many teams without crowding
- More touch-friendly for tablet/mobile use

## Layout Structure

### 1. Header Bar

**Purpose:** Minimal navigation and global settings

**Components:**
- **Left:** Game code display (prominent text, not a separate bar)
- **Right:** Settings button (dropdown) + Theme toggle
- **Styling:** Matches current header design system

**Settings Dropdown Menu:**
- Positioned below settings button (similar to theme toggle)
- Toggle 1: "Show QR Code" (controls QR card visibility in grid)
- Toggle 2: "Show Join Link" (controls link display within QR card)
- Closes on outside click
- Settings persist to localStorage

### 2. Stats Line

**Position:** Directly below header, above main grid

**Content:** Single centered line displaying:
```
X Teams • Y Rounds • Z Questions
```

**Styling:** Subtle, secondary text color, center-aligned

### 3. Main Content Grid

**Layout:** CSS Grid with auto-fit columns
- **Mobile (< 640px):** 1 column
- **Tablet (640-1024px):** 2 columns
- **Desktop (> 1024px):** 3-4 columns (auto-fit based on width)

**Gap:** Consistent spacing between cards (16-24px)

**Card Types:**

#### QR Code Card
- **Visibility:** Controlled by "Show QR Code" toggle in settings
- **Behavior:** When hidden, card is removed from grid (not just invisible)
- **Content:**
  - Large QR code (centered, responsive size)
  - Game code text below QR (e.g., "Game Code: ABC123")
  - Join link below game code (conditionally shown based on "Show Link" toggle)
  - Click-to-copy interaction on link
- **Styling:** White background, subtle border/shadow, matches team card dimensions
- **Aspect Ratio:** Square (same as team cards)

#### Team Cards
- **Count:** One card per team
- **Position:** Flow in grid after QR card
- **Content:**
  - Team name (header)
  - Player count badge
  - Current score (if applicable)
  - Visual indicator for active/ready status
- **Styling:** Consistent with QR card (same dimensions, styling)
- **Aspect Ratio:** Square
- **Wrapping:** Automatic based on viewport width

### 4. Floating Action Bar

**Position:** Fixed at bottom of viewport, above control cards
- Always visible (doesn't scroll away)
- Centered on desktop, full-width on mobile

**Components:**
- Back button (left arrow icon)
- Pause/Resume button (pause/play icon)
- Next button (right arrow icon)

**Purpose:** Primary game flow controls, always accessible

**Styling:**
- Prominent buttons with clear hover/active states
- Elevation/shadow to indicate floating nature
- Matches app design system

### 5. Control Cards (Bottom Row)

**Display Management Card:**
- **Width:** Half-width on desktop, full-width on mobile
- **Position:** Left side of bottom row
- **Content:** Display connection status and controls (existing functionality preserved)

**Next Question Card:**
- **Width:** Half-width on desktop, full-width on mobile
- **Position:** Right side of bottom row
- **Content:** Next question preview/controls (existing functionality preserved)

## Keyboard Shortcuts

### Key Bindings

| Key | Action | Behavior |
|-----|--------|----------|
| **Right Arrow (→)** | Next | Advances to next question/phase |
| **Left Arrow (←)** | Back | Returns to previous question/phase |
| **Spacebar** | Pause/Resume | Toggles game pause state |

### Implementation Details

- **Global handlers:** Work regardless of current focus
- **Visual feedback:** Button press animation when triggered via keyboard
- **Prevent defaults:** Stop browser scroll/navigation on these keys
- **Accessibility:** Buttons remain keyboard-focusable via Tab key

## Responsive Behavior

### Breakpoint Strategy

```
Mobile:    < 640px   → 1 column grid, stacked cards
Tablet:    640-1024px → 2 column grid
Desktop:   > 1024px   → 3-4 column grid (auto-fit)
```

### Card Behavior

- All cards maintain square aspect ratio across breakpoints
- Grid automatically reflows based on available width
- Control cards stack vertically on mobile (Display Management above Next Question)
- Floating action bar adapts: full-width on mobile, centered button group on desktop

### Wrapping Logic

- QR card appears first (if visible)
- Team cards fill remaining grid positions
- When teams exceed row capacity, wrap to next row
- Control cards always appear in bottom row (spanning full width or half-width)

## State Management

### Persistent Settings

**Stored in localStorage:**
- `controller.showQrCode`: Boolean (default: true)
- `controller.showJoinLink`: Boolean (default: true)

**Behavior:**
- Settings persist across page refreshes
- Apply on component mount
- Update in real-time when toggled

### Visual Feedback

- **Keyboard shortcuts:** Trigger button press animation (scale + color change)
- **Floating action bar:** Hover/active/focus states on all buttons
- **Settings dropdown:** Smooth open/close transition (fade + slide)
- **Card grid:** CSS transitions for layout shifts when cards added/removed
- **Toggle switches:** Smooth slide animation (shadcn/ui Switch component)

## Accessibility

### Keyboard Navigation
- Tab through all interactive elements in logical order
- Enter/Space to activate buttons and toggles
- Escape to close settings dropdown

### Screen Reader Support
- ARIA labels on icon-only buttons
- ARIA live regions for game state changes
- ARIA announcements when settings toggles change

### Focus Management
- Visible focus indicators on all interactive elements
- Focus trap in settings dropdown when open
- Focus returns to settings button when dropdown closes

## Components to Create/Modify

### New Components

1. **`ControllerHeader`**: Minimal header with game code, settings, theme toggle
2. **`ControllerStatsLine`**: Teams/rounds/questions summary
3. **`ControllerGrid`**: Main grid container with responsive layout
4. **`QrCodeCard`**: QR code display with conditional link
5. **`TeamCard`**: Individual team display card
6. **`FloatingActionBar`**: Fixed bottom bar with game flow buttons
7. **`ControllerSettings`**: Dropdown menu with QR/link toggles

### Modified Components

1. **`DisplayManagementCard`**: Adapt existing display controls to card format
2. **`NextQuestionCard`**: Adapt existing next question controls to card format

### Hooks to Create

1. **`useControllerSettings`**: Manages localStorage persistence for settings
2. **`useKeyboardShortcuts`**: Global keyboard handler for game flow
3. **`useResponsiveGrid`**: Calculates optimal grid columns based on viewport

## Implementation Notes

### CSS Grid Configuration

```css
.controller-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

/* Team cards and QR card have square aspect ratio */
.grid-card {
  aspect-ratio: 1;
  min-height: 250px;
}

/* Control cards span full width on mobile, half on desktop */
.control-card {
  grid-column: 1 / -1; /* Full width by default */
}

@media (min-width: 1024px) {
  .control-card {
    grid-column: span 2; /* Half width on desktop */
  }
}
```

### Keyboard Handler Pattern

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Prevent if user is typing in input field
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        handleNext();
        triggerButtonFeedback('next');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        handleBack();
        triggerButtonFeedback('back');
        break;
      case ' ':
        e.preventDefault();
        handlePause();
        triggerButtonFeedback('pause');
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handleNext, handleBack, handlePause]);
```

### Settings Persistence

```typescript
// Load settings on mount
useEffect(() => {
  const showQr = localStorage.getItem('controller.showQrCode') !== 'false';
  const showLink = localStorage.getItem('controller.showJoinLink') !== 'false';
  setShowQrCode(showQr);
  setShowJoinLink(showLink);
}, []);

// Save settings on change
const toggleQrCode = () => {
  const newValue = !showQrCode;
  setShowQrCode(newValue);
  localStorage.setItem('controller.showQrCode', String(newValue));
};
```

## Testing Checklist

- [ ] Responsive grid works at all breakpoints (mobile, tablet, desktop)
- [ ] QR code toggle hides/shows QR card and removes from grid flow
- [ ] Join link toggle hides/shows link within QR card
- [ ] Settings persist across page refreshes
- [ ] Keyboard shortcuts work (right arrow, left arrow, spacebar)
- [ ] Keyboard shortcuts don't interfere with typing in input fields
- [ ] Visual feedback appears when using keyboard shortcuts
- [ ] Floating action bar remains visible during scroll
- [ ] Team cards wrap correctly when exceeding row capacity
- [ ] Control cards adapt layout on mobile (stack) vs desktop (side-by-side)
- [ ] All buttons are keyboard-accessible via Tab key
- [ ] Screen reader announces setting changes
- [ ] Focus management works in settings dropdown

## Future Enhancements

- Drag-and-drop team card reordering
- Customizable card grid layout (user can choose which cards to show)
- Export/import settings profiles
- Keyboard shortcuts for direct team selection (number keys)
- Gamepad support for console-like control

## References

- shadcn/ui components: https://ui.shadcn.com/
- CSS Grid auto-fit pattern: https://css-tricks.com/auto-sizing-columns-css-grid-auto-fill-vs-auto-fit/
- Keyboard event handling: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
