import { $, spawn } from 'bun'
import z from 'zod'

const hook = z.enum(['work', 'personal']).default('personal').parse(process.argv[2])
const port = z.coerce.number().positive().default(7777).parse(process.argv[3])

let targetHost = 'p-hook.dunbar.gg'
let secret = 'op://Personal/Cloudflare/phook token'

if (hook === 'work') {
  targetHost = 'w-hook.dunbar.gg'
  secret = 'op://Personal/Cloudflare/workhook token'
}

const token = await $`op read ${secret}`.text()

console.log(`Starting tunnel: https://${targetHost} -> http://localhost:${port}`)

const tunnel = spawn(['cloudflared', 'tunnel', 'run', '--url', `http://localhost:${port}`, '--token', token], {
  stdout: 'inherit',
  stderr: 'inherit'
})

// Graceful teardown on ctrl+c
process.on('SIGINT', () => {
  console.log('\nStopping tunnel...')
  tunnel.kill('SIGINT')
  process.exit(0)
})

await tunnel.exited
