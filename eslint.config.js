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
  {
    // vite.config.js는 브라우저가 아니라 Node(vite CLI)에서 실행된다 —
    // process.cwd() 같은 Node 전역을 쓰므로 이 파일만 globals.node를 더해준다.
    files: ['vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
