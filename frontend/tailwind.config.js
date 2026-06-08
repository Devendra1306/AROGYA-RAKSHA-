/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0052CC',
          dark: '#003D9B',
          container: '#0052cc',
          fixed: '#dae2ff'
        },
        secondary: {
          DEFAULT: '#10B981',
          dark: '#006c49',
          container: '#6cf8bb'
        },
        surface: {
          DEFAULT: '#f8f9ff',
          dim: '#cbdbf5',
          bright: '#f8f9ff',
          lowest: '#ffffff',
          low: '#eff4ff',
          container: '#e5eeff',
          high: '#dce9ff',
          highest: '#d3e4fe',
          variant: '#d3e4fe'
        },
        on: {
          surface: '#0b1c30',
          'surface-variant': '#434654',
          primary: '#ffffff',
          secondary: '#ffffff',
          'primary-container': '#c4d2ff',
          'secondary-container': '#00714d',
          background: '#0b1c30'
        },
        outline: {
          DEFAULT: '#737685',
          variant: '#c3c6d6'
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          on: '#ffffff',
          'on-container': '#93000a'
        }
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.25rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px'
      },
      spacing: {
        base: '8px',
        gutter: '24px',
        'container-max': '1280px',
        'margin-mobile': '16px',
        'margin-desktop': '48px',
        'stack-sm': '12px',
        'stack-md': '24px',
        'stack-lg': '48px'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
