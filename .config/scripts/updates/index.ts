#!/usr/bin/env bun

for (const file of ['brew.ts', 'mise.ts', 'bun.ts']) {
  const child = Bun.spawn(['bun', file], {
    cwd: import.meta.dir,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit'
  })

  await child.exited
}
