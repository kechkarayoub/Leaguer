module.exports = {
  root: true,
  extends: ['@react-native'],
  ignorePatterns: [
    'babel.config.js',
    'metro.config.js',
    'android/',
    'ios/',
    'node_modules/',
    '*.config.js',
  ],
  overrides: [
    {
      files: ['scripts/**/*.js'],
      parser: 'espree',
      env: { node: true },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'script',
      },
      rules: {},
    },
  ],
};
