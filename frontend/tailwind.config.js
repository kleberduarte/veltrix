/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /**
         * Paleta dinâmica controlada por EmpresaTheme via CSS vars.
         * Valores default definidos em :root no globals.css (estilo Veltrix azul).
         */
        primary: {
          50:  'rgb(var(--veltrix-primary-50)  / <alpha-value>)',
          100: 'rgb(var(--veltrix-primary-100) / <alpha-value>)',
          200: 'rgb(var(--veltrix-primary-200) / <alpha-value>)',
          500: 'rgb(var(--veltrix-primary-500) / <alpha-value>)',
          600: 'rgb(var(--veltrix-primary-600) / <alpha-value>)',
          700: 'rgb(var(--veltrix-primary-700) / <alpha-value>)',
          800: 'rgb(var(--veltrix-primary-800) / <alpha-value>)',
          900: 'rgb(var(--veltrix-primary-900) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
