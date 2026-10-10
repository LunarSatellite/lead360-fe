/**
 * Colour here is a *reference*, never a value.
 *
 * Every entry below resolves through a CSS custom property defined in
 * `src/styles/globals.css`, so the same class names paint the Lead360 palette
 * by default and StyleMint's under `:root[data-console="stylemint"]`. Writing a
 * literal hex in this file would pin that utility to one product and silently
 * break the other build — the classic "one theme's text on the other's ground".
 *
 * `<alpha-value>` is Tailwind's placeholder for the opacity modifier, so
 * `bg-glass-1/50` keeps working exactly as it did when these were hex.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'rgb(var(--color-surface-app) / <alpha-value>)',
          sunken: 'rgb(var(--color-surface-sunken) / <alpha-value>)',
          shell: 'rgb(var(--color-surface-inset) / <alpha-value>)',
          card: 'rgb(var(--color-surface-card) / <alpha-value>)',
          elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
          input: 'rgb(var(--color-surface-inset) / <alpha-value>)',
        },
        glass: {
          1: 'rgb(var(--color-glass-1) / <alpha-value>)',
          2: 'rgb(var(--color-glass-2) / <alpha-value>)',
          3: 'rgb(var(--color-glass-3) / <alpha-value>)',
        },
        border: {
          subtle: 'rgb(var(--color-border-subtle) / <alpha-value>)',
          medium: 'rgb(var(--color-border-default) / <alpha-value>)',
          // Connective chrome — flow-canvas edges, dividers that have to read
          // against a card rather than disappear into it.
          strong: 'rgb(var(--color-border-strong) / <alpha-value>)',
          // The tint alpha is itself per-product: see the note on
          // --alpha-brand-glow in globals.css.
          glow: 'rgb(var(--brand-rgb) / var(--alpha-brand-glow))',
          success: 'rgb(var(--color-success) / 0.15)',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          // Label on a brand-filled control, and on any light chip.
          inverted: 'rgb(var(--color-text-inverted) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--brand-rgb) / <alpha-value>)',
          light: 'rgb(var(--brand-light-rgb) / <alpha-value>)',
          dark: 'rgb(var(--brand-dark-rgb) / <alpha-value>)',
          soft: 'rgb(var(--brand-rgb) / var(--alpha-brand-soft))',
          // `brand.glow` is a *hue*, not a tint: the second brand green the
          // AuroraBI port left behind for glows and drop-shadows — see the
          // note beside --color-brand-glow in globals.css. Do not confuse it
          // with `border.glow` below, which is the brand hue at
          // --alpha-brand-glow. StyleMint collapses the two greens, so there
          // it is simply the brand colour.
          glow: 'rgb(var(--color-brand-glow) / <alpha-value>)',
          'glow-light': 'rgb(var(--color-brand-glow-light) / <alpha-value>)',
          beacon: 'rgb(var(--color-brand-beacon) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          light: 'rgb(var(--color-success-light) / <alpha-value>)',
          soft: 'rgb(var(--color-success) / 0.1)',
        },
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
          soft: 'rgb(var(--color-info) / 0.1)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          soft: 'rgb(var(--color-danger) / 0.1)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          soft: 'rgb(var(--color-warning) / 0.1)',
        },
        sidebar: {
          DEFAULT: 'rgb(var(--color-surface-app) / <alpha-value>)',
          light: 'rgb(var(--color-surface-card) / <alpha-value>)',
        },
        // Analogous accent — green shifted toward cyan/teal (hue +18°)
        // Use for: info states, analytics charts, secondary actions, data viz
        teal: {
          DEFAULT: 'rgb(var(--color-teal) / <alpha-value>)',
          light: 'rgb(var(--color-teal-light) / <alpha-value>)',
          soft: 'rgb(var(--color-teal) / 0.08)',
        },
        // Triadic accent — violet/indigo (hue +120° from brand) on Lead360.
        // Use for: AI features, flow builder nodes, premium badges, ML-related UI
        // StyleMint has no violet; this slot carries its yellow accent instead.
        violet: {
          DEFAULT: 'rgb(var(--color-violet) / <alpha-value>)',
          light: 'rgb(var(--color-violet-light) / <alpha-value>)',
          soft: 'rgb(var(--color-violet) / 0.08)',
        },
      },
      backgroundImage: {
        // ── Brand ramp (monochromatic green) ──────────────────
        // Use for: primary CTAs, progress bars, active bar indicators
        'gradient-brand':
          'linear-gradient(135deg, rgb(var(--brand-light-rgb)) 0%, rgb(var(--brand-rgb)) 50%, rgb(var(--brand-dark-rgb)) 100%)',
        // Horizontal shimmer variant — buttons that need the sweep animation
        'gradient-brand-h':
          'linear-gradient(105deg, rgb(var(--brand-dark-rgb)) 0%, rgb(var(--brand-rgb)) 45%, rgb(var(--brand-light-rgb)) 100%)',

        // ── Analogous teal (green → cyan) ────────────────────
        // Use for: info banners, analytics/data widgets, secondary accent elements
        'gradient-teal':
          'linear-gradient(135deg, rgb(var(--brand-rgb)) 0%, rgb(var(--color-teal)) 100%)',

        // ── Triadic violet (purple → indigo) ─────────────────
        // Use for: AI feature cards, flow-builder canvas accents, model badges
        'gradient-violet':
          'linear-gradient(135deg, rgb(var(--color-violet)) 0%, rgb(var(--color-violet-light)) 100%)',

        // ── AI / flow canvas — the triadic accent crosses to brand green ──
        // Use for: AI pipeline illustrations, the flow builder canvas header
        'gradient-ai':
          'linear-gradient(135deg, rgb(var(--color-violet)) 0%, rgb(var(--color-teal)) 55%, rgb(var(--brand-rgb)) 100%)',

        // ── Surface depth gradients ───────────────────────────
        // Use for: card backgrounds that need depth without box-shadow
        'gradient-card':
          'linear-gradient(145deg, rgb(var(--color-glass-2)) 0%, rgb(var(--color-surface-card)) 100%)',
        'gradient-elevated':
          'linear-gradient(145deg, rgb(var(--color-glass-3)) 0%, rgb(var(--color-surface-elevated)) 100%)',

        // ── Radial orbs (background depth layers) ────────────
        // Use for: page-level background orbs behind content sections
        'orb-brand':
          'radial-gradient(ellipse at center, rgb(var(--brand-rgb) / 0.14) 0%, transparent 65%)',
        'orb-teal':
          'radial-gradient(ellipse at center, rgb(var(--color-teal) / 0.10) 0%, transparent 65%)',
        'orb-violet':
          'radial-gradient(ellipse at center, rgb(var(--color-violet) / 0.10) 0%, transparent 65%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        frame: '16px',
        card: '12px',
        sm: '8px',
        xs: '5px',
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['15px', { lineHeight: '1.6' }],
        lg: ['17px', { lineHeight: '1.5' }],
        xl: ['20px', { lineHeight: '1.4' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
        '3xl': ['30px', { lineHeight: '1.2' }],
        '4xl': ['36px', { lineHeight: '1.1' }],
        '5xl': ['44px', { lineHeight: '1.1' }],
        '6xl': ['54px', { lineHeight: '1.05' }],
      },
      borderWidth: {
        thin: '0.5px',
      },
    },
  },
  plugins: [],
};
