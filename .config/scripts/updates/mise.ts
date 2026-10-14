import { $ } from 'bun'

console.log('Running mise updates...')

const update = await $`mise self-update --yes`.nothrow()
const upgrade = await $`mise -C ${Bun.env.HOME} upgrade`.nothrow()

process.exitCode = update.exitCode || upgrade.exitCode
