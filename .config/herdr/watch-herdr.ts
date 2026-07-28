// @ts-nocheck

type SnapshotResponse = {
  result: {
    snapshot: {
      focused_workspace_id: string | null
      focused_tab_id: string | null
      workspaces: Array<{ workspace_id: string; label: string }>
      tabs: Array<{ tab_id: string; label: string }>
    }
  }
}

type SessionListResponse = {
  sessions: Array<{
    name: string
    default: boolean
    running: boolean
  }>
}

const herdr = '/opt/homebrew/bin/herdr'

while (true) {
  const sessionsProcess = Bun.spawn([herdr, 'session', 'list', '--json'], {
    stdout: 'pipe',
    stderr: 'ignore'
  })
  const sessionsText = await new Response(sessionsProcess.stdout).text()

  if ((await sessionsProcess.exited) !== 0) {
    await Bun.sleep(1000)
    continue
  }

  const { sessions } = JSON.parse(sessionsText) as SessionListResponse

  await Promise.all(sessions.filter(({ running }) => running).map(async ({ name, default: isDefault }) => {
    const sessionArgs = isDefault ? [] : ['--session', name]
    const snapshotProcess = Bun.spawn([herdr, ...sessionArgs, 'api', 'snapshot'], {
      stdout: 'pipe',
      stderr: 'ignore'
    })
    const snapshotText = await new Response(snapshotProcess.stdout).text()

    if ((await snapshotProcess.exited) !== 0) {
      return
    }

    const { snapshot } = (JSON.parse(snapshotText) as SnapshotResponse).result
    const workspace = snapshot.workspaces.find(({ workspace_id }) => workspace_id === snapshot.focused_workspace_id)
    const tab = snapshot.tabs.find(({ tab_id }) => tab_id === snapshot.focused_tab_id)

    if (!workspace || !tab) {
      return
    }

    const titleProcess = Bun.spawn([herdr, ...sessionArgs, 'terminal', 'title', 'set', `${workspace.label} | ${tab.label}`], {
      stdout: 'ignore',
      stderr: 'ignore'
    })

    await titleProcess.exited
  }))

  await Bun.sleep(1000)
}
