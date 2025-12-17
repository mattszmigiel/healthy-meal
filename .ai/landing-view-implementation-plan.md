# View Implementation Plan: Landing / Marketing Page

## 1. Overview

The Landing / Marketing Page is the entry point for unauthenticated users visiting HealthyMeal. Its primary purpose is to present the value proposition of the application (AI-powered dietary-aware recipe adaptation) and provide clear calls to action for new and returning users to sign up or log in. The view should be clean, focused, and accessible, with a hero section and feature highlights that communicate how the application works.

## 2. View Routing

**Path**: `/`

**Route Protection**:
- If the user is already authenticated (has a valid session), they should be immediately redirected to `/recipes` to avoid confusion.
- This redirect should happen server-side in the Astro page component or via middleware.

## 3. Component Structure

```
LandingPage (Astro page: src/pages/index.astro)
├── LandingLayout (Astro layout: src/layouts/LandingLayout.astro)
│   └── Header
│       ├── Logo
│       └── AuthLinks
│           ├── Link to /login
│           └── Link to /register
└── Main Content
    ├── HeroSection
    │   ├── Headline (h1)
    │   ├── Subheadline
    │   └── CTAButtons
    │       ├── SignUpButton (primary)
    │       └── LoginButton (secondary)
    └── FeaturesSection
        ├── Feature 1: Personal Recipe Library
        ├── Feature 2: AI Modification
        └── Feature 3: Dietary Profiles
```

## 4. Component Details

### 4.1 LandingPage (Astro Page Component)

**Component Description**:
Main page component at `/src/pages/index.astro`. For now just renders the landing page layout and content.

**Main Elements**:
- Uses `LandingLayout` as wrapper
- Contains `HeroSection` and `FeaturesSection` components

**Handled Interactions**:
- None (static Astro component)

**Types**:
- No custom types needed for this component

**Props**:
- None (page component)

### 4.2 LandingLayout (Astro Layout Component)

**Component Description**:
Layout wrapper for unauthenticated pages (`/src/layouts/LandingLayout.astro`). Provides consistent structure for landing, login, register, and password reset pages. Contains minimal navigation (no authenticated user menu).

**Main Elements**:
- `<header>` with logo and auth links
- `<main>` slot for page content
- `<footer>` (optional for MVP)

**Handled Interactions**:
- None (static layout)

**Handled Validation**:
- None

**Types**:
- No custom types needed

**Props**:
```typescript
interface Props {
  title?: string; // Page title for <title> tag
}
```

### 4.3 Header Component

**Component Description**:
Simple header for the landing page with logo and authentication links. Should be clean and unobtrusive.

**Main Elements**:
- `<header>` element with `role="banner"`
- Logo/brand name (linked to `/`)
- Navigation with "Log In" and "Sign Up" links

**Handled Interactions**:
- None (links only)

**Handled Validation**:
- None

**Types**:
- No custom types needed

**Props**:
- None

**Accessibility Notes**:
- Use semantic `<header>` element
- Links should have descriptive text ("Log In", "Sign Up for Free")

### 4.4 HeroSection Component

**Component Description**:
The main hero section that presents the value proposition. Contains the headline, subheadline, and primary CTAs. This is the most important section for converting visitors.

**Main Elements**:
- `<section>` wrapper with appropriate ARIA landmark
- `<h1>` for main headline (e.g., "Adapt Any Recipe to Your Dietary Needs")
- Subheadline paragraph explaining the value proposition
- CTA button group with two buttons

**Handled Interactions**:
- Click on "Sign Up for Free" → Navigate to `/register`
- Click on "Log In" → Navigate to `/login`

**Handled Validation**:
- None

**Types**:
- No custom types needed

**Props**:
- None

**Content Guidelines**:
- **Headline**: Clear, benefit-focused statement (e.g., "Adapt Any Recipe to Your Dietary Needs with AI")
- **Subheadline**: Brief explanation (1-2 sentences) of how it works: "Set your dietary preferences, save your favorite recipes, and let AI automatically adapt them to your needs."
- **Primary CTA**: "Sign Up for Free" (prominent, primary button styling)
- **Secondary CTA**: "Log In" (less prominent, secondary/outline button styling)

**Accessibility Notes**:
- `<h1>` should be the first and only h1 on the page
- Buttons should be actual `<button>` or `<a>` elements with clear labels
- High contrast between text and background (WCAG AA minimum)

### 4.5 FeaturesSection Component

**Component Description**:
Brief section highlighting the three key features of HealthyMeal. Should be scannable and use icons or simple graphics if available.

**Main Elements**:
- `<section>` wrapper
- `<h2>` for section heading (e.g., "How It Works")
- Grid or flex container with three feature cards
- Each feature card contains:
  - Icon or graphic (optional)
  - Feature title (h3)
  - Brief description

**Handled Interactions**:
- None (informational only)

**Handled Validation**:
- None

**Types**:
- No custom types needed

**Props**:
- None (static content)

**Feature Content**:
1. **Personal Recipe Library**
   - Title: "Your Personal Recipe Library"
   - Description: "Save and organize your favorite recipes in one secure, private place."

2. **AI Modification**
   - Title: "AI-Powered Adaptation"
   - Description: "Automatically adapt recipes to match your dietary needs with one click."

3. **Dietary Profiles**
   - Title: "Custom Dietary Profiles"
   - Description: "Set your allergies, diet type, and preferences once—we'll remember them."

**Accessibility Notes**:
- Use semantic heading hierarchy (h2 for section, h3 for features)
- If using icons, ensure they have appropriate `aria-label` or are marked `aria-hidden="true"` with text labels

### 4.6 CTAButtons Component (Optional Extracted Component)

**Component Description**:
Reusable button group for Sign Up and Log In CTAs. Can be extracted if used in multiple places.

**Main Elements**:
- Container div with flexbox layout
- Two `Button` components from shadcn/ui (or `<a>` styled as buttons)

**Handled Interactions**:
- Click on "Sign Up for Free" → Navigate to `/register`
- Click on "Log In" → Navigate to `/login`

**Handled Validation**:
- None

**Types**:
- No custom types needed

**Props**:
```typescript
interface CTAButtonsProps {
  layout?: 'horizontal' | 'vertical'; // Default: horizontal
}
```

## 5. Types

Since the Landing page is primarily static content for unauthenticated users, no custom DTOs or ViewModels are required. The page does not fetch or display dynamic user data.

**Existing Types Used**:
- None (no API calls or data fetching)

**New Types Required**:
- None

## 6. State Management

The Landing page is a static marketing page with no client-side state management required. All components are Astro components (static HTML generation) with no React interactivity needed.

**Authentication Check**:
- Handled server-side in the Astro page component
- Redirects authenticated users to `/recipes` before rendering

**No Client-Side State Needed For**:
- No forms to manage
- No dynamic content to load
- No user interactions beyond navigation

## 8. User Interactions

### 8.1 Click "Sign Up for Free"

**Expected Behavior**:
- Navigate to `/register` page
- Standard link navigation (no client-side routing needed)

**Implementation**:
```astro
<a href="/register" class="btn btn-primary">Sign Up for Free</a>
```
Or using shadcn Button:
```tsx
<Button asChild>
  <a href="/register">Sign Up for Free</a>
</Button>
```

### 8.2 Click "Log In"

**Expected Behavior**:
- Navigate to `/login` page
- Standard link navigation

**Implementation**:
```astro
<a href="/login" class="btn btn-secondary">Log In</a>
```

## 9. Conditions and Validation

### 9.2 No Form Validation Required

The landing page contains no forms, so no client-side or server-side validation is needed beyond the authentication check.

## 11. Implementation Steps

### Step 1: Create LandingLayout Component

**File**: `src/layouts/LandingLayout.astro`

**Tasks**:
- Create basic layout structure with `<html>`, `<head>`, `<body>`
- Add `<header>` with logo and auth links (Log In, Sign Up)
- Add `<main>` with `<slot />` for page content
- Import global styles and Tailwind
- Set up responsive meta tags

**Acceptance Criteria**:
- Layout renders with proper HTML structure
- Logo is visible and properly styled
- Auth links are visible and styled
- Page is responsive on mobile and desktop

### Step 2: Create Landing Page Component

**File**: `src/pages/index.astro`

**Tasks**:
- Create page component using `LandingLayout`
- Add `<title>` and meta description for SEO

**Acceptance Criteria**:
- Page renders at `/` path
- Page title and meta tags are correct

### Step 3: Implement HeroSection Component

**File**: `src/components/HeroSection.astro`

**Tasks**:
- Create section with semantic HTML
- Add `<h1>` headline with compelling value proposition
- Add subheadline paragraph
- Add two CTA buttons (Sign Up, Log In) with proper styling
- Style with Tailwind CSS for visual hierarchy
- Ensure responsive design (stack buttons on mobile)

**Acceptance Criteria**:
- Hero section is visually prominent
- Headline uses `<h1>` and is the only h1 on page
- CTAs are clear and properly styled (primary vs secondary)
- Section is responsive and looks good on all screen sizes
- High contrast for accessibility (WCAG AA)

### Step 4: Implement FeaturesSection Component

**File**: `src/components/FeaturesSection.astro`

**Tasks**:
- Create section with `<h2>` heading
- Add grid/flex container for three feature cards
- Create feature cards with title and description
- Style with Tailwind CSS
- Ensure responsive layout (1 column on mobile, 3 on desktop)

**Acceptance Criteria**:
- Section displays three distinct features
- Features are easy to scan and understand
- Proper heading hierarchy (h2 for section, h3 for features)
- Responsive grid layout works on all screen sizes

### Step 5: Style and Polish

**Tasks**:
- Apply consistent Tailwind styling across all components
- Ensure color scheme matches brand (use CSS variables from Tailwind config)
- Test responsive design on multiple screen sizes
- Verify accessibility (heading hierarchy, contrast, semantic HTML)
- Add subtle animations/transitions if appropriate (optional)

**Acceptance Criteria**:
- Consistent visual design throughout
- All text is readable (proper contrast)
- Page is fully responsive
- No layout shifts or broken styling

### Step 7: Accessibility Audit

**Tasks**:
- Verify semantic HTML usage (`<header>`, `<main>`, `<section>`, etc.)
- Check heading hierarchy (single h1, proper h2/h3 usage)
- Test keyboard navigation (Tab through all links/buttons)
- Test with screen reader (VoiceOver, NVDA, or JAWS)
- Verify WCAG AA contrast ratios
- Ensure descriptive link text (no "click here")

**Acceptance Criteria**:
- All interactive elements are keyboard accessible
- Screen reader announces content correctly
- Contrast ratios meet WCAG AA standards
- Semantic HTML is used throughout