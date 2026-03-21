/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /* ================================================================
       * FONT FAMILIES
       * Dual-typeface system: Epilogue (editorial) + Manrope (functional)
       * ================================================================ */
      fontFamily: {
        sans:      ['var(--font-body)'],           // default body font
        headline:  ['var(--font-headline)'],       // h1-h4, display text
        body:      ['var(--font-body)'],            // body copy
        label:     ['var(--font-label)'],           // UI labels, nav
      },

      /* ================================================================
       * FONT SIZE
       * Includes the 10px micro-label used in 6/8 Stitch screens.
       * Standard Tailwind sizes (text-xs through text-7xl) are kept
       * as defaults; only custom additions here.
       * ================================================================ */
      fontSize: {
        '2xs': ['var(--text-2xs)', { lineHeight: '1' }],  // 10px micro-label
      },

      /* ================================================================
       * LETTER SPACING
       * ================================================================ */
      letterSpacing: {
        tighter: 'var(--tracking-tighter)',
        tight:   'var(--tracking-tight)',
        normal:  'var(--tracking-normal)',
        wider:   'var(--tracking-wider)',
        widest:  'var(--tracking-widest)',
      },

      /* ================================================================
       * LINE HEIGHT
       * ================================================================ */
      lineHeight: {
        none:    'var(--leading-none)',
        tight:   'var(--leading-tight)',
        normal:  'var(--leading-normal)',
        relaxed: 'var(--leading-relaxed)',
      },

      /* ================================================================
       * COLORS
       * Full Material Design 3 palette from Stitch, mapped to CSS vars.
       * Organized by role, not appearance.
       * ================================================================ */
      colors: {
        // --- Primary (Deep Forest Green) ---
        primary: {
          DEFAULT:              'var(--color-primary)',
          container:            'var(--color-primary-container)',
          fixed:                'var(--color-primary-fixed)',
          'fixed-dim':          'var(--color-primary-fixed-dim)',
        },
        'on-primary': {
          DEFAULT:              'var(--color-on-primary)',
          container:            'var(--color-on-primary-container)',
          fixed:                'var(--color-on-primary-fixed)',
          'fixed-variant':      'var(--color-on-primary-fixed-variant)',
        },
        'inverse-primary':       'var(--color-inverse-primary)',

        // --- Secondary (Muted Sage) ---
        secondary: {
          DEFAULT:              'var(--color-secondary)',
          container:            'var(--color-secondary-container)',
          fixed:                'var(--color-secondary-fixed)',
          'fixed-dim':          'var(--color-secondary-fixed-dim)',
        },
        'on-secondary': {
          DEFAULT:              'var(--color-on-secondary)',
          container:            'var(--color-on-secondary-container)',
          fixed:                'var(--color-on-secondary-fixed)',
          'fixed-variant':      'var(--color-on-secondary-fixed-variant)',
        },

        // --- Tertiary (Warm Brown) ---
        tertiary: {
          DEFAULT:              'var(--color-tertiary)',
          container:            'var(--color-tertiary-container)',
          fixed:                'var(--color-tertiary-fixed)',
          'fixed-dim':          'var(--color-tertiary-fixed-dim)',
        },
        'on-tertiary': {
          DEFAULT:              'var(--color-on-tertiary)',
          container:            'var(--color-on-tertiary-container)',
          fixed:                'var(--color-on-tertiary-fixed)',
          'fixed-variant':      'var(--color-on-tertiary-fixed-variant)',
        },

        // --- Surface & Background (Tonal Layering) ---
        surface: {
          DEFAULT:              'var(--color-surface)',
          dim:                  'var(--color-surface-dim)',
          bright:               'var(--color-surface-bright)',
          tint:                 'var(--color-surface-tint)',
          variant:              'var(--color-surface-variant)',
          'container-lowest':   'var(--color-surface-container-lowest)',
          'container-low':      'var(--color-surface-container-low)',
          container:            'var(--color-surface-container)',
          'container-high':     'var(--color-surface-container-high)',
          'container-highest':  'var(--color-surface-container-highest)',
        },
        background:              'var(--color-background)',

        // --- On-Surface (Text on surfaces) ---
        'on-surface': {
          DEFAULT:              'var(--color-on-surface)',
          variant:              'var(--color-on-surface-variant)',
        },
        'on-background':         'var(--color-on-background)',

        // --- Outline & Borders ---
        outline: {
          DEFAULT:              'var(--color-outline)',
          variant:              'var(--color-outline-variant)',
        },

        // --- Inverse ---
        'inverse-surface':       'var(--color-inverse-surface)',
        'inverse-on-surface':    'var(--color-inverse-on-surface)',

        // --- Error / Destructive ---
        error: {
          DEFAULT:              'var(--color-error)',
          container:            'var(--color-error-container)',
        },
        'on-error': {
          DEFAULT:              'var(--color-on-error)',
          container:            'var(--color-on-error-container)',
        },

        // --- Status (appointments, calendar events) ---
        status: {
          pending:              'var(--color-status-pending)',
          confirmed:            'var(--color-status-confirmed)',
          completed:            'var(--color-status-completed)',
          cancelled:            'var(--color-status-cancelled)',
          declined:             'var(--color-status-declined)',
        },

        // --- shadcn/ui compatibility (HSL-based) ---
        'shadcn-background':     'hsl(var(--background))',
        'shadcn-foreground':     'hsl(var(--foreground))',
        card: {
          DEFAULT:              'hsl(var(--card))',
          foreground:           'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:              'hsl(var(--popover))',
          foreground:           'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT:              'hsl(var(--muted))',
          foreground:           'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT:              'hsl(var(--destructive))',
          foreground:           'hsl(var(--destructive-foreground))',
        },
        border:                  'hsl(var(--border))',
        input:                   'hsl(var(--input))',
        ring:                    'hsl(var(--ring))',
        chart: {
          '1':                  'hsl(var(--chart-1))',
          '2':                  'hsl(var(--chart-2))',
          '3':                  'hsl(var(--chart-3))',
          '4':                  'hsl(var(--chart-4))',
          '5':                  'hsl(var(--chart-5))',
        },
      },

      /* ================================================================
       * BORDER RADIUS
       * Stitch config overrides Tailwind defaults to be much subtler.
       * We add the larger sizes that appear in the HTML markup.
       * ================================================================ */
      borderRadius: {
        none:   'var(--radius-none)',
        sm:     'var(--radius-sm)',         // 2px — Stitch DEFAULT
        DEFAULT:'var(--radius-sm)',         // 2px
        md:     'var(--radius-md)',         // 6px — primary buttons
        lg:     'var(--radius-lg)',         // 8px — standard cards
        xl:     'var(--radius-xl)',         // 12px — large cards, overlays
        '2xl':  'var(--radius-2xl)',        // 16px — prominent containers
        '3xl':  'var(--radius-3xl)',        // 24px — hero cards, bottom nav
        full:   'var(--radius-full)',       // 9999px — pills, avatars
      },

      /* ================================================================
       * BOX SHADOW
       * Tonal layering is preferred. Shadows only for floating elements.
       * ================================================================ */
      boxShadow: {
        'editorial':    'var(--shadow-editorial)',
        'bottom-nav':   'var(--shadow-bottom-nav)',
        'primary-glow': 'var(--shadow-primary-glow)',
      },

      /* ================================================================
       * SPACING
       * Tailwind defaults are fine for most values; these add the
       * design system's semantic spacing for large section gaps.
       * Standard Tailwind spacing (0-32+) maps naturally to our tokens.
       * ================================================================ */
      spacing: {
        'grid':  'var(--grid-gap)',         // 1.5rem — 12-column grid gap
      },

      /* ================================================================
       * GRID
       * ================================================================ */
      gridAutoRows: {
        'calendar': 'var(--calendar-row-height)', // 140px — calendar cell height
      },

      /* ================================================================
       * MAX-WIDTH — Container sizes
       * ================================================================ */
      maxWidth: {
        'container-sm':      'var(--container-sm)',
        'container-md':      'var(--container-md)',
        'container-lg':      'var(--container-lg)',
        'container-xl':      'var(--container-xl)',
        'container-2xl':     'var(--container-2xl)',
        'container-content': 'var(--container-content)',
        'container-wide':    'var(--container-wide)',
      },

      /* ================================================================
       * Z-INDEX
       * ================================================================ */
      zIndex: {
        'base':   'var(--z-base)',
        'raised': 'var(--z-raised)',
        'sticky': 'var(--z-sticky)',
        'fixed':  'var(--z-fixed)',
      },

      /* ================================================================
       * TRANSITIONS
       * ================================================================ */
      transitionDuration: {
        'fast':  'var(--transition-fast)',
        'base':  'var(--transition-base)',
        'slow':  'var(--transition-slow)',
      },
      transitionTimingFunction: {
        'editorial': 'var(--transition-easing)',
      },

      /* ================================================================
       * BACKDROP BLUR
       * ================================================================ */
      backdropBlur: {
        'glass': 'var(--glass-blur)',       // 12px — frosted glass effect
      },

      /* ================================================================
       * BACKGROUND IMAGE — Gradients
       * ================================================================ */
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
      },

      /* ================================================================
       * OPACITY
       * ================================================================ */
      opacity: {
        'ghost':     'var(--opacity-ghost-border)',
        'subtle':    'var(--opacity-subtle-border)',
        'glass':     'var(--opacity-glass)',
        'decorative':'var(--opacity-decorative)',
      },
    },
  },
  plugins: [],
};
