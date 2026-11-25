export default {
  plugins: {
    // Tailwind is available for utilities. Frost Glass CSS is the design system
    // and is imported directly, so this plugin must not inject preflight.
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
