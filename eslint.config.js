import pluginJs from '@eslint/js'
import globals from 'globals'

export default [
  {
    files: ['**/*.{js}'],
    ignores: ['dist'],
    env: {
      browser: true,
      node: true,
      es2020: true
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // ...pluginJs.configs.recommended.rules,
      "no-undef": "off"
    }
  },
  pluginJs.configs.recommended,
]
