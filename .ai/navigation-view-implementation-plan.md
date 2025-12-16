# View Implementation Plan - Global Navigation

## 1. Overview

The Global Navigation is a persistent header component that appears on all authenticated views (routes starting with `/recipes*` and `/profile`). It provides primary navigation between main sections of the application, displays user information, and offers logout functionality. The component must be responsive, accessible, and support both desktop and mobile experiences with a hamburger menu for smaller screens.

## 2. View Routing

The Global Navigation component is not a standalone view but a shared layout component that should be:
- Included in the main authenticated layout (e.g., `src/layouts/AuthenticatedLayout.astro`)
- Displayed on all routes matching `/recipes*` and `/profile`
- Not displayed on authentication pages (`/login`, `/register`, `/forgot-password`) or marketing pages

## 3. Component Structure

```
AuthenticatedLayout.astro (Astro layout)
└── GlobalNavigation.tsx (React component)
    ├── DesktopNavigation (React component)
    │   ├── Logo
    │   ├── NavLinks
    │   │   ├── RecipesLink
    │   │   └── ProfileLink
    │   └── UserMenu (React component)
    │       ├── UserMenuTrigger
    │       └── UserMenuDropdown
    │           ├── ProfileMenuItem
    │           └── LogoutMenuItem
    └── MobileNavigation (React component)
        ├── Logo
        ├── HamburgerButton
        └── MobileMenu (React component - slide-out)
            ├── NavLinks
            │   ├── RecipesLink
            │   └── ProfileLink
            └── LogoutButton
```

## 4. Component Details

### GlobalNavigation (Main Container)
- **Component description**: Top-level navigation component that conditionally renders desktop or mobile navigation based on screen size. Acts as the primary navigation container for authenticated users.
- **Main elements**:
  - `<nav>` with `role="navigation"` and `aria-label="Global navigation"`
  - Skip-to-content link for accessibility (hidden visually, visible on focus)
  - Conditional rendering of DesktopNavigation and MobileNavigation
- **Handled interactions**:
  - Window resize detection (via media query or viewport size hook)
  - Logout action delegation to child components
- **Handled validation**: None (navigation is always available for authenticated users)
- **Types**: `GlobalNavigationProps`
- **Props**:
  - `userEmail?: string` - Email address of the authenticated user for display

### DesktopNavigation
- **Component description**: Desktop-optimized navigation layout displayed on screens wider than mobile breakpoint (typically >= 768px). Uses horizontal layout with logo, nav links, and user menu.
- **Main elements**:
  - `<div>` container with flexbox layout (justify-between)
  - Left section: Logo/brand link
  - Center section: Navigation links (Recipes, Profile)
  - Right section: UserMenu component
- **Handled interactions**: None directly (delegates to child components)
- **Handled validation**: None
- **Types**: `DesktopNavigationProps`
- **Props**:
  - `userEmail?: string` - Passed to UserMenu

### MobileNavigation
- **Component description**: Mobile-optimized navigation with hamburger menu that toggles a slide-out panel. Displayed on screens smaller than desktop breakpoint.
- **Main elements**:
  - `<div>` container with flexbox layout
  - Logo/brand link
  - Hamburger button (animates to X when open)
  - MobileMenu component (slide-out panel)
- **Handled interactions**:
  - Hamburger button click (toggles menu open/closed)
  - Overlay click (closes menu)
  - Menu item click (closes menu and navigates)
  - Escape key press (closes menu)
- **Handled validation**: None
- **Types**: `MobileNavigationProps`
- **Props**:
  - `userEmail?: string` - Passed to MobileMenu

### UserMenu (Desktop)
- **Component description**: Dropdown menu component for desktop that displays user information and provides access to profile and logout. Uses shadcn/ui DropdownMenu component.
- **Main elements**:
  - DropdownMenuTrigger: Button displaying user email or avatar icon
  - DropdownMenuContent: Menu items container
    - DropdownMenuItem: "Profile" link to `/profile`
    - DropdownMenuSeparator
    - DropdownMenuItem: "Logout" button
- **Handled interactions**:
  - Dropdown trigger click (opens/closes menu)
  - Profile menu item click (navigates to `/profile`)
  - Logout menu item click (initiates logout)
  - Click outside (closes menu)
- **Handled validation**: None
- **Types**: `UserMenuProps`
- **Props**:
  - `userEmail?: string` - User email to display in trigger

### MobileMenu
- **Component description**: Slide-out panel component for mobile navigation. Animates from the side (typically right or left) when opened, includes overlay backdrop.
- **Main elements**:
  - Overlay backdrop (`<div>` with semi-transparent background)
  - Slide-out panel (`<div>` with transform animation)
  - Navigation links list (Recipes, Profile)
  - Logout button
  - Close button (X icon)
- **Handled interactions**:
  - Navigation link click (closes menu and navigates)
  - Logout button click (initiates logout and closes menu)
  - Close button click (closes menu)
  - Overlay click (closes menu)
- **Handled validation**: None
- **Types**: `MobileMenuProps`
- **Props**:
  - `isOpen: boolean` - Controls menu visibility
  - `onClose: () => void` - Callback to close menu
  - `userEmail?: string` - User email for display

### Logo Component
- **Component description**: Reusable brand/logo component that links to the recipes list (home for authenticated users).
- **Main elements**:
  - `<a>` link to `/recipes`
  - App name text or logo image
  - Styling for brand identity
- **Handled interactions**:
  - Click (navigates to `/recipes`)
- **Handled validation**: None
- **Types**: None (simple component)
- **Props**: None

### NavLinks Component
- **Component description**: Reusable component containing the main navigation links (Recipes, Profile). Used in both desktop and mobile navigation.
- **Main elements**:
  - List of `<a>` links with active state indication
  - "Recipes" link to `/recipes`
  - "Profile" link to `/profile`
  - Active state styling (uses `aria-current="page"` for current route)
- **Handled interactions**:
  - Link clicks (navigation handled by browser/Astro routing)
- **Handled validation**: None
- **Types**: `NavLinksProps`
- **Props**:
  - `currentPath: string` - Current route path for highlighting active link
  - `orientation?: 'horizontal' | 'vertical'` - Layout orientation (horizontal for desktop, vertical for mobile)
  - `onLinkClick?: () => void` - Optional callback for mobile menu to close after navigation

## 5. Types

### Existing Types (from src/types.ts)

```typescript
// Already defined in src/types.ts
export interface GlobalNavigationProps {
  userEmail?: string;
}
```

### New Types to Add to src/types.ts

```typescript
/**
 * Props for DesktopNavigation component
 */
export interface DesktopNavigationProps {
  userEmail?: string;
  currentPath: string;
}

/**
 * Props for MobileNavigation component
 */
export interface MobileNavigationProps {
  userEmail?: string;
  currentPath: string;
}

/**
 * Props for UserMenu component (desktop dropdown)
 */
export interface UserMenuProps {
  userEmail?: string;
  onLogout: () => void;
}

/**
 * Props for MobileMenu component (slide-out panel)
 */
export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  currentPath: string;
  onLogout: () => void;
}

/**
 * Props for NavLinks component
 */
export interface NavLinksProps {
  currentPath: string;
  orientation?: 'horizontal' | 'vertical';
  onLinkClick?: () => void;
}

/**
 * State for mobile menu
 */
export interface MobileMenuState {
  isOpen: boolean;
}
```

## 6. State Management

### GlobalNavigation Component
- **Local State**: None required at this level
- **Props from Layout**: Receives `userEmail` from Astro layout (via Supabase session)
- **Current Path Detection**: Uses Astro's `Astro.url.pathname` in layout, passed as prop to React component

### MobileNavigation Component
- **Local State**:
  - `isMobileMenuOpen: boolean` - Controls slide-out menu visibility
  - Managed with `useState` hook
- **State Management Pattern**: Simple local state, no custom hook needed
- **State Actions**:
  - `openMenu()` - Sets `isMobileMenuOpen` to `true`
  - `closeMenu()` - Sets `isMobileMenuOpen` to `false`
  - `toggleMenu()` - Toggles `isMobileMenuOpen`

### UserMenu Component
- **Local State**: None required (shadcn/ui DropdownMenu manages its own open/close state)

### Custom Hooks

No custom hooks are strictly required for basic functionality. However, the following optional hooks could improve code organization:


**Optional: `useMobileMenu` Hook** (in `src/components/hooks/useMobileMenu.ts`)
```typescript
export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = useCallback(() => setIsOpen(true), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeMenu]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return { isOpen, openMenu, closeMenu, toggleMenu };
}
```

## 7. API Integration


### Session Data Access

This data is passed as a prop to the GlobalNavigation component.

## 8. User Interactions

### Desktop Navigation

1. **Logo Click**
   - User clicks on app logo/name
   - Expected outcome: Navigate to `/recipes` (home for authenticated users)
   - Implementation: Standard `<a>` tag navigation

2. **Navigation Link Click** (Recipes, Profile)
   - User clicks on "Recipes" or "Profile" link
   - Expected outcome: Navigate to respective page with active state indication
   - Implementation: Standard `<a>` tag navigation with `aria-current="page"` for active link

3. **User Menu Trigger Click**
   - User clicks on user email/avatar in header
   - Expected outcome: Dropdown menu opens showing Profile and Logout options
   - Implementation: shadcn/ui DropdownMenu component

4. **Profile Menu Item Click**
   - User clicks "Profile" in dropdown menu
   - Expected outcome: Navigate to `/profile`, menu closes
   - Implementation: `<a>` link within DropdownMenuItem

5. **Logout Menu Item Click**
   - User clicks "Logout" in dropdown menu
   - Expected outcome: NOTHING - not implemented, will be done later

6. **Click Outside User Menu**
   - User clicks outside the open dropdown menu
   - Expected outcome: Menu closes
   - Implementation: Handled automatically by shadcn/ui DropdownMenu

### Mobile Navigation

1. **Hamburger Button Click**
   - User clicks hamburger icon
   - Expected outcome: Slide-out menu opens from side with overlay backdrop, hamburger animates to X icon
   - Implementation: Button with `onClick` toggling `isOpen` state, CSS transitions for animation

2. **Mobile Menu Overlay Click**
   - User clicks on semi-transparent overlay behind menu
   - Expected outcome: Menu closes with slide-out animation
   - Implementation: `<div>` with `onClick` handler closing menu

3. **Close Button Click (X icon)**
   - User clicks X icon in mobile menu
   - Expected outcome: Menu closes
   - Implementation: Button with `onClick` handler closing menu

4. **Mobile Navigation Link Click**
   - User clicks "Recipes" or "Profile" in mobile menu
   - Expected outcome: Navigate to respective page, menu closes
   - Implementation: `<a>` link with `onClick` handler to close menu before navigation

5. **Mobile Logout Button Click**
   - User clicks "Logout" in mobile menu
   - Expected outcome: User is logged out, menu closes, redirect to `/`
   - Implementation: Button with `onClick` handler calling logout API, closing menu, then redirect

6. **Escape Key Press** (when mobile menu is open)
   - User presses Escape key
   - Expected outcome: Menu closes
   - Implementation: `useEffect` hook listening for `keydown` event

### Accessibility Interactions

1. **Skip to Content Link**
   - Keyboard user presses Tab on page load
   - Expected outcome: Skip link becomes visible, pressing Enter jumps to main content
   - Implementation: Visually hidden link that appears on focus, targets `#main-content`

2. **Keyboard Navigation Through Menu**
   - User navigates using Tab/Shift+Tab
   - Expected outcome: Focus moves through logo, nav links, user menu trigger in logical order
   - Implementation: Proper DOM order and focusable elements with `:focus-visible` styles

## 9. Conditions and Validation

### Active Route Indication

**Condition**: Current path matches navigation link
- **Components Affected**: NavLinks
- **Interface Impact**:
  - Active link receives different styling (e.g., bold, different color, underline)
  - `aria-current="page"` attribute set on active link
- **Validation**: None required, visual indication only
- **Implementation**:
  ```typescript
  <a
    href="/recipes"
    aria-current={currentPath === '/recipes' ? 'page' : undefined}
    className={currentPath === '/recipes' ? 'active' : ''}
  >
    Recipes
  </a>
  ```

### Mobile Menu State

**Condition**: Mobile menu is open
- **Components Affected**: MobileNavigation, MobileMenu
- **Interface Impact**:
  - When open: Body scroll disabled, overlay visible, menu panel visible and slid into view, hamburger icon animates to X
  - When closed: Body scroll enabled, overlay hidden, menu panel hidden and slid out of view, X icon animates to hamburger
- **Validation**: None required, purely UI state
- **Implementation**: Controlled by `isOpen` state variable

### Authentication State

**Condition**: User is authenticated (implicit - layout only renders for authenticated routes)
- **Components Affected**: GlobalNavigation (entire component)
- **Interface Impact**: Navigation is only rendered on authenticated routes
- **Validation**: Handled at layout/middleware level, not in component
- **Implementation**: Component assumes user is authenticated when rendered

## 10. Error Handling

### Missing User Email

**Scenario**: User session exists but email is not available in session data

**Handling Strategy**:
1. Display fallback text ("User") or avatar icon without text
2. Navigation functionality remains intact
3. No error message needed (graceful degradation)

**Implementation**:
```typescript
const displayName = userEmail ?? 'User';
// Or show only avatar icon without text
```

### Mobile Menu Focus Trap Issues

**Scenario**: Focus escapes mobile menu when open, or focus lost when menu closes

**Handling Strategy**:
1. Implement focus trap within mobile menu when open
2. Return focus to hamburger button when menu closes
3. Use `useEffect` to manage focus

**Implementation**:
```typescript
const hamburgerRef = useRef<HTMLButtonElement>(null);
const menuRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (isOpen && menuRef.current) {
    // Focus first focusable element in menu
    const firstFocusable = menuRef.current.querySelector('a, button');
    (firstFocusable as HTMLElement)?.focus();
  } else if (!isOpen && hamburgerRef.current) {
    // Return focus to hamburger button
    hamburgerRef.current.focus();
  }
}, [isOpen]);
```

## 11. Implementation Steps

### Step 1: Install Required shadcn/ui Components
```bash
npx shadcn@latest add dropdown-menu
npx shadcn@latest add button
npx shadcn@latest add separator
```

### Step 2: Add New Type Definitions
1. Open `src/types.ts`
2. Add the new type definitions listed in Section 5 (DesktopNavigationProps, MobileNavigationProps, UserMenuProps, MobileMenuProps, NavLinksProps, MobileMenuState)
3. Verify existing `GlobalNavigationProps` is already defined

### Step 3: Create Custom Hooks (Optional)
2. Create `src/components/hooks/useMobileMenu.ts` with mobile menu state management
3. Export both hooks from `src/components/hooks/index.ts` if it exists

### Step 4: Create Utility Components

**4.1 Create Logo Component**
1. Create `src/components/navigation/Logo.tsx`
2. Implement simple link component to `/recipes`
3. Add app branding (text or image)
4. Style with Tailwind CSS

**4.2 Create NavLinks Component**
1. Create `src/components/navigation/NavLinks.tsx`
2. Accept `currentPath`, `orientation`, and `onLinkClick` props
3. Render links to Recipes and Profile
4. Add active state styling with `aria-current="page"`
5. Handle orientation (horizontal/vertical) with Tailwind classes
6. Call `onLinkClick` when links are clicked (for mobile menu close)

### Step 5: Create Desktop Navigation Components

**5.1 Create UserMenu Component**
1. Create `src/components/navigation/UserMenu.tsx`
2. Import shadcn/ui DropdownMenu components
3. Implement trigger button with user email or avatar
4. Add dropdown menu items: Profile link, separator, Logout button
5. Implement logout handler using `useLogout` hook or inline logic
6. Add proper ARIA attributes

**5.2 Create DesktopNavigation Component**
1. Create `src/components/navigation/DesktopNavigation.tsx`
2. Create horizontal flexbox layout with three sections (left, center, right)
3. Add Logo component to left section
4. Add NavLinks component to center section with `orientation="horizontal"`
5. Add UserMenu component to right section
6. Pass `currentPath` and `userEmail` props appropriately
7. Style with Tailwind CSS for desktop breakpoint and above

### Step 6: Create Mobile Navigation Components

**6.1 Create MobileMenu Component**
1. Create `src/components/navigation/MobileMenu.tsx`
2. Accept `isOpen`, `onClose`, `userEmail`, `currentPath`, `onLogout` props
3. Create overlay backdrop that calls `onClose` on click
4. Create slide-out panel with transform animation
5. Add close button (X icon) in panel header
6. Add NavLinks component with `orientation="vertical"` and `onLinkClick={onClose}`
7. Add Logout button calling `onLogout` and `onClose`
8. Style with Tailwind CSS for animations and mobile breakpoint
9. Add focus trap and Escape key listener

**6.2 Create MobileNavigation Component**
1. Create `src/components/navigation/MobileNavigation.tsx`
2. Use `useMobileMenu` hook or `useState` for menu state
3. Create horizontal layout with Logo and hamburger button
4. Implement hamburger button with animation to X icon
5. Render MobileMenu component with state props
6. Implement logout handler
7. Style with Tailwind CSS for mobile breakpoint only

### Step 7: Create Main GlobalNavigation Component
1. Create `src/components/navigation/GlobalNavigation.tsx`
2. Accept `userEmail` prop
3. Get current path from props (will be passed from Astro layout)
4. Add skip-to-content link for accessibility
5. Render DesktopNavigation and MobileNavigation components
6. Use Tailwind responsive utilities to show/hide desktop vs mobile navigation
7. Add `<nav role="navigation">` wrapper with `aria-label`

### Step 8: Create or Update Authenticated Layout
1. Create or update `src/layouts/AuthenticatedLayout.astro`
4. Get current path from `Astro.url.pathname`
5. Import and render GlobalNavigation component with `client:load` directive
6. Pass dummy `userEmail` and `currentPath` as props
7. Add `<main id="main-content">` for skip link target
8. Add slot for page content

### Step 9: Style and Accessibility Polish
1. Add focus-visible styles for all interactive elements
2. Ensure color contrast meets WCAG AA standards
3. Test keyboard navigation through all menu items
4. Add smooth transitions for mobile menu slide animation
5. Test hamburger to X icon animation
6. Ensure active link styling is clear and distinguishable
7. Add hover states for all links and buttons

### Step 13: Integration with Existing Pages
1. Apply AuthenticatedLayout to `/recipes*` pages
2. Apply AuthenticatedLayout to `/profile` page

### Step 15: Performance Optimization
1. Add `React.memo()` to stable components (Logo, NavLinks if props stable)
2. Use `useCallback` for event handlers passed to children
3. Verify mobile menu doesn't cause layout shifts
4. Test navigation rendering performance (React DevTools Profiler)
5. Minimize bundle size (verify no unnecessary dependencies)