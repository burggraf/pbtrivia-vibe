# User Profile Modal Design

**Date:** 2025-11-04
**Author:** Claude Code
**Status:** Approved

## Overview

Replace the logout button with a profile button that opens a comprehensive modal for managing user profile settings. This provides centralized access to user information, profile editing, avatar management, and logout functionality.

## Requirements

### User Requirements
- Users need to view their account information (email, verified status)
- Users need to update their display name
- Users need to upload and manage their profile avatar
- Users need easy access to logout functionality

### Technical Requirements
- Use PocketBase built-in users collection avatar field
- Follow existing shadcn/ui component patterns
- Maintain mobile-first responsive design
- Support dark mode throughout
- Integrate seamlessly with current authentication flow

## Architecture

### Component Structure

**New Component:**
- `src/components/ProfileModal.tsx` - Comprehensive modal for profile management

**Modified Components:**
- `src/pages/HostPage.tsx` - Replace LogOut button with User icon button
- `src/pages/LobbyPage.tsx` - Replace LogOut button with User icon button

### ProfileModal Interface

```typescript
interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}
```

## Design Details

### Modal Layout

```
┌─────────────────────────────────┐
│      Profile Settings      [X]  │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────┐                │
│  │   Avatar    │  [Upload]      │
│  │  (or icon)  │  [Remove]      │
│  └─────────────┘                │
│                                 │
│  Email: user@example.com        │
│  Status: ✓ Verified / Unverified│
│                                 │
│  Name:                          │
│  [Input field          ]        │
│                                 │
│  [Save Changes]                 │
│  [Log Out]                      │
│                                 │
└─────────────────────────────────┘
```

### State Management

**Local State:**
- `name: string` - Controlled input for user's display name
- `avatarFile: File | null` - Selected avatar file before upload
- `avatarPreview: string | null` - Preview URL for selected file
- `isLoading: boolean` - Loading state for save operations
- `isSaving: boolean` - Specific loading state for save button
- `isUploadingAvatar: boolean` - Loading state for avatar upload
- `isRemovingAvatar: boolean` - Loading state for avatar removal
- `error: string` - Error message display

### Data Display

**Read-Only Fields:**
- **Email:** Display from `pb.authStore.model?.email`
- **Verified Status:** Display badge from `pb.authStore.model?.verified`
  - Verified: Green checkmark badge
  - Unverified: Gray badge

**Editable Fields:**
- **Name:** Text input field with validation
  - Validation: Required, max length check
  - Initial value from `pb.authStore.model?.name`

**Avatar Display:**
- If avatar exists: Display using `pb.files.getUrl(pb.authStore.model, pb.authStore.model?.avatar)`
- If no avatar: Display generic User icon from lucide-react in circular container
- Size: 80px × 80px (mobile), 100px × 100px (desktop)
- Style: Circular with border

## API Integration

### PocketBase Operations

**1. Update User Name:**
```typescript
await pb.collection('users').update(pb.authStore.model?.id, {
  name: newName
})
```

**2. Upload Avatar:**
```typescript
const formData = new FormData()
formData.append('avatar', avatarFile)
await pb.collection('users').update(pb.authStore.model?.id, formData)
```

**3. Remove Avatar:**
```typescript
await pb.collection('users').update(pb.authStore.model?.id, {
  avatar: null
})
```

**4. Get Avatar URL:**
```typescript
const avatarUrl = pb.files.getUrl(
  pb.authStore.model,
  pb.authStore.model?.avatar
)
```

**5. Logout:**
```typescript
pb.authStore.clear()
navigate('/')
```

### Auth State Synchronization

- PocketBase automatically updates `pb.authStore.model` after successful updates
- Component re-renders reflect updated user data automatically
- No manual refresh needed for name changes
- Avatar changes may need explicit re-fetch of auth model

### Error Handling

- Display user-friendly error messages for API failures
- Validate file type before upload (accept: `image/*`)
- Validate file size before upload (max 5MB)
- Handle network failures gracefully with retry option
- Show inline error messages below relevant fields

## UI/UX Design

### Component Library

- **Dialog:** shadcn/ui Dialog component
- **Input:** shadcn/ui Input component
- **Button:** shadcn/ui Button component
- **Badge:** shadcn/ui Badge component for verified status

### Styling Standards

**Modal Container:**
- Width: `max-w-md` (mobile), `max-w-lg` (desktop)
- Padding: Progressive spacing (p-4 mobile, p-6 desktop)
- Background: `bg-white dark:bg-slate-800`
- Border: `border border-slate-200 dark:border-slate-700`

**Avatar Container:**
- Size: 80px × 80px (mobile), 100px × 100px (desktop)
- Shape: Circular (`rounded-full`)
- Border: `border-2 border-slate-200 dark:border-slate-700`
- Background (no avatar): `bg-slate-100 dark:bg-slate-800`
- Icon color: `text-slate-400 dark:text-slate-500`

**Buttons:**
- **Upload/Remove:** Secondary style (outlined)
  - `variant="outline"`
  - `border-slate-300 dark:border-slate-600`
- **Save Changes:** Primary style
  - `bg-blue-600 hover:bg-blue-700`
  - `dark:bg-blue-500 dark:hover:bg-blue-600`
- **Log Out:** Destructive style
  - `bg-red-600 hover:bg-red-700`
  - `dark:bg-red-500 dark:hover:bg-red-600`
- All buttons: Minimum 44px height (touch target)

**Form Fields:**
- Labels: `text-sm font-medium text-slate-700 dark:text-slate-300`
- Inputs: shadcn/ui Input with dark mode support
- Error messages: `text-sm text-red-600 dark:text-red-400`
- Success messages: `text-sm text-green-600 dark:text-green-400`

### Responsive Behavior

**Mobile (< 640px):**
- Stack all elements vertically
- Avatar centered above buttons
- Full-width buttons
- Compact spacing (p-4)

**Tablet/Desktop (≥ 640px):**
- Avatar and buttons side-by-side when space allows
- Increased spacing (p-6)
- Larger avatar (100px)

## Page Integration

### HostPage Changes

**Replace LogOut Button (lines 394-404):**

Before:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={handleLogout}
  className="..."
  aria-label="Logout"
>
  <LogOut className="h-5 w-5" />
</Button>
```

After:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => setProfileModalOpen(true)}
  className="..."
  aria-label="Profile"
>
  <User className="h-5 w-5" />
</Button>
```

**Add State:**
```tsx
const [profileModalOpen, setProfileModalOpen] = useState(false)
```

**Add Modal:**
```tsx
<ProfileModal
  isOpen={profileModalOpen}
  onClose={() => setProfileModalOpen(false)}
/>
```

**Remove handleLogout function** (lines 70-77) - logout moves to ProfileModal

### LobbyPage Changes

Apply identical changes as HostPage:
- Replace LogOut button (lines 152-162) with User icon
- Add profileModalOpen state
- Add ProfileModal component
- Remove handleLogout function (lines 25-32)

## Validation Rules

### Name Field
- Required: Must not be empty
- Max length: 255 characters (PocketBase default)
- Min length: 1 character
- Trim whitespace before saving

### Avatar Upload
- File types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Max file size: 5MB
- Show preview before upload
- Validate dimensions: Warn if < 100px or > 2000px

## User Flow

### Opening Profile Modal
1. User clicks User icon in header (HostPage or LobbyPage)
2. ProfileModal opens with current user data pre-filled
3. Avatar displays if exists, otherwise shows placeholder icon

### Updating Name
1. User edits name field
2. User clicks "Save Changes"
3. Loading state shows on button
4. API call updates name in PocketBase
5. Success message displays
6. Modal can be closed or left open

### Uploading Avatar
1. User clicks "Upload" button
2. File picker opens (accept: image/*)
3. User selects image file
4. Preview displays in modal
5. User clicks "Save Changes" to commit
6. Loading state shows
7. Avatar uploads to PocketBase
8. New avatar displays immediately

### Removing Avatar
1. User clicks "Remove" button (only visible if avatar exists)
2. Confirmation prompt (optional)
3. Loading state shows
4. API call removes avatar
5. Placeholder icon displays
6. Success feedback

### Logging Out
1. User clicks "Log Out" button
2. `pb.authStore.clear()` called
3. User redirected to "/" (auth page)
4. Session ended

## Testing Considerations

### Manual Testing
- Test all operations with network throttling
- Verify dark mode styling throughout
- Test responsive behavior at all breakpoints
- Test file upload with various image types
- Test large file rejection (> 5MB)
- Verify error handling for failed API calls

### Edge Cases
- User with no name set (null/empty)
- User with no avatar
- User with very long name
- Rapid clicking during loading states
- Network interruption during upload
- Invalid file types selected

## Future Enhancements

### Potential Additions (Out of Scope)
- Email change with verification
- Password change form
- Account deletion
- Profile visibility settings
- Avatar cropping tool
- Multiple avatar preset options
- Profile statistics/metadata

## Implementation Notes

### Dependencies
- No new npm packages required
- Uses existing PocketBase client
- Uses existing shadcn/ui components
- Uses lucide-react icons (already in project)

### Performance
- Avatar preview using FileReader API (local, no upload until save)
- Debounce name validation if implemented
- Lazy load modal content (already handled by Dialog component)

### Security
- File upload validation client-side (UX) and server-side (PocketBase)
- No sensitive data exposure in modal
- PocketBase handles authentication and authorization
- CSRF protection through PocketBase client

## Success Metrics

- Users can successfully update their name
- Users can successfully upload avatars
- Users can successfully remove avatars
- Users can successfully log out from modal
- All operations work on mobile and desktop
- Dark mode works correctly throughout
- No accessibility regressions
