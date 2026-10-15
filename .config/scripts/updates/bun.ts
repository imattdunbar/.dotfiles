import { $ } from 'bun'

import { spaceLog } from '../util'

const globals = {
  packages: [
    '@anthropic-ai/claude-code',
    '@google/gemini-cli',
    '@types/bun',
    'opencode-with-claude',
    'oxfmt',
    'playwriter',
    'pnpm',
    'prettier',
    'prettier-plugin-tailwindcss',
    'wrangler'
  ],
  // Packages with install scripts that Bun must trust
  trusted: ['@opencode/cli']
}

spaceLog('Running bun global package updates...')

await $`bun add --global ${globals.packages}`.nothrow()
await $`bun add --global --trust ${globals.trusted}`.nothrow()
await $`bun update --global`.nothrow()

spaceLog('bun global package updates complete')
