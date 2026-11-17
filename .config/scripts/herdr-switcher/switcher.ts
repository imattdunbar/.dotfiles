import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import {
  BoxRenderable,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  TextRenderable,
  createCliRenderer
} from '@opentui/core'

const herdr = process.env.HERDR_BIN_PATH ?? 'herdr'

type Ws = { workspace_id: string; label: string; focused: boolean }
type Tab = { tab_id: string; workspace_id: string; label: string; pane_count: number; focused: boolean }

function run(args: string[]): any {
  const raw = spawnSync(herdr, args, { encoding: 'utf-8' })
  if (!raw.stdout) return null
  try {
    return JSON.parse(raw.stdout)
  } catch {
    return null
  }
}

function load(): { workspaces: Ws[]; tabs: Tab[] } {
  const w = run(['workspace', 'list'])
  const t = run(['tab', 'list'])
  return {
    workspaces: w?.result?.workspaces ?? [],
    tabs: t?.result?.tabs ?? []
  }
}

const { workspaces, tabs } = load()
const tabsByWs = new Map<string, Tab[]>()
const tabById = new Map<string, Tab>()
for (const t of tabs) {
  tabById.set(t.tab_id, t)
  const list = tabsByWs.get(t.workspace_id) ?? []
  list.push(t)
  tabsByWs.set(t.workspace_id, list)
}

const renderer = await createCliRenderer({ exitOnCtrlC: true })

const root = new BoxRenderable(renderer, {
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  padding: 1,
  gap: 1
})
const hint = new TextRenderable(renderer, {
  content: 'Filter, ↑↓ move, Enter switch, Esc quit',
  fg: '#888888'
})
const input = new InputRenderable(renderer, {
  width: '100%',
  placeholder: 'Filter tabs...'
})
const list = new ScrollBoxRenderable(renderer, {
  flexGrow: 1,
  flexShrink: 1,
  stickyScroll: false
})

const HEADER_FG = '#888888'
const NORMAL_FG = '#FFFFFF'
const SEL_BG = '#334455'
const SEL_FG = '#FFFF00'

type Section = { ws: Ws; tabs: Tab[] }
let sections: Section[] = []
let flat: Tab[] = []
let selected = 0
let nodes: TextRenderable[] = []

function quit(code: number) {
  try {
    renderer.destroy()
  } catch {
    // ignore teardown errors
  }
  process.exit(code)
}

function doSwitch() {
  const target = flat[selected]
  if (!target) quit(0)
  try {
    renderer.destroy()
  } catch {
    // ignore teardown errors
  }
  spawnSync(herdr, ['tab', 'focus', target.tab_id], { stdio: 'ignore' })
  process.exit(0)
}

function tabRow(t: Tab, prefix: string, tabIdx: number) {
  const isSel = tabIdx === selected
  const mark = t.focused ? ' •' : ''
  const row = new TextRenderable(renderer, {
    id: `tabrow-${tabIdx}`,
    content: `${prefix}${t.label} (${t.pane_count})${mark}`,
    fg: isSel ? SEL_FG : NORMAL_FG,
    ...(isSel ? { bg: SEL_BG } : {})
  })
  list.content.add(row)
  nodes.push(row)
}

function render() {
  for (const n of nodes) list.content.remove(n)
  nodes = []
  let tabIdx = 0

  for (const s of sections) {
    const h = new TextRenderable(renderer, {
      content: `${s.ws.label} (${s.tabs.length})`,
      fg: HEADER_FG
    })
    list.content.add(h)
    nodes.push(h)
    for (const t of s.tabs) {
      tabRow(t, '  ', tabIdx)
      tabIdx++
    }
  }
  if (flat.length === 0) {
    const empty = new TextRenderable(renderer, { content: 'No match', fg: HEADER_FG })
    list.content.add(empty)
    nodes.push(empty)
    return
  }
  try {
    list.scrollChildIntoView(`tabrow-${selected}`)
  } catch {
    // ignore scroll errors
  }
}

function rebuild(filter: string) {
  const f = filter.trim().toLowerCase()
  sections = []
  flat = []
  for (const ws of workspaces) {
    const wsTabs = tabsByWs.get(ws.workspace_id) ?? []
    const wsHit = !f || ws.label.toLowerCase().includes(f)
    const hit = wsTabs.filter((t) => wsHit || t.label.toLowerCase().includes(f))
    if (f && !wsHit && hit.length === 0) continue
    sections.push({ ws, tabs: hit })
    flat.push(...hit)
  }
  selected = 0
  render()
}

function move(d: number) {
  if (flat.length === 0) return
  selected = (selected + d + flat.length) % flat.length
  render()
}

rebuild('')
root.add(hint)
root.add(input)
root.add(list)
renderer.root.add(root)
input.focus()

input.on(InputRenderableEvents.INPUT, (v: string) => rebuild(v))
input.on(InputRenderableEvents.ENTER, () => doSwitch())

renderer.keyInput.on('keypress', (key) => {
  if (key.name === 'escape') quit(0)
  else if (key.name === 'up') move(-1)
  else if (key.name === 'down') move(1)
  else if (key.name === 'return' || key.name === 'enter' || key.name === 'linefeed' || key.name === 'kpenter') {
    doSwitch()
  }
})
