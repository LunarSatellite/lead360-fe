/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A1612',
          shell: '#0F1E1A',
          card: '#132420',
          elevated: '#1A332C',
          input: '#0F1E1A',
        },
        glass: {
          1: '#172C23',
          2: '#1C3328',
          3: '#243D30',
        },
        border: {
          subtle: '#14302A',
          medium: '#1C4132',
          glow: 'rgba(0,217,138,0.18)',
          success: 'rgba(16,185,129,0.15)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#B8E6D5',
          muted: '#7A9B8E',
        },
        brand: {
          DEFAULT: '#00D98A',
          light: '#00FFA3',
          dark: '#00B368',
          soft: 'rgba(0,217,138,0.08)',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#34D399',
          soft: 'rgba(16,185,129,0.1)',
        },
        info: {
          DEFAULT: '#3B82F6',
          soft: 'rgba(59,130,246,0.1)',
        },
        danger: {
          DEFAULT: '#F43F5E',
          soft: 'rgba(244,63,94,0.1)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          soft: 'rgba(245,158,11,0.1)',
        },
        sidebar: {
          DEFAULT: '#0A1612',
          light: '#132420',
        },
        // Analogous accent — green shifted toward cyan/teal (hue +18°)
        // Use for: info states, analytics charts, secondary actions, data viz
        teal: {
          DEFAULT: '#00B3C8',
          light: '#00D5ED',
          soft: 'rgba(0,179,200,0.08)',
        },
        // Triadic accent — violet/indigo (hue +120° from brand)
        // Use for: AI features, flow builder nodes, premium badges, ML-related UI
        violet: {
          DEFAULT: '#7B61FF',
          light: '#A78BFA',
          soft: 'rgba(123,97,255,0.08)',
        },
      },
      backgroundImage: {
        // ── Brand ramp (monochromatic green) ──────────────────
        // Use for: primary CTAs, progress bars, active bar indicators
        'gradient-brand': 'linear-gradient(135deg, #00FFA3 0%, #00D98A 50%, #00B368 100%)',
        // Horizontal shimmer variant — buttons that need the sweep animation
        'gradient-brand-h': 'linear-gradient(105deg, #00c77a 0%, #00D98A 40%, #00FFA3 70%, #43ffb8 100%)',

        // ── Analogous teal (green → cyan) ────────────────────
        // Use for: info banners, analytics/data widgets, secondary accent elements
        'gradient-teal': 'linear-gradient(135deg, #00D98A 0%, #00B3C8 100%)',

        // ── Triadic violet (purple → indigo) ─────────────────
        // Use for: AI feature cards, flow-builder canvas accents, model badges
        'gradient-violet': 'linear-gradient(135deg, #7B61FF 0%, #A78BFA 100%)',

        // ── AI / flow canvas — violet crosses to brand green ──
        // Use for: AI pipeline illustrations, the flow builder canvas header
        'gradient-ai': 'linear-gradient(135deg, #7B61FF 0%, #00B3C8 55%, #00D98A 100%)',

        // ── Surface depth gradients ───────────────────────────
        // Use for: card backgrounds that need depth without box-shadow
        'gradient-card': 'linear-gradient(145deg, #1C3328 0%, #132420 100%)',
        'gradient-elevated': 'linear-gradient(145deg, #243D30 0%, #1A332C 100%)',

        // ── Radial orbs (background depth layers) ────────────
        // Use for: page-level background orbs behind content sections
        'orb-brand': 'radial-gradient(ellipse at center, rgba(0,217,138,0.14) 0%, transparent 65%)',
        'orb-teal':  'radial-gradient(ellipse at center, rgba(0,179,200,0.10) 0%, transparent 65%)',
        'orb-violet':'radial-gradient(ellipse at center, rgba(123,97,255,0.10) 0%, transparent 65%)',
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
