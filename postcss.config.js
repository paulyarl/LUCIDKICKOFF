module.exports = {
  plugins: {
    'postcss-import': {},
    // Use the standalone PostCSS nesting plugin for compatibility
    'postcss-nesting': {},
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
  },
};
