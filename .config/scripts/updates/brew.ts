import { $ } from 'bun'
import { spaceLog } from '../util'

spaceLog('Running brew updates...')

await $`brew update`.nothrow()
await $`brew upgrade --no-ask`.nothrow()

spaceLog('brew updates finished')
