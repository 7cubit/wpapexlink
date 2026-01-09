/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./templates/**/*.php",
  ],
  darkMode: 'class',
  important: '.wp-apexlink-admin',
  theme: {
    extend: {
      colors: {
        'neuro-brain': '#4a90e2',
        'neuro-node': '#50e3c2',
        'neuro-link': '#b8e986',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  }
}
