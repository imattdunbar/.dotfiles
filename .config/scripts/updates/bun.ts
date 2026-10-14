import { $ } from 'bun'

console.log('Running global bun package updates...')

const update = await $`bun update --global`.nothrow()

process.exitCode = update.exitCode
