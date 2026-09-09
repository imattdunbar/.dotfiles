#!/usr/bin/env bun

type Pane = {
  pane_id: string
  workspace_id: string
  tab_id?: string
  agent?: string
  agent_status?: string
  cwd?: string
  focused?: boolean
}

type Classified = { pane: Pane; idle: true } | { pane: Pane; idle: false; reason: string }

const SHELLS = new Set(['sh', 'bash', 'zsh', 'fish', 'nu', 'dash', 'ksh', 'tcsh'])

const SELF_PANE = process.env.HERDR_PANE_ID ?? ''

function runHerdr(cmd: string[]): { code: number; stdout: string; stderr: string } {
  const proc = Bun.spawnSync(['herdr', ...cmd], { stdout: 'pipe', stderr: 'pipe' })
  return {
    code: proc.exitCode ?? 1,
    stdout: proc.stdout?.toString() ?? '',
    stderr: proc.stderr?.toString() ?? ''
  }
}

function herdrResult(cmd: string[]): any {
  const r = runHerdr(cmd)
  if (r.code !== 0) throw new Error(`herdr ${cmd.join(' ')} failed: ${r.stderr || r.stdout}`)
  const parsed = JSON.parse(r.stdout)
  return parsed.result ?? parsed
}

function baseName(cmdline: string): string {
  const first = cmdline.trim().split(/\s+/)[0] ?? ''
  const bin = first.split('/').pop() ?? first
  return bin.replace(/^-/, '').toLowerCase()
}

async function main(): Promise<void> {
  const wsResult = herdrResult(['workspace', 'list'])
  const workspaces: { workspace_id: string }[] = wsResult.workspaces ?? []
  const targetWs = workspaces

  // Collect panes across workspaces.
  const allPanes: Pane[] = []
  for (const w of targetWs) {
    const pResult = herdrResult(['pane', 'list', '--workspace', w.workspace_id])
    for (const p of pResult.panes ?? []) allPanes.push(p as Pane)
  }

  // Classify each pane: exclude agents and non-shell foreground processes.
  const classified: Classified[] = []
  for (const pane of allPanes) {
    if (pane.agent) {
      classified.push({ pane, idle: false, reason: `agent:${pane.agent}:${pane.agent_status ?? '?'}` })
      continue
    }
    let info: any
    try {
      const r = herdrResult(['pane', 'process-info', '--pane', pane.pane_id])
      info = r.process_info ?? r
    } catch {
      classified.push({ pane, idle: false, reason: 'process-info unavailable' })
      continue
    }
    const procs: any[] = info.foreground_processes ?? []
    const shellPid = info.shell_pid
    if (procs.length !== 1) {
      classified.push({ pane, idle: false, reason: `${procs.length} foreground processes` })
      continue
    }
    const fg = procs[0]
    const name = baseName(fg.cmdline ?? fg.name ?? '')
    const isShell = SHELLS.has(name) && fg.pid === shellPid
    if (!isShell) {
      classified.push({ pane, idle: false, reason: `foreground:${fg.cmdline ?? fg.name}` })
      continue
    }
    classified.push({ pane, idle: true })
  }

  const idle = classified.filter((c) => c.idle)
  const busy = classified.filter((c) => !c.idle)

  console.log(`Workspaces: ${targetWs.map((w) => w.workspace_id).join(', ')}`)
  console.log(`Panes: ${allPanes.length} total, ${idle.length} idle, ${busy.length} skipped\n`)

  for (const c of busy) {
    if (c.idle === false) console.log(`SKIP ${c.pane.pane_id} (${c.pane.cwd ?? '?'}) — ${c.reason}`)
  }
  for (const c of idle) console.log(`IDLE ${c.pane.pane_id} (${c.pane.cwd ?? '?'})`)

  let failed = 0
  for (const c of idle) {
    // the command to run in all panes
    const cmd = 'unset SSH_CONNECTION SSH_CLIENT SSH_TTY; clear'
    const r = runHerdr(['pane', 'run', c.pane.pane_id, cmd])
    if (r.code !== 0) {
      failed++
      console.error(`FAIL ${c.pane.pane_id}: ${r.stderr || r.stdout}`)
    } else {
      console.log(`CLEARED ${c.pane.pane_id}`)
    }
  }
  if (failed > 0) process.exit(1)
}

main().catch((e) => {
  console.error(String(e))
  process.exit(1)
})
