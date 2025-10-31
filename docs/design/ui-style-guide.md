# UI Style Guide

**Version**: 1.0
**Last Updated**: 2025-10-31
**Based on**: Mobile responsive game page implementation

## Overview

This style guide documents the UI design principles, patterns, and standards used throughout the PB Trivia application. It's based on the mobile-first responsive approach developed for the game page.

### Component Library

**CRITICAL: Always Use shadcn/ui Components**

- **NEVER create custom HTML components** (divs, buttons, inputs, etc.)
- **ALWAYS use shadcn/ui components** from `src/components/ui/`
- Available components include: Button, Card, Badge, Dialog, Input, Label, etc.
- If you need a component that doesn't exist, add it from shadcn/ui library
- Only extend existing shadcn components with Tailwind classes

**Why?**
- Consistent styling and behavior across the app
- Built on Radix UI primitives for accessibility
- Already integrated with our theme system
- Reduces code duplication and maintenance

**Example - Wrong vs Right**:

❌ **Wrong** - Custom HTML:
```tsx
<div className="px-4 py-2 bg-blue-500 text-white rounded">
  Click me
</div>
```

✅ **Right** - shadcn Button:
```tsx
<Button variant="default">
  Click me
</Button>
```

---

## Design Principles

### 1. Mobile-First Responsive Design
- Design for smallest screens first (375px width minimum)
- Progressively enhance for larger screens
- Use Tailwind responsive modifiers: `sm:`, `md:`, `lg:`

### 2. Balanced Approach
- Not too cramped, not too spacious
- Optimize for readability and usability
- Maintain adequate touch targets (minimum 44px)

### 3. Clean and Minimal
- Remove unnecessary elements
- Focus on content
- Streamline navigation

### 4. Consistent Spacing
- Use progressive spacing scales
- Mobile: smaller gaps and padding
- Desktop: generous spacing

---

## Breakpoints

| Breakpoint | Width | Tailwind Prefix | Usage |
|------------|-------|-----------------|-------|
| Mobile | < 640px | (base) | Default styles |
| Tablet | 640px - 1023px | `sm:`, `md:` | Intermediate layouts |
| Desktop | ≥ 1024px | `lg:` | Full layouts |

**Implementation Pattern**:
```tsx
// Mobile-first approach
className="text-lg md:text-2xl lg:text-3xl"
```

---

## Typography

### Font Sizes

**Responsive scaling pattern**: smaller mobile → larger desktop

| Element | Mobile | Tablet/Desktop | Usage |
|---------|--------|----------------|-------|
| Page Title | `text-lg` | `md:text-2xl` | Main page headers |
| Section Title | `text-base` | `md:text-xl` | Section headers |
| Card Title | `text-base` | `md:text-lg` | Card headers |
| Body Text | `text-sm` | `md:text-base` | Main content |
| Small Text | `text-xs` | `md:text-sm` | Secondary info |

**Examples**:
```tsx
// Page title
<h1 className="text-lg md:text-2xl font-semibold">

// Section heading
<h2 className="text-base md:text-xl font-bold">

// Body text
<p className="text-sm md:text-base">

// Badge/label
<Badge className="text-xs md:text-sm">
```

### Font Weights
- `font-semibold` - Page titles, primary headers
- `font-bold` - Section headers, emphasis
- `font-medium` - Interactive elements (buttons, labels)
- `font-normal` - Body text (default)

---

## Spacing

### Container Padding

Progressive padding for page containers:

```tsx
className="p-4 md:p-6 lg:p-8"
```

| Screen Size | Padding | Pixels |
|-------------|---------|--------|
| Mobile | `p-4` | 16px |
| Tablet | `md:p-6` | 24px |
| Desktop | `lg:p-8` | 32px |

### Margins

**Bottom margins** (spacing between sections):

```tsx
className="mb-4 md:mb-6 lg:mb-8"
```

| Screen Size | Margin | Pixels |
|-------------|--------|--------|
| Mobile | `mb-4` | 16px |
| Tablet | `md:mb-6` | 24px |
| Desktop | `lg:mb-8` | 32px |

### Gap Spacing

**Between flex/grid items**:

```tsx
// Tight spacing
className="gap-2 md:gap-3"

// Medium spacing
className="gap-3 md:gap-4 lg:gap-6"

// Loose spacing
className="gap-4 md:gap-6"
```

---

## Colors

### Background Colors

**Light mode**:
- Page background: `bg-slate-50`
- Card background: `bg-white`
- Interactive default: `bg-blue-50`
- Interactive hover: `bg-blue-100`
- Interactive selected: `bg-blue-200`

**Dark mode**:
- Page background: `dark:bg-slate-900`
- Card background: `dark:bg-slate-800`
- Interactive default: `dark:bg-blue-900`
- Interactive selected: `dark:bg-blue-800`

### Text Colors

**Light mode**:
- Primary text: `text-slate-800`
- Secondary text: `text-slate-600`
- Tertiary text: `text-slate-500`
- Interactive text: `text-blue-700`

**Dark mode**:
- Primary text: `dark:text-slate-100`
- Secondary text: `dark:text-slate-400`
- Tertiary text: `dark:text-slate-500`
- Interactive text: `dark:text-blue-200`

### Border Colors

```tsx
// Neutral borders
className="border-slate-300 dark:border-slate-600"

// Interactive borders
className="border-blue-300 dark:border-blue-600"
```

### State Colors

**Success** (correct answers):
- Background: `bg-green-100` / `dark:bg-green-900`
- Border: `border-green-500` / `dark:border-green-600`
- Text: `text-green-800` / `dark:text-green-200`

**Error** (incorrect answers):
- Background: `bg-red-100` / `dark:bg-red-900`
- Border: `border-red-500` / `dark:border-red-600`
- Text: `text-red-800` / `dark:text-red-200`

**Warning**:
- Background: `bg-yellow-100` / `dark:bg-yellow-900`
- Border: `border-yellow-500` / `dark:border-yellow-600`
- Text: `text-yellow-800` / `dark:text-yellow-200`

---

## Components

### Headers

**Page Header Pattern**:
```tsx
<div className="flex justify-between items-center mb-4 md:mb-6">
  <h1 className="text-lg md:text-2xl font-semibold text-slate-800 dark:text-slate-100">
    Page Title
  </h1>
  <div className="flex gap-2">
    {/* Action buttons */}
  </div>
</div>
```

**Key principles**:
- Keep headers minimal (remove unnecessary info)
- Use `justify-between` for title and actions
- Small gap between action buttons (`gap-2`)
- Use smaller buttons (`size="sm"`)

### Buttons

**Primary Button**:
```tsx
<Button
  variant="outline"
  size="sm"
  className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
>
  Action
</Button>
```

**Button Sizing**:
- Mobile: Use `size="sm"` for most buttons
- Keep all buttons on same line when possible
- No full-width buttons unless truly necessary

### Cards

**Standard Card**:
```tsx
<Card className="max-w-3xl mx-auto mb-4 md:mb-6">
  <CardHeader className="pb-2 md:pb-3">
    <CardTitle className="text-base md:text-lg">
      Card Title
    </CardTitle>
  </CardHeader>
  <CardContent className="px-3 md:px-6">
    {/* Content */}
  </CardContent>
</Card>
```

**Card padding**:
- Reduce padding on mobile: `px-3 md:px-6`
- Reduce header padding: `pb-2 md:pb-3`
- Reduce margins: `mb-4 md:mb-6`

### Interactive Elements

**Answer Options / List Items**:
```tsx
<div className="space-y-2 md:space-y-3">
  <div className="p-3 md:p-4 rounded-lg border-2 border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200 cursor-pointer outline-none focus:outline-none">
    Item content
  </div>
</div>
```

**Key patterns**:
- Reduce padding on mobile: `p-3 md:p-4`
- Reduce spacing: `space-y-2 md:space-y-3`
- Remove hover effects on mobile (causes focus issues)
- Use `outline-none focus:outline-none` to prevent focus rings
- Add `tabIndex={-1}` to prevent keyboard focus on divs

### Badges

```tsx
<Badge variant="secondary" className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-1">
  Label Text
</Badge>
```

**Badge layout** (multiple badges):
```tsx
<div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
  <Badge>Category</Badge>
  <Badge>Difficulty</Badge>
</div>
```

### Grid Layouts

**Team/Card Grids**:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
  {/* Grid items */}
</div>
```

**Progressive columns**:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns

---

## Mobile-Specific Patterns

### 1. Stack Elements Vertically

```tsx
// Desktop: horizontal layout
// Mobile: vertical stack
className="flex flex-col sm:flex-row"
```

### 2. Reduce Visual Density

- Smaller text sizes
- Tighter spacing
- Remove non-essential info

### 3. Touch-Friendly Targets

- Minimum 44px height for interactive elements
- Adequate padding around touch areas
- Clear visual separation between items

### 4. No Hover States on Mobile

**Don't**:
```tsx
className="hover:bg-blue-100"  // Can cause focus issues
```

**Do**:
```tsx
// Desktop only hover
className="md:hover:bg-blue-100"
```

### 5. Remove Focus Persistence

For clickable divs that aren't buttons:
```tsx
<div
  onClick={handleClick}
  className="outline-none focus:outline-none"
  tabIndex={-1}
>
```

---

## Dark Mode

Always include dark mode variants:

```tsx
className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
```

**Standard pattern**:
1. Light mode class first
2. Dark mode variant with `dark:` prefix
3. Apply to background, text, and borders

---

## Accessibility

### Touch Targets
- Minimum 44x44px for interactive elements
- Adequate spacing between touch areas

### Text Readability
- Minimum `text-sm` on mobile
- Sufficient contrast ratios (WCAG AA)
- No text smaller than `text-xs`

### Focus Management
- Remove focus outlines on divs: `outline-none focus:outline-none`
- Keep focus visible on keyboard navigation (buttons)
- Use `tabIndex={-1}` on non-button clickable elements

### Semantic HTML
- Use proper heading hierarchy (h1, h2, h3)
- Use semantic elements where appropriate
- Maintain ARIA labels on interactive elements

---

## Anti-Patterns (Don't Do This)

### ❌ Full-Width Buttons on Mobile
```tsx
// Bad
<Button className="w-full sm:w-auto">
```

Keep buttons compact and on the same line.

### ❌ Blue Default Backgrounds
Original had `bg-blue-50` everywhere, making it hard to distinguish selected items. Use neutral backgrounds by default.

### ❌ Excessive Information
```tsx
// Bad - too much info on mobile
<h1>Game Room</h1>
<p>Game ID: {id} - {name}</p>
<span>Status: {status}</span>
```

```tsx
// Good - essential info only
<h1>{name}</h1>
```

### ❌ Hover Effects Without Testing
Hover states can cause focus persistence on mobile Safari. Test thoroughly or avoid on mobile.

### ❌ Fixed Large Spacing
```tsx
// Bad
className="p-8 mb-6 gap-4"
```

```tsx
// Good - responsive
className="p-4 md:p-6 lg:p-8 mb-4 md:mb-6 gap-2 md:gap-3"
```

---

## Implementation Checklist

When creating a new page or component:

- [ ] Start with mobile design (base classes)
- [ ] Add tablet breakpoints (`sm:`, `md:`)
- [ ] Add desktop breakpoints (`lg:`)
- [ ] Include dark mode variants (`dark:`)
- [ ] Test at 375px, 640px, 1024px widths
- [ ] Verify touch targets are minimum 44px
- [ ] Remove unnecessary information
- [ ] Use progressive spacing (smaller → larger)
- [ ] Test on actual mobile device
- [ ] Verify no horizontal scrolling
- [ ] Test dark mode at all breakpoints

---

## File Reference

**Components modified in mobile responsive implementation**:
- `src/pages/GamePage.tsx` - Page header pattern
- `src/components/games/RoundPlayDisplay.tsx` - Card and interactive elements
- `src/components/games/TeamDisplay.tsx` - Grid layouts
- `src/components/games/states/GameStart.tsx` - Simple header

**Testing checklist**:
- `docs/testing/mobile-responsive-checklist.md`

---

## Quick Reference

### Common Patterns

**Page Container**:
```tsx
<div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6 lg:p-8">
  <div className="max-w-6xl mx-auto">
    {/* Content */}
  </div>
</div>
```

**Header**:
```tsx
<div className="flex justify-between items-center mb-4 md:mb-6">
  <h1 className="text-lg md:text-2xl font-semibold text-slate-800 dark:text-slate-100">
    Title
  </h1>
  <div className="flex gap-2">
    <Button size="sm">Action</Button>
  </div>
</div>
```

**Card**:
```tsx
<Card className="mb-4 md:mb-6">
  <CardHeader className="pb-2 md:pb-3">
    <CardTitle className="text-base md:text-lg">Title</CardTitle>
  </CardHeader>
  <CardContent className="px-3 md:px-6">
    Content
  </CardContent>
</Card>
```

**Grid**:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
  {items.map(item => <Card key={item.id}>...</Card>)}
</div>
```

---

## Notes

- This guide is based on actual implementation and testing
- Mobile Safari focus behavior requires special handling
- Always test on real devices, not just browser DevTools
- Dark mode is a first-class citizen, not an afterthought
- Progressive enhancement ensures graceful degradation
