/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'farm-dark': '#1A1F0F',
        'farm-green': '#2A3B1C',
        'farm-green-mid': '#3D5229',
        'farm-cream': '#F2EADB',
        'farm-gold': '#C8A44A',
        'farm-earth': '#6B4226',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'line-grow': {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.9s ease forwards',
        'fade-up-delay': 'fade-up 0.9s 0.25s ease both',
        'fade-up-delay-2': 'fade-up 0.9s 0.5s ease both',
        'fade-in': 'fade-in 0.5s ease forwards',
        'line-grow': 'line-grow 0.8s ease forwards',
      },
    },
  },
  plugins: [],
}
