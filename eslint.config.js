import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // 설정 파일들은 브라우저가 아니라 Node에서 돈다. 위 블록의 globals.browser만
  // 물려주면 vite.config.js의 process.cwd()가 no-undef로 잡힌다 — 잘못된 코드가
  // 아니라 어디서 도는지를 안 알려준 것이다.
  {
    files: ['*.config.js'],
    languageOptions: { globals: globals.node },
  },
])
