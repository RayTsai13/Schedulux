# Schedulux 1.0 Design Language: "The Editorial Earth"

**Stitch Project:** `projects/17382833909498924302` ("Schedulux 1.0 UI")
**Creative North Star:** "The Modern Naturalist"

The design rejects clinical SaaS aesthetics in favor of a grounded, editorial experience — a high-end local publication feel. Prioritizes intentional asymmetry, tonal layering, and quiet authority.

---

## 1. Color System (Material Design 3, 50+ tokens)

### Primary — Deep Forest Green
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#003527` | CTAs, headlines, nav active states |
| `primary-container` | `#064e3b` | Hover states, gradient endpoints |
| `primary-fixed` | `#b0f0d6` | Light accents, badges |
| `primary-fixed-dim` | `#95d3ba` | Muted accents, inverse primary |
| `on-primary` | `#ffffff` | Text on primary backgrounds |

### Secondary — Muted Sage
| Token | Hex | Usage |
|-------|-----|-------|
| `secondary` | `#516445` | Secondary actions, supporting text |
| `secondary-container` | `#d0e7c0` | Secondary button backgrounds, tags |
| `secondary-fixed` | `#d3e9c3` | Chip selections, subtle highlights |

### Tertiary — Warm Brown
| Token | Hex | Usage |
|-------|-----|-------|
| `tertiary` | `#472510` | Warm accents, icons, underlines |
| `tertiary-container` | `#613b24` | Accent containers |
| `tertiary-fixed` | `#ffdbc9` | Warm highlight surfaces |

### Surface & Background Hierarchy
| Token | Hex | Role |
|-------|-----|------|
| `surface` / `background` | `#fbf9f5` | Main page body (warm off-white) |
| `surface-container-low` | `#f5f3ef` | Subtle content grouping |
| `surface-container` | `#efeeea` | Mid-level containers |
| `surface-container-high` | `#eae8e4` | Elevated containers |
| `surface-container-highest` | `#e4e2de` | Highest-priority containers |
| `surface-container-lowest` | `#ffffff` | "Pop" cards on muted backgrounds |
| `surface-dim` | `#dbdad6` | Backgrounds for card lift effect |
| `inverse-surface` | `#30312e` | Dark mode / inverse panels |

### Semantic / Status
| Token | Hex |
|-------|-----|
| `error` | `#ba1a1a` |
| `error-container` | `#ffdad6` |
| `on-surface` | `#1b1c1a` (never pure black) |
| `on-surface-variant` | `#404944` |
| `outline` | `#707974` |
| `outline-variant` | `#bfc9c3` (ghost borders at 15% opacity) |

### Signature Gradient
Linear gradient from `primary` (#003527) → `primary-container` (#064e3b). Used on hero CTAs and primary action areas.

---

## 2. Typography

### Dual-Typeface System
| Role | Font | Usage |
|------|------|-------|
| Display & Headlines | **Epilogue** | h1, h2, h3, page titles, hero text |
| Body & Labels | **Manrope** | Body copy, labels, UI text, metadata, nav |

### Type Scale
- `display-lg`: 3.5rem, letter-spacing -0.02em — hero headlines
- `headline-lg`: Section titles in `primary` (#003527)
- `headline-md`: Page titles
- `body-lg`: 1rem — standard body text
- `label-md`: UI labels in `on-surface-variant`
- `label-sm`: Wide tracking, premium airy labels

**Rule:** Never use pure `#000000`. All text uses `on-surface` (#1b1c1a).

---

## 3. Spacing Scale (factor 3)

| Token | Value | Usage |
|-------|-------|-------|
| `spacing-2` | 0.5rem | Inline gaps, list item separation |
| `spacing-4` | 1.25rem | Component internal padding |
| `spacing-6` | 2rem | Card internal gutters |
| `spacing-8` | 2.75rem | Section dividers (replaces lines) |
| `spacing-10` | 3.5rem | Breathing rooms |
| `spacing-16` | 5.5rem | Major page section gaps |
| `spacing-20` | 7rem | Hero-to-content separation |

**Grid:** 12-column CSS grid, 1.5rem gaps. Asymmetric layouts encouraged.

---

## 4. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `DEFAULT` | 0.125rem | Minimal rounding |
| `lg` | 0.25rem | Standard cards |
| `xl` | 0.5rem | Prominent containers |
| `full` | 0.75rem | Buttons, pronounced curves |

Chips/pills: `rounded-full` for organic stone-like feel.

---

## 5. Elevation & Depth

### "No Border" Rule
1px solid borders are **strictly prohibited** for sectioning. Boundaries via background color shifts only.

### Tonal Layering
`surface-container-lowest` (#fff) cards on `surface-container-low` (#f5f3ef) backgrounds = natural lift without shadows.

### Ambient Shadow (floating elements only)
```css
box-shadow: 0 20px 40px rgba(27, 28, 26, 0.05);
```

### Frosted Glass Effect
```css
.glass-effect {
  backdrop-filter: blur(12px);
  background-color: rgba(255, 255, 255, 0.8);
}
```
Used on navigation bars and floating actions.

### Ghost Border (accessibility fallback only)
`outline-variant` (#bfc9c3) at 15% opacity.

---

## 6. Component Patterns

### Buttons
| Variant | Style |
|---------|-------|
| Primary | `primary` (#003527) bg, white text, `rounded-md`. Hover → `primary-container` |
| Secondary | `secondary-container` (#d0e7c0) bg, `on-secondary-container` text. No border |
| Tertiary | Text-only `tertiary` (#472510). Underline on hover via 2px `tertiary-fixed` offset |

### Cards
- Background: `surface-container-lowest` (#fff)
- No divider lines — `spacing-8` separates sections
- Generous padding (`spacing-6` / 2rem)
- Contains: hero image, badges, title (Epilogue), location icon, rating, description, category tag, action link

### Inputs
- Background: `surface-container-low` (#f5f3ef)
- No border — 2px bottom-border `outline-variant`, animates to `primary` on focus
- Label: `label-md` (Manrope) in `on-surface-variant`

### Status Badges
- Pending, Confirmed, Completed — semantic coloring with surface tints
- Simple text labels, no heavy borders

### Navigation
- **Top nav:** Logo + text links + "Join us" CTA
- **Vendor sidebar:** Icon + label pairs (Dashboard, Analytics, etc.)
- **Mobile bottom bar:** 5-icon footer (Home, Metrics, Schedule, Account)
- Frosted glass on floating navs

### Calendar Grid
- 7-column day structure (Mon-Sun)
- Time slot cards in cells (time + service + client)
- Chevron month nav with "Today" center button
- Confirmed/Pending count badges

### Appointment Cards
- Avatar, title, credential subtitle
- Status badge
- Icon-labeled metadata rows (date, time, location)
- Action buttons: Reschedule, View Details

### Storefront Profile
- Verification badge
- Hero image + tagline
- Metrics row: Score, Response Time, Est. year
- Tabs: Drops | Services | Regular Hours | Journal
- Methodology sections with Material icon prefixes

---

## 7. Iconography

**Material Symbols Outlined:**
```css
font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
```
Outlined, 24px optical size, no fill.

---

## 8. Screen Reference Files

| File | Screen |
|------|--------|
| `screens/landing-page.html` | Landing Page — hero, features, testimonials, footer |
| `screens/login.html` | Login — auth form, editorial layout |
| `screens/business-onboarding.html` | Business Onboarding — multi-step vendor setup |
| `screens/vendor-dashboard-1.html` | Vendor Dashboard (variant 1) — metrics, revenue, events |
| `screens/vendor-dashboard-2.html` | Vendor Dashboard (variant 2) — alternate layout |
| `screens/vendor-storefront-detail-1.html` | Storefront Detail (variant 1) — profile, tabs, methodology |
| `screens/vendor-storefront-detail-2.html` | Storefront Detail (variant 2) — alternate layout |
| `screens/vendor-calendar-1.html` | Vendor Calendar (variant 1) — monthly grid, slots |
| `screens/vendor-calendar-2.html` | Vendor Calendar (variant 2) — alternate layout |
| `screens/my-appointments-1.html` | My Appointments (variant 1) — cards, stats, actions |
| `screens/my-appointments-2.html` | My Appointments (variant 2) — alternate layout |
| `screens/local-marketplace.html` | Local Marketplace — search, filters, card grid |
| `screens/community-resources.html` | Community Resources — content hub |

---

## 9. Do's and Don'ts

### Do
- Embrace generous white space (`spacing-16`+ between major sections)
- Use asymmetrical layouts for editorial feel
- Use `tertiary` (#472510) for warm accents (icons, underlines)
- Use background color shifts to define boundaries

### Don't
- Use 1px solid borders for sectioning
- Use pure black (#000000) — always `on-surface` (#1b1c1a)
- Crowd edges — increase padding rather than shrink text
- Use traditional drop shadows — tonal layering instead
