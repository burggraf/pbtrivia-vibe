# User Profile Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace logout buttons with profile buttons that open a comprehensive modal for viewing/editing user information, managing avatars, and logging out.

**Architecture:** Create a reusable ProfileModal component using shadcn/ui Dialog. Integrate into HostPage and LobbyPage by replacing LogOut icon buttons with User icon buttons. Use PocketBase's built-in users collection for all data storage and file handling.

**Tech Stack:** React 18, TypeScript, shadcn/ui (Dialog, Input, Button, Badge), PocketBase client, Tailwind CSS, lucide-react icons

---

## Task 1: Create ProfileModal Component (Shell)

**Files:**
- Create: `src/components/ProfileModal.tsx`

**Step 1: Create basic modal structure with dialog**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { User, Upload, X } from 'lucide-react'
import pb from '@/lib/pocketbase'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const navigate = useNavigate()
  const [name, setName] = useState(pb.authStore.model?.name || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogout = async () => {
    try {
      pb.authStore.clear()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avatar section placeholder */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <User className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Email
            </label>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {pb.authStore.model?.email}
            </div>
          </div>

          {/* Verified status (read-only) */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Status
            </label>
            {pb.authStore.model?.verified ? (
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                ✓ Verified
              </Badge>
            ) : (
              <Badge variant="secondary">
                Unverified
              </Badge>
            )}
          </div>

          {/* Name (editable) - placeholder */}
          <div>
            <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              disabled={isLoading}
            >
              Save Changes
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
              disabled={isLoading}
            >
              Log Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add src/components/ProfileModal.tsx
git commit -m "feat: add ProfileModal shell with read-only fields"
```

---

## Task 2: Add Name Update Functionality

**Files:**
- Modify: `src/components/ProfileModal.tsx`

**Step 1: Implement handleSave function**

Add this function before the return statement in ProfileModal:

```typescript
  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      await pb.collection('users').update(pb.authStore.model?.id, {
        name: name.trim()
      })

      // Success - could add toast notification here
      console.log('Profile updated successfully')
    } catch (error) {
      console.error('Failed to update profile:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
```

**Step 2: Wire up Save button**

Replace the Save Changes button:

```typescript
<Button
  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
  disabled={isLoading}
  onClick={handleSave}
>
  {isLoading ? 'Saving...' : 'Save Changes'}
</Button>
```

**Step 3: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/ProfileModal.tsx
git commit -m "feat: add name update functionality to ProfileModal"
```

---

## Task 3: Add Avatar Display Logic

**Files:**
- Modify: `src/components/ProfileModal.tsx`

**Step 1: Add avatar state and helper function**

Add these after the existing useState hooks:

```typescript
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const getAvatarUrl = () => {
    if (avatarPreview) {
      return avatarPreview
    }
    if (pb.authStore.model?.avatar) {
      return pb.files.getUrl(pb.authStore.model, pb.authStore.model.avatar)
    }
    return null
  }

  const avatarUrl = getAvatarUrl()
```

**Step 2: Update avatar display section**

Replace the avatar div section with:

```typescript
<div className="flex flex-col items-center gap-4">
  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
    {avatarUrl ? (
      <img
        src={avatarUrl}
        alt="Profile avatar"
        className="w-full h-full object-cover"
      />
    ) : (
      <User className="h-10 w-10 text-slate-400 dark:text-slate-500" />
    )}
  </div>

  <div className="flex gap-2">
    <Button
      variant="outline"
      size="sm"
      disabled={isLoading}
    >
      <Upload className="h-4 w-4 mr-1" />
      Upload
    </Button>
    {avatarUrl && (
      <Button
        variant="outline"
        size="sm"
        disabled={isLoading}
      >
        <X className="h-4 w-4 mr-1" />
        Remove
      </Button>
    )}
  </div>
</div>
```

**Step 3: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/ProfileModal.tsx
git commit -m "feat: add avatar display with dynamic URL handling"
```

---

## Task 4: Add Avatar Upload Functionality

**Files:**
- Modify: `src/components/ProfileModal.tsx`

**Step 1: Add file input ref and avatar file state**

Add these after existing state:

```typescript
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
```

Add import at top:

```typescript
import { useRef } from 'react'
```

**Step 2: Add file selection handler**

Add this function before return:

```typescript
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setAvatarFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }
```

**Step 3: Add hidden file input**

Add this before the Dialog closing tag:

```typescript
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={handleFileSelect}
/>
```

**Step 4: Wire up Upload button**

Update Upload button:

```typescript
<Button
  variant="outline"
  size="sm"
  disabled={isLoading}
  onClick={handleUploadClick}
>
  <Upload className="h-4 w-4 mr-1" />
  Upload
</Button>
```

**Step 5: Update handleSave to include avatar**

Replace handleSave function:

```typescript
  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      const formData = new FormData()
      formData.append('name', name.trim())

      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      await pb.collection('users').update(pb.authStore.model?.id, formData)

      // Clear preview and file after successful save
      setAvatarFile(null)
      setAvatarPreview(null)

      console.log('Profile updated successfully')
    } catch (error) {
      console.error('Failed to update profile:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
```

**Step 6: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add src/components/ProfileModal.tsx
git commit -m "feat: add avatar upload functionality with preview"
```

---

## Task 5: Add Avatar Remove Functionality

**Files:**
- Modify: `src/components/ProfileModal.tsx`

**Step 1: Add remove handler**

Add this function before return:

```typescript
  const handleRemoveAvatar = async () => {
    try {
      setIsLoading(true)
      setError('')

      await pb.collection('users').update(pb.authStore.model?.id, {
        avatar: null
      })

      // Clear local state
      setAvatarFile(null)
      setAvatarPreview(null)

      console.log('Avatar removed successfully')
    } catch (error) {
      console.error('Failed to remove avatar:', error)
      setError('Failed to remove avatar. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
```

**Step 2: Wire up Remove button**

Update Remove button:

```typescript
{avatarUrl && (
  <Button
    variant="outline"
    size="sm"
    disabled={isLoading}
    onClick={handleRemoveAvatar}
  >
    <X className="h-4 w-4 mr-1" />
    Remove
  </Button>
)}
```

**Step 3: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/ProfileModal.tsx
git commit -m "feat: add avatar remove functionality"
```

---

## Task 6: Integrate ProfileModal into HostPage

**Files:**
- Modify: `src/pages/HostPage.tsx`

**Step 1: Add import and state**

Add at top with other imports:

```typescript
import { User } from 'lucide-react'
import ProfileModal from '@/components/ProfileModal'
```

Add state after existing useState hooks (around line 33):

```typescript
const [profileModalOpen, setProfileModalOpen] = useState(false)
```

**Step 2: Replace LogOut button**

Find the LogOut button in the AppHeader (lines 394-404), replace with:

```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={() => setProfileModalOpen(true)}
  className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
  aria-label="Profile"
>
  <User className="h-5 w-5" />
</Button>
```

**Step 3: Remove handleLogout function**

Delete the handleLogout function (lines 70-77)

**Step 4: Add ProfileModal component**

Add before the closing div (after the RoundEditModal, around line 632):

```typescript
<ProfileModal
  isOpen={profileModalOpen}
  onClose={() => setProfileModalOpen(false)}
/>
```

**Step 5: Update imports**

Remove LogOut from lucide-react imports at top (line 10)

**Step 6: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add src/pages/HostPage.tsx
git commit -m "feat: integrate ProfileModal into HostPage"
```

---

## Task 7: Integrate ProfileModal into LobbyPage

**Files:**
- Modify: `src/pages/LobbyPage.tsx`

**Step 1: Add import and state**

Add at top with other imports:

```typescript
import { User } from 'lucide-react'
import ProfileModal from '@/components/ProfileModal'
```

Add state after existing useState hooks (around line 19):

```typescript
const [profileModalOpen, setProfileModalOpen] = useState(false)
```

**Step 2: Replace LogOut button**

Find the LogOut button in the AppHeader (lines 152-162), replace with:

```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={() => setProfileModalOpen(true)}
  className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
  aria-label="Profile"
>
  <User className="h-5 w-5" />
</Button>
```

**Step 3: Remove handleLogout function**

Delete the handleLogout function (lines 25-32)

**Step 4: Add ProfileModal component**

Add before the closing div (after TeamSelectionModal, around line 222):

```typescript
<ProfileModal
  isOpen={profileModalOpen}
  onClose={() => setProfileModalOpen(false)}
/>
```

**Step 5: Update imports**

Remove LogOut from lucide-react imports at top (line 3)

**Step 6: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add src/pages/LobbyPage.tsx
git commit -m "feat: integrate ProfileModal into LobbyPage"
```

---

## Task 8: Final Build and Verification

**Step 1: Clean build**

Run: `npm run build`
Expected: Build succeeds with no errors or warnings

**Step 2: Check for any TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Verify all files are staged**

Run: `git status`
Expected: No uncommitted changes

**Step 4: Final commit if needed**

If any files are uncommitted:

```bash
git add -A
git commit -m "chore: final cleanup for profile modal feature"
```

---

## Testing Instructions

**Manual Testing Checklist:**

1. **HostPage Integration:**
   - Navigate to /host
   - Click User icon in header
   - ProfileModal should open
   - Verify all fields display correctly

2. **LobbyPage Integration:**
   - Navigate to /lobby
   - Click User icon in header
   - ProfileModal should open
   - Verify all fields display correctly

3. **Name Update:**
   - Open ProfileModal
   - Change name
   - Click "Save Changes"
   - Verify name updates successfully

4. **Avatar Upload:**
   - Open ProfileModal
   - Click "Upload" button
   - Select an image file
   - Preview should display
   - Click "Save Changes"
   - Verify avatar uploads and displays

5. **Avatar Remove:**
   - With an avatar present
   - Click "Remove" button
   - Verify avatar is removed
   - Placeholder icon should display

6. **Logout:**
   - Open ProfileModal
   - Click "Log Out"
   - Verify redirected to login page
   - Verify session is cleared

7. **Error Handling:**
   - Try uploading a non-image file
   - Try uploading file > 5MB
   - Try saving with empty name
   - Verify appropriate error messages display

8. **Responsive Design:**
   - Test on mobile viewport (375px)
   - Test on tablet viewport (768px)
   - Test on desktop viewport (1024px+)
   - Verify layout adjusts appropriately

9. **Dark Mode:**
   - Toggle dark mode
   - Verify all colors and contrasts are correct
   - Verify avatar border visibility

---

## Success Criteria

✓ ProfileModal component created and functional
✓ Name update works correctly
✓ Avatar upload works with validation
✓ Avatar remove works correctly
✓ Logout redirects to login page
✓ Integration complete in HostPage
✓ Integration complete in LobbyPage
✓ All error handling in place
✓ Responsive design works on all breakpoints
✓ Dark mode styling correct
✓ No TypeScript errors
✓ Clean git history with logical commits
