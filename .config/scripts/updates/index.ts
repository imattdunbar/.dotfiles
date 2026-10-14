#!/usr/bin/env bun

const child = Bun.spawn(
  [
    'bun',
    'run',
    '--parallel',
    '--no-exit-on-error',
    './brew.ts',
    './mise.ts',
    './bun.ts'
  ],
  {
    cwd: import.meta.dir,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit'
  }
)

process.exitCode = await child.exited
