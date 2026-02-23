# 🎨 V3 Design System (Desktop-First)

## Design Philosophy
**Desktop-First, Web-Native Patterns**
- Build for desktop screens (1024px+) as the primary experience
- Use standard web UI patterns (modals, sidebars, multi-column layouts)
- Scale down gracefully to tablet (768px) and mobile (375px)
- Avoid mobile-specific patterns that don't translate to desktop
- Future iOS app will be a separate native implementation

## 1. Layout Structure
*   **AppScaffold:** The main container with responsive scaling
    *   Desktop (1024px+): Full width with max-w-7xl, centered
    *   Tablet (768px): Narrower columns, stacked content
    *   Mobile (375px): Single column, full width
*   **Navigation:** Persistent top navbar (not bottom tabs)
*   **Content Areas:** Multi-column grids on desktop, single column on mobile

## 2. Component Library (The Atoms)

### A. Modal/Dialog
*   **Pattern:** Standard web modal (centered overlay)
*   **Usage:** Complex interactions (Booking, Editing, Confirmations)
*   **Behavior:** Backdrop blur, escape to close, click outside to dismiss
*   **Responsive:** Full-screen on mobile, centered card on desktop

### B. The Card (UniversalCard)
*   **Style:** `bg-v3-surface rounded-3xl border border-v3-border shadow-sm`
*   **Usage:** Content containers, service cards, availability windows
*   **Variants:** Default (with padding), No padding (for images), Hoverable

### C. Buttons (UniversalButton)
*   **Variants:**
    *   Primary: Solid indigo background
    *   Secondary: Gray background
    *   Outline: Border only
    *   Ghost: Transparent, hover effect
*   **Sizes:** Small (sm), Medium (md), Large (lg)
*   **States:** Default, Hover, Loading (spinner), Disabled

### D. Typography
*   **Font:** System font stack (`font-sans`) - inherits from user's OS
*   **Scale:**
    *   Hero: `text-6xl font-bold` (vendor names, hero sections)
    *   Heading: `text-4xl font-bold` (page titles)
    *   Subheading: `text-2xl font-semibold` (section headers)
    *   Body: `text-lg` (descriptions, content)
    *   Label: `text-sm font-medium` (form labels, captions)

## 3. Color System (V3 Palette)
Semantic colors defined in `tailwind.config.js`:

*   `v3-background`: App background (#fafafa - light gray)
*   `v3-surface`: Card/container background (#ffffff - pure white)
*   `v3-border`: Border color (zinc-200)
*   `v3-primary`: Primary text (#18181b - zinc-900)
*   `v3-secondary`: Muted text (#71717a - zinc-500)
*   `v3-accent`: Brand color (#6366f1 - indigo-500)

**Usage:**
- High contrast for readability
- Generous white space
- Large rounded corners (rounded-3xl = 24px)
- Subtle shadows for depth