# Schedulux Design System: "The Editorial Earth"

**Source of truth:** `frontend/src/styles/tokens.css` (CSS variables), mapped to Tailwind in `frontend/tailwind.config.js`. Use token classes only — never Tailwind palette colors (see `.claude/rules/frontend.md`).
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
| Primary | `bg-primary text-on-primary`, `rounded-md`. Hover → `bg-primary-container` |
| Secondary | `bg-secondary-container text-on-secondary-container`. No border |
| Tertiary | Text-only `text-primary`, underline on hover |
| `UniversalButton` | Shared pill button (`components/universal/`) used in modals and forms |

### Cards
- Background `surface-container-lowest`, no divider lines; separate sections with spacing
- Soft ambient shadow only on floating cards (`0 20px 40px rgba(27,28,26,0.05)`)

### Inputs
- `surface-container-lowest` or `surface` background, `outline-variant` border, `ring-primary` on focus
- Labels in `on-surface` (required marked with `text-error *`); errors below in `text-error text-xs`

### Status badges
Follow `STATUS_CFG` in `pages/vendor/VendorAppointmentsPage.tsx`:
pending → `tertiary-fixed`, confirmed → `secondary-container`, completed → `secondary-fixed`, cancelled → `error-container`, declined → `surface-container-high`.

### Drops
- Drop cards and the drop hero use `bg-tertiary-fixed text-on-tertiary-fixed`
- `SpotsMeter` (`components/public/SpotsMeter.tsx`): "N of M left" + bar. `primary` normally, `tertiary` at ≤25% left ("Almost gone"), `error` when sold out

### Public page (`/@slug`)
- Centered single column (max-w-3xl): avatar/initial, name, @handle, bio, location, Instagram, primary "Book" CTA
- Then Drops (with spot meters), then Services (rows with duration and price)
- Minimal chrome: `PublicPageShell` with a small "Booking by Schedulux" footer; it's the vendor's link-in-bio

### Navigation
- **Landing / playground:** frosted-glass top nav (`backdrop-blur-glass`, `--glass-bg`)
- **Vendor sidebar:** icon + label (Overview, Drops, Services, Hours, Appointments, Calendar, Customers, Page Settings) and a "New Drop" CTA
- **Mobile bottom bar:** Home, Drops, Bookings, Clients

### Playground timeline
- One bar per rule/drop layer, a bookings bar, then the resolved bar labeled by the winning layer
- Open → `secondary-container`, closure/booked → `error-container`, drop → `tertiary-fixed`

---

## 7. Iconography

**Material Symbols Outlined:**
```css
font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
```
Outlined, 24px optical size, no fill.

---

## 8. Do's and Don'ts

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
