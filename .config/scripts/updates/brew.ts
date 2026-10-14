import { $ } from 'bun'

console.log('Running brew updates...')

const update = await $`brew update`.nothrow()
const upgrade = await $`brew upgrade --no-ask`.nothrow()

process.exitCode = update.exitCode || upgrade.exitCode
