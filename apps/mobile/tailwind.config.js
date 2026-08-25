/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // NativeWind's color-scheme runtime switches the root class on web.
  // Keeping Tailwind's default `media` mode makes that manual switch throw.
  darkMode: 'class',
  theme: {
    extend: {
      // Tooling mirror of the semantic values exported through src/theme.
      colors: {
        ink: '#10231f',
        muted: '#5e706b',
        'ink-muted': '#5e706b',
        canvas: '#f4f7f4',
        surface: '#ffffff',
        primary: '#176b51',
        'primary-pressed': '#10523e',
        'primary-soft': '#e5f1ec',
        'primary-subtle': '#dfece6',
        border: '#dce5e1',
        info: '#3478c7',
        warning: '#b46a16',
        danger: '#b63b3b',
        critical: '#7c2147',
        official: '#3159a4',
        'official-soft': '#e8eef9',
        'danger-soft': '#fcebea',
        overlay: 'rgba(16,35,31,0.38)',
        'overlay-light': 'rgba(16,35,31,0.25)',
        'map-overlay': 'rgba(255,255,255,0.94)',
        'map-surface-strong': 'rgba(255,255,255,0.96)',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '18px',
        card: '18px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};
