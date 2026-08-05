import { z } from 'zod'

const windowSpecSchema = z.object({
  bundleId: z.string(),
  appName: z.string(),
  title: z.string(),
  windowIndex: z.number().int().nonnegative(),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive()
})

const layoutPayloadSchema = z.object({
  timestamp: z.string(),
  layoutName: z.string(),
  windows: z.array(windowSpecSchema)
})

const commandSchema = z.tuple([z.enum(['save', 'load']), z.enum(['docked.json', 'laptop.json'])])

export type WindowSpec = z.infer<typeof windowSpecSchema>
export type LayoutPayload = z.infer<typeof layoutPayloadSchema>

async function runJXA(script: string): Promise<string> {
  const subprocess = Bun.spawn(['/usr/bin/osascript', '-l', 'JavaScript'], {
    stdin: new Blob([script]),
    stdout: 'pipe',
    stderr: 'pipe'
  })
  const [exitCode, stdout, stderr] = await Promise.all([
    subprocess.exited,
    new Response(subprocess.stdout).text(),
    new Response(subprocess.stderr).text()
  ])

  if (exitCode !== 0) {
    throw new Error(stderr || `osascript exited with code ${exitCode}`)
  }

  return stdout
}

export function dumpWindowsJXA(): string {
  const sys = Application('System Events')
  const windowSpecs: WindowSpec[] = []

  const procs = sys.processes()

  for (let i = 0; i < procs.length; i++) {
    const proc = procs[i]
    try {
      const bundleId = proc.bundleIdentifier()
      const appName = proc.name()
      const wins = proc.windows()

      for (let j = 0; j < wins.length; j++) {
        const win = wins[j]
        try {
          if (win.subrole() !== 'AXStandardWindow') {
            continue
          }

          const pos = win.position() // Typed as [number, number]
          const sz = win.size() // Typed as [number, number]
          const title = win.name() || ''

          windowSpecs.push({
            bundleId,
            appName,
            title,
            windowIndex: j,
            x: pos[0],
            y: pos[1],
            w: sz[0],
            h: sz[1]
          })
        } catch (_) {
          // Ignore inaccessible windows
        }
      }
    } catch (_) {
      // Ignore process access errors
    }
  }

  return JSON.stringify(windowSpecs)
}

export function restoreWindowsJXA(specs: WindowSpec[]): void {
  const sys = Application('System Events')
  const restoredBundleIds: string[] = []

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i]
    if (restoredBundleIds.includes(spec.bundleId)) {
      continue
    }

    restoredBundleIds.push(spec.bundleId)

    try {
      const procs = sys.processes.whose({ bundleIdentifier: spec.bundleId })()
      if (procs.length > 0) {
        const proc = procs[0]
        const wins = proc.windows()

        for (let j = 0; j < wins.length; j++) {
          try {
            const win = wins[j]
            if (win.subrole() !== 'AXStandardWindow') {
              continue
            }

            win.position = [spec.x, spec.y]
            win.size = [spec.w, spec.h]
          } catch (_) {}
        }
      }
    } catch (_) {}
  }
}

export async function captureLayout(layoutName: string): Promise<LayoutPayload> {
  // Stringify the function implementation to pass to osascript
  const script = `
    ${dumpWindowsJXA.toString()}
    dumpWindowsJXA();
  `

  const raw = await runJXA(script)
  const windows: WindowSpec[] = JSON.parse(raw.trim())

  return {
    timestamp: new Date().toISOString(),
    layoutName,
    windows
  }
}

export async function restoreLayout(layout: LayoutPayload): Promise<void> {
  const script = `
    const specs = ${JSON.stringify(layout.windows)};
    ${restoreWindowsJXA.toString()}
    restoreWindowsJXA(specs);
  `

  await runJXA(script)
}

const [command, layoutFile] = commandSchema.parse(Bun.argv.slice(2))
const layoutPath = `${import.meta.dir}/${layoutFile}`

if (command === 'save') {
  const capturedLayout = await captureLayout(layoutFile.replace('.json', ''))
  const existingLayout = layoutPayloadSchema.parse(await Bun.file(layoutPath).json())
  const existingBundleIds = new Set(existingLayout.windows.map((window) => window.bundleId))
  const newWindows = capturedLayout.windows.filter((window) => !existingBundleIds.has(window.bundleId))

  await Bun.write(
    layoutPath,
    JSON.stringify(
      {
        ...existingLayout,
        timestamp: capturedLayout.timestamp,
        windows: [...existingLayout.windows, ...newWindows]
      },
      null,
      2
    )
  )
} else {
  const layout = layoutPayloadSchema.parse(await Bun.file(layoutPath).json())
  await restoreLayout(layout)
}
