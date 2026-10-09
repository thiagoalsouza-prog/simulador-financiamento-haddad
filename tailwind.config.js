/**
 * Adaptador do Design System Haddad para Tailwind 3.
 *
 * Os tokens vivem em src/styles/haddad.css (iguais aos do design-system-haddad, que é escrito para Tailwind 4).
 * Aqui cada token vira uma cor do Tailwind com os MESMOS nomes do design system (bg-card, text-muted-foreground,
 * border-border, bg-sidebar-accent/60...). O truque é `color-mix`: classes sem transparência usam `var(--token)`
 * puro e classes com transparência (`/25`) viram `color-mix(in oklab, var(--token) 25%, transparent)` — assim o
 * valor do token pode ser hex, rgb() ou qualquer cor CSS.
 *
 * @type {import('tailwindcss').Config}
 */
const token =
  (name) =>
  ({ opacityValue } = {}) => {
    const alpha = Number(opacityValue)
    if (opacityValue === undefined || !Number.isFinite(alpha) || alpha >= 1) return `var(${name})`
    return `color-mix(in oklab, var(${name}) ${+(alpha * 100).toFixed(2)}%, transparent)`
  }

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // `dark:` vale em tudo que NÃO é o tema claro (escuro é o padrão do design system)
  darkMode: ['variant', ':where(:root:not([data-tema="claro"])) &'],
  theme: {
    extend: {
      colors: {
        background: token('--background'),
        foreground: token('--foreground'),
        'surface-2': token('--surface-2'),
        'surface-3': token('--surface-3'),
        card: { DEFAULT: token('--card'), foreground: token('--card-foreground') },
        popover: { DEFAULT: token('--popover'), foreground: token('--popover-foreground') },
        primary: { DEFAULT: token('--primary'), foreground: token('--primary-foreground') },
        secondary: { DEFAULT: token('--secondary'), foreground: token('--secondary-foreground') },
        muted: { DEFAULT: token('--muted'), foreground: token('--muted-foreground') },
        accent: { DEFAULT: token('--accent'), foreground: token('--accent-foreground') },
        destructive: token('--destructive'),
        border: token('--border'),
        input: token('--input'),
        ring: token('--ring'),

        cyan: token('--cyan'),
        success: { DEFAULT: token('--success'), soft: token('--success-soft') },
        warning: { DEFAULT: token('--warning'), soft: token('--warning-soft') },
        danger: { DEFAULT: token('--danger'), soft: token('--danger-soft') },
        info: { DEFAULT: token('--info'), soft: token('--info-soft') },
        violet: { DEFAULT: token('--violet'), soft: token('--violet-soft') },

        'chart-1': token('--chart-1'),
        'chart-2': token('--chart-2'),
        'chart-3': token('--chart-3'),
        'chart-4': token('--chart-4'),
        'chart-5': token('--chart-5'),

        sidebar: {
          DEFAULT: token('--sidebar'),
          foreground: token('--sidebar-foreground'),
          accent: token('--sidebar-accent'),
          'accent-foreground': token('--sidebar-accent-foreground'),
          border: token('--sidebar-border'),
        },
      },
      borderColor: { DEFAULT: token('--border') },
      fontFamily: {
        sans: ['var(--font-sans)'],
        heading: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      // raios do design system: 10–16 px nos componentes, 20 px nos painéis grandes
      borderRadius: {
        sm: '0.5rem',
        md: '0.625rem',
        lg: '0.75rem',
        xl: '0.875rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
        'glow-primary': 'var(--glow-primary)',
        'glow-cyan': 'var(--glow-cyan)',
      },
      transitionTimingFunction: { haddad: 'var(--ease-out)' },
      keyframes: {
        'haddad-enter': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'haddad-fade': { from: { opacity: '0' }, to: { opacity: '1' } },
        'haddad-pop': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'none' },
        },
        'haddad-slide-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'none' } },
        'haddad-slide-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
        'haddad-toast': {
          from: { opacity: '0', transform: 'translateY(-10px) scale(0.98)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        enter: 'haddad-enter 300ms var(--ease-out) backwards',
        fade: 'haddad-fade 150ms ease-out backwards',
        pop: 'haddad-pop 220ms var(--ease-out) backwards',
        'slide-left': 'haddad-slide-left 220ms var(--ease-out) backwards',
        'slide-right': 'haddad-slide-right 240ms var(--ease-out) backwards',
        toast: 'haddad-toast 220ms var(--ease-out) backwards',
      },
    },
  },
  plugins: [],
}
