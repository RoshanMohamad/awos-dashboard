import { FlatCompat } from '@eslint/eslintrc'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
 
const compat = new FlatCompat({
  baseDirectory: __dirname,
})
 
const eslintConfig = [
  // Apply Next.js config to all relevant files
  ...compat.config({
    extends: ['next/core-web-vitals'],
  }),
  
  // Global configuration
  {
    ignores: ['node_modules/**', '.next/**', 'dist/**', 'out/**'],
    linterOptions: {
      reportUnusedDisableDirectives: 'error'
    }
  }
]
 
export default eslintConfig
