import { $ } from 'bun'

import { spaceLog } from '../util'

spaceLog('Running bun global package updates...')

await $`bun update --global`.nothrow()

spaceLog('bun global package updates complete')
