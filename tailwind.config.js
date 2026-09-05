/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        primary: {
          DEFAULT: 'var(--primary)',
          light: 'var(--primary-light)',
        },
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 2px 10px rgba(18, 53, 49, 0.06)',
        soft_lg: '0 8px 30px rgba(18, 53, 49, 0.08)',
      },
    },
  },
  plugins: [],
}
