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

const herdr = process.env.HERDR_BIN_PATH ?? "herdr"
const snapshotProcess = Bun.spawn([herdr, "api", "snapshot"], {
  env: process.env,
  stdout: "pipe",
  stderr: "inherit",
})
const snapshotText = await new Response(snapshotProcess.stdout).text()
const snapshotExitCode = await snapshotProcess.exited

if (snapshotExitCode !== 0) {
  process.exit(snapshotExitCode)
}

const response = JSON.parse(snapshotText) as SnapshotResponse
const { snapshot } = response.result
const workspace = snapshot.workspaces.find(
  ({ workspace_id }) => workspace_id === snapshot.focused_workspace_id,
)
const tab = snapshot.tabs.find(({ tab_id }) => tab_id === snapshot.focused_tab_id)

if (!workspace || !tab) {
  process.exit()
}

const titleProcess = Bun.spawn(
  [herdr, "terminal", "title", "set", `${workspace.label} | ${tab.label}`],
  {
    env: process.env,
    stdout: "inherit",
    stderr: "inherit",
  },
)

process.exit(await titleProcess.exited)
