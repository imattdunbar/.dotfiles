import { $ } from 'bun'
import { spaceLog } from '../util'

spaceLog('Running mise updates...')

await $`mise self-update --yes`.nothrow()
await $`mise --yes -C ${Bun.env.HOME} upgrade`.nothrow()

spaceLog('mise updates finished')
