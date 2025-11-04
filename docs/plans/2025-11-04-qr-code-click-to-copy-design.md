# QR Code Click-to-Copy Feature Design

**Date:** 2025-11-04
**Status:** Approved
**Owner:** Claude Code

## Problem Statement

On the controller screen when the game displays "Welcome to the Game!" with a QR code, hosts need an easy way to share the game join link with players. Currently, the QR code is only scannable - hosts must manually type or copy the URL to share via text/messaging apps. This creates friction in the onboarding flow, especially when hosts want to quickly text the link to a group of users.

## Goals

1. Enable one-click copying of the game join URL to clipboard when QR code is clicked
2. Provide clear visual feedback that the QR code is clickable
3. Display toast notification confirming successful copy action
4. Ensure full accessibility support (keyboard navigation, screen readers)
5. Handle edge cases gracefully (clipboard permissions, browser compatibility)

## Non-Goals

- Modifying QR code appearance or size
- Adding share buttons for specific platforms (SMS, email, etc.)
- Analytics tracking of copy events (future enhancement)
- Haptic feedback on mobile devices (future enhancement)

## User Requirements

### Functional Requirements
- **FR-1**: Clicking QR code copies game join URL to system clipboard
- **FR-2**: Toast notification displays "Link copied to clipboard!" on success
- **FR-3**: Error toast displays if clipboard operation fails
- **FR-4**: QR code shows visual indicators that it's clickable (hover state, cursor)
- **FR-5**: Keyboard users can focus and activate with Enter/Space keys
- **FR-6**: Screen readers announce the action and result

### Non-Functional Requirements
- **NFR-1**: Clipboard operation completes within 100ms
- **NFR-2**: Works on modern browsers (Chrome 63+, Safari 13.1+, Firefox 53+)
- **NFR-3**: Graceful degradation for unsupported browsers
- **NFR-4**: WCAG 2.1 Level AA compliant for accessibility
- **NFR-5**: Mobile-optimized (primary use case)

## Design Decisions

### Approach Selection

**Chosen Approach:** shadcn/ui Sonner Toast

**Rationale:**
- Consistent with project's existing shadcn/ui component library
- Professional, accessible toast implementation
- Provides foundation for future toast notifications across app
- Well-maintained, small bundle size (~30KB)
- Supports dark mode (already in use)

**Alternatives Considered:**
1. **Custom Lightweight Toast** - Rejected: Would require custom accessibility implementation and maintenance
2. **Inline Feedback Only** - Rejected: Less polished UX, doesn't meet toast notification requirement

### User Feedback Design

**Selected Options:**
- Toast notification with success/error messages
- Cursor pointer on hover
- Hover state styling (scale, shadow)
- Full accessibility support (keyboard, screen reader)

### Technical Architecture

```
User Clicks QR Code
       ↓
handleCopyToClipboard()
       ↓
copyToClipboard(url) utility
       ↓
    Success? ────→ Yes ────→ toast.success("Link copied!")
       ↓
      No
       ↓
toast.error("Failed to copy")
```

## Implementation Design

### Component Structure

**Files to Create:**
1. `src/components/ui/sonner.tsx` - shadcn/ui toast component
2. `src/lib/clipboard.ts` - Clipboard utility with fallback handling

**Files to Modify:**
1. `package.json` - Add sonner dependency
2. `src/App.tsx` - Add Toaster provider
3. `src/components/games/GameStateDisplay.tsx` - Make QR code interactive

### Clipboard Implementation

**Utility Function:**
```typescript
// src/lib/clipboard.ts
export async function copyToClipboard(text: string): Promise<{
  success: boolean
  error?: string
}>
```

**Strategy:**
1. Primary: Use modern `navigator.clipboard.writeText()` API
2. Fallback: Use deprecated `document.execCommand('copy')` for older browsers
3. Return success/error object (don't throw exceptions)
4. Provide user-friendly error messages

**Error Scenarios:**
- Clipboard permission denied
- HTTPS-only restriction (HTTP will fail)
- Browser doesn't support clipboard API
- Clipboard temporarily unavailable

**Security Context:**
- Clipboard API requires secure context (HTTPS or localhost)
- No sensitive data exposure (URL already visible in QR code)
- User-initiated action (no rate limiting needed)

### UI/UX Implementation

**QR Code Interactive Container:**

HTML structure:
```tsx
<button
  onClick={handleCopyToClipboard}
  className="p-4 bg-white dark:bg-slate-800 rounded-lg border
             border-slate-200 dark:border-slate-700 shadow-sm
             hover:scale-105 hover:shadow-lg transition-transform
             cursor-pointer focus:outline-none focus:ring-2
             focus:ring-blue-500 active:scale-98"
  aria-label="Click to copy game join link to clipboard"
>
  <QRCode value={url} size={200} level="M" />
  <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-3">
    Scan to join
  </p>
</button>
```

**Visual States:**

| State | Appearance | Purpose |
|-------|-----------|---------|
| Default | White background, border, shadow | Baseline appearance |
| Hover | Scale 105%, larger shadow | Indicates interactivity |
| Active/Click | Scale 98% | Tactile feedback |
| Focus | Blue ring outline | Keyboard navigation indicator |

**Accessibility:**
- Semantic `<button>` element for proper keyboard support
- `aria-label` describes the action
- Toast uses `aria-live` region (built into Sonner)
- Keyboard: Tab to focus, Enter/Space to activate
- Screen readers announce: Action, then result from toast

**Toast Notification Specifications:**

Success toast:
- Message: "Link copied to clipboard!"
- Icon: Checkmark
- Duration: 3 seconds auto-dismiss
- Dismissible: Yes (click/tap to close)

Error toast:
- Message: "Failed to copy link" + specific reason if available
- Icon: Error/warning
- Duration: 5 seconds (longer for errors)
- Dismissible: Yes

Position:
- Mobile: Bottom-center (thumb-friendly)
- Desktop: Top-right (convention)

### Installation Steps

1. **Install dependency:**
   ```bash
   pnpm add sonner
   ```

2. **Add shadcn/ui sonner component:**
   - Option A: Use shadcn CLI: `npx shadcn-ui@latest add sonner`
   - Option B: Manually create `src/components/ui/sonner.tsx` following shadcn docs

3. **Add Toaster provider to App.tsx:**
   - Import: `import { Toaster } from '@/components/ui/sonner'`
   - Place: Inside ThemeProvider, outside Router
   - This makes toast available throughout the app

### Code Changes Summary

**src/lib/clipboard.ts** (new file):
- Export `copyToClipboard()` async function
- Implement primary Clipboard API method
- Implement fallback execCommand method
- Return structured success/error response
- Log technical errors for debugging

**src/components/games/GameStateDisplay.tsx** (modify):
- Import `toast` from sonner
- Import `copyToClipboard` utility
- Import `getPublicUrl` (already present)
- Add `handleCopyToClipboard` click handler
- Wrap QR code + label in `<button>` element
- Add hover/focus/active styles
- Add aria-label for accessibility
- Call clipboard utility + show toast on click

**src/App.tsx** (modify):
- Import `Toaster` from '@/components/ui/sonner'
- Add `<Toaster />` component at root level

**package.json** (modify):
- Add `"sonner": "^1.x.x"` to dependencies

## Testing Strategy

### Manual Testing Checklist

**Functional Testing:**
- [ ] Click QR code copies URL to clipboard
- [ ] Paste into text field confirms correct URL
- [ ] Success toast appears after clicking QR code
- [ ] Toast auto-dismisses after 3 seconds
- [ ] Toast can be manually dismissed by clicking

**Visual Testing:**
- [ ] Hover over QR code shows scale + shadow effect
- [ ] Cursor changes to pointer on hover
- [ ] Active click shows scale down feedback
- [ ] Dark mode styles work correctly

**Keyboard Navigation:**
- [ ] Tab key focuses QR code button
- [ ] Focus ring is visible and styled correctly
- [ ] Enter key triggers copy action
- [ ] Space key triggers copy action

**Accessibility Testing:**
- [ ] Screen reader announces button label
- [ ] Screen reader announces toast message
- [ ] Focus management works correctly
- [ ] High contrast mode renders properly

**Cross-Browser Testing:**
- [ ] Chrome/Edge (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Error Scenarios:**
- [ ] HTTP environment shows appropriate error
- [ ] Clipboard permission denied shows error toast
- [ ] Unsupported browser shows error toast

### Edge Cases

1. **Rapid clicking:** Clipboard utility handles concurrent calls
2. **No network:** URL copy works (no server dependency)
3. **Very long URL:** Clipboard should handle (no length limit in spec)
4. **Browser extensions blocking clipboard:** Error toast shown
5. **Incognito/private mode:** Should work (clipboard API available)

## Success Metrics

**User Experience:**
- QR code click interaction feels responsive and polished
- Visual feedback clearly indicates clickability
- Toast notifications provide clear confirmation
- Keyboard navigation works smoothly

**Technical:**
- Zero console errors during normal operation
- Clipboard operation completes in <100ms
- Works on 95%+ of target browsers
- Meets WCAG 2.1 Level AA standards

## Future Enhancements

**Phase 2 Opportunities:**
1. **Haptic Feedback:** Add `navigator.vibrate(50)` on mobile copy success
2. **Copy Animation:** Brief checkmark overlay animation on QR code
3. **Analytics:** Track copy events for usage insights
4. **Share Menu:** Native share API integration (`navigator.share()`)
5. **Copy History:** Remember last N copied codes for quick re-copy

## Dependencies

**New Runtime Dependencies:**
- `sonner` - Toast notification library

**No Breaking Changes:**
- Additive feature only
- No changes to existing functionality
- No API modifications

## Rollout Plan

**Phase 1: Implementation**
1. Install sonner package
2. Add sonner shadcn component
3. Create clipboard utility
4. Modify GameStateDisplay component
5. Add Toaster to App.tsx

**Phase 2: Testing**
1. Manual testing on dev environment
2. Cross-browser testing
3. Mobile device testing
4. Accessibility testing with screen reader

**Phase 3: Deployment**
1. Deploy to production
2. Monitor for clipboard-related errors
3. Gather user feedback

## Open Questions

None - all design questions resolved during brainstorming phase.

## Appendix

### Related Files

- `src/components/games/GameStateDisplay.tsx:71-76` - Current QR code implementation
- `src/lib/networkUrl.ts` - Contains `getPublicUrl()` utility
- `docs/design/ui-style-guide.md` - UI/UX standards reference

### References

- [MDN: Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [Sonner Documentation](https://sonner.emilkowal.ski/)
- [shadcn/ui Sonner](https://ui.shadcn.com/docs/components/sonner)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
