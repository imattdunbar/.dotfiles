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

type TitleResponse = {
  result: {
    reason: string
  }
}

const herdr = '/opt/homebrew/bin/herdr'
let lastTitle: string | null = null
let hasForegroundClient = false

while (true) {
  const snapshotProcess = Bun.spawn([herdr, 'api', 'snapshot'], {
    stdout: 'pipe',
    stderr: 'ignore'
  })
  const snapshotText = await new Response(snapshotProcess.stdout).text()

  if ((await snapshotProcess.exited) !== 0) {
    lastTitle = null
    hasForegroundClient = false
    await Bun.sleep(1000)
    continue
  }

  const { snapshot } = (JSON.parse(snapshotText) as SnapshotResponse).result
  const workspace = snapshot.workspaces.find(({ workspace_id }) => workspace_id === snapshot.focused_workspace_id)
  const tab = snapshot.tabs.find(({ tab_id }) => tab_id === snapshot.focused_tab_id)

  if (!workspace || !tab) {
    await Bun.sleep(1000)
    continue
  }

  const title = `${workspace.label} | ${tab.label}`

  if (title !== lastTitle || !hasForegroundClient) {
    const titleProcess = Bun.spawn([herdr, 'terminal', 'title', 'set', title], {
      stdout: 'pipe',
      stderr: 'ignore'
    })
    const titleText = await new Response(titleProcess.stdout).text()

    if ((await titleProcess.exited) === 0) {
      const response = JSON.parse(titleText) as TitleResponse
      hasForegroundClient = response.result.reason !== 'no_foreground_client'

      if (hasForegroundClient) {
        lastTitle = title
      }
    }
  }

  await Bun.sleep(1000)
}
