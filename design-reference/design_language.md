Schedulux 1.0 Design Language: "The Editorial Earth"
                                                                                          
  Creative North Star: "The Modern Naturalist"
                                                                                          
  The design rejects clinical SaaS aesthetics in favor of a grounded, editorial experience
   that feels like a high-end local publication or bespoke field guide. It prioritizes    
  intentional asymmetry, tonal layering, and an atmosphere of quiet authority and         
  community trust.

  ---                                                                                     
  1. Color System (Material Design 3, 50+ tokens)
                                                                                          
  Primary Palette — Deep Forest Green
                                                                                          
  ┌───────────────────┬─────────┬───────────────────────────────────────────┐             
  │       Token       │   Hex   │                   Usage                   │
  ├───────────────────┼─────────┼───────────────────────────────────────────┤             
  │ primary           │ #003527 │ CTAs, headlines, navigation active states │
  ├───────────────────┼─────────┼───────────────────────────────────────────┤
  │ primary-container │ #064e3b │ Hover states, gradient endpoints          │             
  ├───────────────────┼─────────┼───────────────────────────────────────────┤             
  │ primary-fixed     │ #b0f0d6 │ Light accents, badges                     │             
  ├───────────────────┼─────────┼───────────────────────────────────────────┤             
  │ primary-fixed-dim │ #95d3ba │ Muted accents, inverse primary            │
  ├───────────────────┼─────────┼───────────────────────────────────────────┤             
  │ on-primary        │ #ffffff │ Text on primary backgrounds               │
  └───────────────────┴─────────┴───────────────────────────────────────────┘             
                  
  Secondary Palette — Muted Sage                                                          
                  
  ┌─────────────────────┬─────────┬────────────────────────────────────┐                  
  │        Token        │   Hex   │               Usage                │
  ├─────────────────────┼─────────┼────────────────────────────────────┤
  │ secondary           │ #516445 │ Secondary actions, supporting text │
  ├─────────────────────┼─────────┼────────────────────────────────────┤
  │ secondary-container │ #d0e7c0 │ Secondary button backgrounds, tags │                  
  ├─────────────────────┼─────────┼────────────────────────────────────┤                  
  │ secondary-fixed     │ #d3e9c3 │ Chip selections, subtle highlights │                  
  └─────────────────────┴─────────┴────────────────────────────────────┘                  
                  
  Tertiary Palette — Warm Brown                                                           
                  
  ┌────────────────────┬─────────┬─────────────────────────────────┐                      
  │       Token        │   Hex   │              Usage              │
  ├────────────────────┼─────────┼─────────────────────────────────┤
  │ tertiary           │ #472510 │ Warm accents, icons, underlines │
  ├────────────────────┼─────────┼─────────────────────────────────┤
  │ tertiary-container │ #613b24 │ Accent containers               │                      
  ├────────────────────┼─────────┼─────────────────────────────────┤                      
  │ tertiary-fixed     │ #ffdbc9 │ Warm highlight surfaces         │                      
  └────────────────────┴─────────┴─────────────────────────────────┘                      
                  
  Surface & Background Hierarchy                                                          
                        
  ┌───────────────────────────┬─────────┬──────────────────────────────────┐              
  │           Token           │   Hex   │               Role               │              
  ├───────────────────────────┼─────────┼──────────────────────────────────┤              
  │ surface / background      │ #fbf9f5 │ Main page body (warm off-white)  │              
  ├───────────────────────────┼─────────┼──────────────────────────────────┤
  │ surface-container-low     │ #f5f3ef │ Subtle content grouping          │              
  ├───────────────────────────┼─────────┼──────────────────────────────────┤              
  │ surface-container         │ #efeeea │ Mid-level containers             │              
  ├───────────────────────────┼─────────┼──────────────────────────────────┤              
  │ surface-container-high    │ #eae8e4 │ Elevated containers              │
  ├───────────────────────────┼─────────┼──────────────────────────────────┤              
  │ surface-container-highest │ #e4e2de │ Highest-priority containers      │
  ├───────────────────────────┼─────────┼──────────────────────────────────┤              
  │ surface-container-lowest  │ #ffffff │ "Pop" cards on muted backgrounds │
  ├───────────────────────────┼─────────┼──────────────────────────────────┤              
  │ surface-dim               │ #dbdad6 │ Backgrounds for card lift effect │
  ├───────────────────────────┼─────────┼──────────────────────────────────┤              
  │ inverse-surface           │ #30312e │ Dark mode / inverse panels       │
  └───────────────────────────┴─────────┴──────────────────────────────────┘              
                  
  Semantic/Status                                                                         
                  
  ┌────────────────────┬────────────────────────────────────────┐                         
  │       Token        │                  Hex                   │
  ├────────────────────┼────────────────────────────────────────┤
  │ error              │ #ba1a1a                                │
  ├────────────────────┼────────────────────────────────────────┤
  │ error-container    │ #ffdad6                                │                         
  ├────────────────────┼────────────────────────────────────────┤                         
  │ on-surface         │ #1b1c1a (never pure black)             │                         
  ├────────────────────┼────────────────────────────────────────┤                         
  │ on-surface-variant │ #404944                                │
  ├────────────────────┼────────────────────────────────────────┤                         
  │ outline            │ #707974                                │
  ├────────────────────┼────────────────────────────────────────┤                         
  │ outline-variant    │ #bfc9c3 (ghost borders at 15% opacity) │
  └────────────────────┴────────────────────────────────────────┘                         
  
  Signature Gradient: Linear gradient from primary (#003527) to primary-container         
  (#064e3b) — mimics forest canopy depth. Used on hero CTAs and primary action areas.
                                                                                          
  ---                                                                                     
  2. Typography
                                                                                          
  Dual-typeface system:
                                                                                          
  ┌────────────────────┬──────────┬───────────────────────────────────────────────────┐   
  │        Role        │   Font   │                       Usage                       │   
  ├────────────────────┼──────────┼───────────────────────────────────────────────────┤   
  │ Display &          │ Epilogue │ h1, h2, h3, page titles, hero text, editorial     │
  │ Headlines          │          │ moments                                           │   
  ├────────────────────┼──────────┼───────────────────────────────────────────────────┤   
  │ Body & Labels      │ Manrope  │ Body copy, labels, UI text, metadata, navigation  │
  └────────────────────┴──────────┴───────────────────────────────────────────────────┘   
                  
  Type Scale:                                                                             
  - display-lg: 3.5rem, tight letter-spacing (-0.02em) — hero headlines
  - headline-lg: Section titles in primary (#003527)                                      
  - headline-md: Page titles                        
  - body-lg: 1rem — standard body text                                                    
  - label-md: UI labels in on-surface-variant                                             
  - label-sm: Wide tracking for premium, airy labels                                      
                                                                                          
  Key Rule: Never use pure #000000. All text uses on-surface (#1b1c1a) to maintain soft   
  PNW-inspired contrast.                                                                  
                                                                                          
  ---                                                                                     
  3. Spacing & Layout
                                                                                          
  Spacing Scale (factor 3):
                                                                                          
  ┌────────────┬─────────┬──────────────────────────────────────────┐                     
  │   Token    │  Value  │                  Usage                   │                     
  ├────────────┼─────────┼──────────────────────────────────────────┤                     
  │ spacing-2  │ 0.5rem  │ Inline gaps, list item separation        │
  ├────────────┼─────────┼──────────────────────────────────────────┤
  │ spacing-4  │ 1.25rem │ Component internal padding               │                     
  ├────────────┼─────────┼──────────────────────────────────────────┤                     
  │ spacing-6  │ 2rem    │ Card internal gutters                    │                     
  ├────────────┼─────────┼──────────────────────────────────────────┤                     
  │ spacing-8  │ 2.75rem │ Section dividers (replaces lines)        │
  ├────────────┼─────────┼──────────────────────────────────────────┤                     
  │ spacing-10 │ 3.5rem  │ Breathing rooms between functional areas │
  ├────────────┼─────────┼──────────────────────────────────────────┤                     
  │ spacing-16 │ 5.5rem  │ Major page section gaps                  │
  ├────────────┼─────────┼──────────────────────────────────────────┤                     
  │ spacing-20 │ 7rem    │ Hero-to-content separation               │
  └────────────┴─────────┴──────────────────────────────────────────┘                     
                  
  Grid System: 12-column CSS grid with 1.5rem gaps. Asymmetric layouts encouraged —       
  headlines left-aligned with body text offset to the right column.
                                                                                          
  ---             
  4. Border Radius
                  
  ┌─────────┬──────────┬────────────────────────────────────────────┐
  │  Token  │  Value   │                   Usage                    │                     
  ├─────────┼──────────┼────────────────────────────────────────────┤
  │ DEFAULT │ 0.125rem │ Minimal rounding (inputs, subtle elements) │                     
  ├─────────┼──────────┼────────────────────────────────────────────┤
  │ lg      │ 0.25rem  │ Standard cards                             │                     
  ├─────────┼──────────┼────────────────────────────────────────────┤                     
  │ xl      │ 0.5rem   │ Prominent containers                       │                     
  ├─────────┼──────────┼────────────────────────────────────────────┤                     
  │ full    │ 0.75rem  │ Buttons, pronounced curves                 │
  └─────────┴──────────┴────────────────────────────────────────────┘                     
  
  Chips and selection pills use rounded-full for an organic, stone-like feel.             
                  
  ---                                                                                     
  5. Elevation & Depth
                                                                                          
  "No Border" Rule: 1px solid borders are strictly prohibited for sectioning. Boundaries
  are defined through background color shifts only (e.g., surface-container-low sitting on
   surface).      
                                                                                          
  Tonal Layering: Depth is created by placing surface-container-lowest (#ffffff) cards on 
  surface-container-low (#f5f3ef) backgrounds — a natural "lift" without dirty shadows.
                                                                                          
  Ambient Shadow (floating elements only):                                                
  box-shadow: 0 20px 40px rgba(27, 28, 26, 0.05);
  5% opacity of on-surface color — mimics ambient light.                                  
                                                                                          
  Frosted Glass Effect:                                                                   
  .glass-effect {                                                                         
    backdrop-filter: blur(12px);                                                          
    background-color: rgba(255, 255, 255, 0.8);                                           
  }                                                                                       
  Used on navigation bars and floating action buttons — earthy background colors bleed    
  through.                                                                                
                                                                                          
  Ghost Border (accessibility fallback only): outline-variant (#bfc9c3) at 15% opacity.
  Felt, not seen.                                                                         
                  
  ---                                                                                     
  6. Component Patterns
                                                                                          
  Buttons:
                                                                                          
  ┌───────────┬────────────────────────────────────────────────────────────────────────┐
  │  Variant  │                                 Style                                  │
  ├───────────┼────────────────────────────────────────────────────────────────────────┤
  │ Primary   │ Background: primary (#003527), text: on-primary (#fff), rounded-md.    │
  │           │ Hover → primary-container. Signature gradient on hero CTAs             │
  ├───────────┼────────────────────────────────────────────────────────────────────────┤  
  │ Secondary │ Background: secondary-container (#d0e7c0), text:                       │
  │           │ on-secondary-container (#556849). No border                            │  
  ├───────────┼────────────────────────────────────────────────────────────────────────┤
  │ Tertiary  │ Text-only: tertiary (#472510). Underline on hover using 2px            │  
  │           │ tertiary-fixed (#ffdbc9) offset                                        │  
  └───────────┴────────────────────────────────────────────────────────────────────────┘
                                                                                          
  Cards:          
  - Background: surface-container-lowest (#ffffff)
  - No divider lines — spacing-8 separates content sections internally                    
  - Generous padding (spacing-6 / 2rem internal gutters)              
  - Contains: hero image, certification badges, title (Epilogue), location with icon, star
   rating, description, category tag, action link with arrow                              
                                                                                          
  Inputs:                                                                                 
  - Background: surface-container-low (#f5f3ef)                                           
  - No border — 2px bottom-border of outline-variant (#bfc9c3), animates to primary on    
  focus                                                                                   
  - Label: label-md (Manrope) in on-surface-variant (#404944)                             
                  
  Chips/Tags:                                                                             
  - Selection: secondary-fixed (#d3e9c3) with on-secondary-fixed (#0f2008)
  - Shape: rounded-full (stone-like)                                                      
                                    
  Status Badges:                                                                          
  - Pending, Confirmed, Completed — semantic coloring (contextual surface tints)          
  - Simple text labels, no heavy borders                                                  
                                                                                          
  Navigation:                                                                             
  - Horizontal top nav: logo + text links (Growth, Marketplace, Community, About) + "Join 
  us" CTA button                                                                          
  - Vendor sidebar: icon + label pairs (Dashboard, Analytics, Artisans, Calendar,         
  Customers)                                                                              
  - Mobile bottom bar: 5-icon footer (Home, Metrics, Schedule, Account)                   
  - Frosted glass overlay on floating navs
                                                                                          
  Calendar Grid:  
  - 7-column day structure (Mon-Sun)                                                      
  - Time slot cards embedded in cells (time + service name + client)
  - Chevron month navigation with "Today" center button             
  - Confirmed (24) / Pending (7) count badges                                             
                                                                                          
  Appointment Cards:                                                                      
  - Expert avatar, title, credential subtitle                                             
  - Status badge (PENDING/CONFIRMED)                                                      
  - Icon-labeled metadata rows (date, time, location)                                     
  - Action buttons: Reschedule, View Details                                              
                                                                                          
  Storefront Profile:                                                                     
  - Verification badge ("Verified Artisan")                                               
  - Hero image + tagline                                                                  
  - Key metrics row: Sustainability Score, Response Time, Est. year
  - Tab navigation: Drops | Services | Regular Hours | Journal                            
  - Methodology sections with Material icon prefixes (potted_plant, water_drop,           
  local_shipping)                                                                         
                                                                                          
  ---                                                                                     
  7. Iconography                                                                          
                                                                                          
  Material Symbols Outlined with consistent variation settings:
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;                     
  Outlined style, 24px optical size, no fill — clean and minimal.    
                                                                                          
  ---                                                                                     
  8. Screen Inventory (13 screens)                                                        
                                                                                          
  ┌──────────────────────────────┬────────────────────────────────────────────────────┐   
  │            Screen            │                    Description                     │   
  ├──────────────────────────────┼────────────────────────────────────────────────────┤
  │ Landing Page                 │ Hero with forest imagery, feature blocks,          │   
  │                              │ testimonials, footer                               │
  ├──────────────────────────────┼────────────────────────────────────────────────────┤   
  │ Login                        │ Auth form with editorial layout                    │   
  ├──────────────────────────────┼────────────────────────────────────────────────────┤   
  │ Business Onboarding          │ Multi-step vendor setup wizard                     │   
  ├──────────────────────────────┼────────────────────────────────────────────────────┤
  │ Vendor Dashboard (x2         │ Metrics cards, revenue chart, event cards,         │   
  │ variants)                    │ activity stream                                    │
  ├──────────────────────────────┼────────────────────────────────────────────────────┤   
  │ Vendor Storefront Detail (x2 │ Artisan profile, tabs (Drops/Services/Hours),      │
  │  variants)                   │ methodology sections                               │   
  ├──────────────────────────────┼────────────────────────────────────────────────────┤
  │ Vendor Calendar (x2          │ Monthly grid, time slots, status counts            │   
  │ variants)                    │                                                    │   
  ├──────────────────────────────┼────────────────────────────────────────────────────┤
  │ My Appointments (x2          │ Appointment cards with status badges, stats,       │   
  │ variants)                    │ actions                                            │   
  ├──────────────────────────────┼────────────────────────────────────────────────────┤
  │ Local Marketplace            │ Search + filter, business card grid, partner CTA   │   
  ├──────────────────────────────┼────────────────────────────────────────────────────┤   
  │ Community Resources          │ Content hub, multi-column editorial layout         │
  └──────────────────────────────┴────────────────────────────────────────────────────┘   
                  
  ---                                                                                     
  9. Do's and Don'ts

  Do:
  - Embrace generous white space (spacing-16 to spacing-20 between major sections)
  - Use asymmetrical layouts for editorial feel                                           
  - Use tertiary (#472510) for small warm accents (icons, underlines)
  - Use background color shifts to define boundaries                                      
                                                                                          
  Don't:                                                                                  
  - Use 1px solid borders for sectioning (kills the organic feel)                         
  - Use pure black (#000000) — always use on-surface (#1b1c1a)                            
  - Crowd the edges — increase padding rather than shrink text
  - Use traditional drop shadows — rely on tonal layering instead 