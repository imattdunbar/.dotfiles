// @ts-nocheck

import { $ } from 'bun'



const prettierConfig = await Bun.file(import.meta.dir + '/.prettierrc').text()
await Bun.write(process.cwd() + '/.prettierrc', prettierConfig)
await $`bun i -D prettier prettier-plugin-tailwindcss`
