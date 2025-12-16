### 4.1 Global Navigation (Authenticated Views)

Displayed on `/recipes*` and `/profile` (not on auth or marketing):

- **Header (top)**:
  - Left:
    - App logo / name → `/recipes`.
  - Center (optional on small screens):
    - Nav links:
      - “Recipes” → `/recipes`.
      - “Profile” → `/profile`.
  - Right:
    - User menu (dropdown):
      - Display user email or avatar icon.
      - Menu items:
        - “Profile” → `/profile`.
        - “Logout” → signs out and redirects to `/`.
- **Mobile**:
  - Hamburger icon toggles a slide-out nav:
    - Links to Recipes, Profile, Logout.

### 5.1 Navigation Header

- Appears on all authenticated views.
- Contains:
  - Logo link.
  - Nav links (“Recipes”, “Profile”).
  - User menu (email, logout).
- Accessibility:
  - `<nav role="navigation">` with skip-to-content link for screen readers and keyboard users.

Related requirements FR-029–FR-032, US-020, US-022–US-026