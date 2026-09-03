import type { Plugin } from '@opencode-ai/plugin'
import { Hono } from 'hono'

type SessionRecord = {
  id: string
  title: string
  directory: string
  parentID?: string
  agent?: string
  cost?: number
  model?: {
    id?: string
    providerID?: string
    variant?: string
  }
  time: {
    created: number
    updated: number
  }
  tokens?: {
    input?: number
    output?: number
    reasoning?: number
    cache?: {
      read?: number
      write?: number
    }
  }
}

type DashboardSession = SessionRecord & {
  hrefPath: string
  project: string
  totalTokens: number
}

type DashboardPayload = {
  sessions: DashboardSession[]
  failedProjects: number
  generatedAt: number
}

const host = '0.0.0.0'
const healthHost = '127.0.0.1'
const port = Number(process.env.SESSION_DASHBOARD_PORT || '4097')
const webUrlOverride = process.env.SESSION_DASHBOARD_WEB_URL?.trim() || ''
const cacheDuration = 3_000
const retryDuration = 5_000

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid SESSION_DASHBOARD_PORT: ${process.env.SESSION_DASHBOARD_PORT}`)
}

function projectName(directory: string): string {
  return directory.split('/').filter(Boolean).at(-1) || directory
}

function sessionHrefPath(session: SessionRecord): string {
  const directory = Buffer.from(session.directory).toString('base64url')
  return `/${directory}/session/${encodeURIComponent(session.id)}`
}

function totalTokens(session: SessionRecord): number {
  return (
    (session.tokens?.input ?? 0) +
    (session.tokens?.output ?? 0) +
    (session.tokens?.reasoning ?? 0) +
    (session.tokens?.cache?.read ?? 0) +
    (session.tokens?.cache?.write ?? 0)
  )
}

const page = String.raw`<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <title>OpenCode Sessions</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              canvas: '#0d0d0f',
              panel: '#151518',
              raised: '#1b1b1f',
              line: '#29292f',
              accent: '#f4a261'
            },
            fontFamily: {
              mono: ['SFMono-Regular', 'Cascadia Code', 'Roboto Mono', 'monospace'],
              sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
            }
          }
        }
      }
    </script>
  </head>
  <body class="min-h-screen bg-canvas font-sans text-zinc-200 antialiased">
    <div class="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header class="mb-6 border-b border-line pb-6">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div class="mb-3 flex items-center gap-3">
              <span class="grid size-8 place-items-center border border-accent/40 bg-accent/10 font-mono text-sm font-bold text-accent">OC</span>
              <span class="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Session index</span>
            </div>
            <h1 class="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">All your work, one view.</h1>
            <p class="mt-2 max-w-xl text-sm leading-6 text-zinc-500">Open any session in the official OpenCode web UI.</p>
          </div>
          <div class="flex items-center gap-2 font-mono text-xs text-zinc-500">
            <span id="status-dot" class="size-1.5 rounded-full bg-zinc-600"></span>
            <span id="status">Connecting</span>
          </div>
        </div>
      </header>

      <section class="sticky top-0 z-10 -mx-2 mb-4 border-y border-line bg-canvas/95 px-2 py-3 backdrop-blur">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label class="relative min-w-0 flex-1">
            <span class="sr-only">Search sessions</span>
            <span class="pointer-events-none absolute inset-y-0 left-3 grid place-items-center font-mono text-xs text-zinc-600">/</span>
            <input id="search" type="search" placeholder="Search title, project, directory, model..." class="h-10 w-full border border-line bg-panel pl-8 pr-3 font-mono text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600" />
          </label>
          <button id="scope" type="button" class="h-10 border border-line bg-panel px-4 font-mono text-xs text-zinc-300 transition hover:border-zinc-600 hover:bg-raised">Show all</button>
          <button id="refresh" type="button" class="h-10 border border-line px-4 font-mono text-xs text-zinc-500 transition hover:border-zinc-600 hover:text-zinc-200">Refresh</button>
        </div>
      </section>

      <div class="mb-3 flex items-center justify-between font-mono text-xs text-zinc-600">
        <span id="count">0 sessions</span>
        <span id="scope-label">Updated within 24 hours</span>
      </div>

      <main id="sessions" class="space-y-2" aria-live="polite"></main>

      <div id="empty" class="hidden border border-dashed border-line px-6 py-16 text-center">
        <p class="font-mono text-sm text-zinc-400">No sessions match this view.</p>
        <p class="mt-2 text-xs text-zinc-600">Change the search or show all sessions.</p>
      </div>
    </div>

    <script>
      const ACTIVE_WINDOW = 24 * 60 * 60 * 1000
      const WEB_URL_OVERRIDE = ${JSON.stringify(webUrlOverride)}
      const state = { sessions: [], showAll: false, query: '', loading: false }
      const elements = {
        count: document.querySelector('#count'),
        empty: document.querySelector('#empty'),
        list: document.querySelector('#sessions'),
        refresh: document.querySelector('#refresh'),
        scope: document.querySelector('#scope'),
        scopeLabel: document.querySelector('#scope-label'),
        search: document.querySelector('#search'),
        status: document.querySelector('#status'),
        statusDot: document.querySelector('#status-dot')
      }

      function webBaseUrl() {
        if (WEB_URL_OVERRIDE) return WEB_URL_OVERRIDE.replace(/\/$/, '')
        return location.protocol + '//' + location.hostname + ':4096'
      }

      function relativeTime(timestamp) {
        const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000))
        if (seconds < 60) return 'now'
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return minutes + 'm ago'
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return hours + 'h ago'
        const days = Math.floor(hours / 24)
        if (days < 30) return days + 'd ago'
        return new Date(timestamp).toLocaleDateString()
      }

      function number(value) {
        return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
      }

      function modelName(session) {
        if (!session.model?.id) return ''
        return session.model.providerID ? session.model.providerID + '/' + session.model.id : session.model.id
      }

      function addText(parent, tag, className, value) {
        const element = document.createElement(tag)
        element.className = className
        element.textContent = value
        parent.append(element)
        return element
      }

      function createSessionRow(session) {
        const link = document.createElement('a')
        link.href = webBaseUrl() + session.hrefPath
        link.target = '_blank'
        link.rel = 'noreferrer'
        link.className = 'group block border border-line bg-panel px-4 py-4 transition hover:border-zinc-600 hover:bg-raised sm:px-5'

        const layout = document.createElement('div')
        layout.className = 'flex items-start gap-4'
        link.append(layout)

        const activity = document.createElement('span')
        const fresh = Date.now() - session.time.updated < 10 * 60 * 1000
        activity.className = 'mt-2 size-1.5 shrink-0 rounded-full ' + (fresh ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]' : 'bg-zinc-700')
        layout.append(activity)

        const content = document.createElement('div')
        content.className = 'min-w-0 flex-1'
        layout.append(content)

        const top = document.createElement('div')
        top.className = 'flex min-w-0 items-start justify-between gap-4'
        content.append(top)

        const title = addText(top, 'h2', 'truncate text-sm font-medium text-zinc-200 transition group-hover:text-white sm:text-base', session.title || 'Untitled session')
        title.title = session.title || 'Untitled session'
        addText(top, 'time', 'shrink-0 font-mono text-xs text-zinc-600', relativeTime(session.time.updated))

        const directory = addText(content, 'p', 'mt-1 truncate font-mono text-xs text-zinc-600', session.directory)
        directory.title = session.directory

        const meta = document.createElement('div')
        meta.className = 'mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] text-zinc-500'
        content.append(meta)
        addText(meta, 'span', 'border border-accent/20 bg-accent/5 px-2 py-1 text-accent/80', session.project)

        const model = modelName(session)
        if (model) addText(meta, 'span', '', model)
        if (session.agent) addText(meta, 'span', '', session.agent)
        if (session.totalTokens) addText(meta, 'span', '', number(session.totalTokens) + ' tokens')
        if (typeof session.cost === 'number' && session.cost > 0) {
          addText(meta, 'span', '', '$' + session.cost.toFixed(3))
        }

        addText(layout, 'span', 'mt-0.5 shrink-0 font-mono text-xs text-zinc-700 transition group-hover:text-accent', 'OPEN')
        return link
      }

      function render() {
        const query = state.query.trim().toLowerCase()
        const cutoff = Date.now() - ACTIVE_WINDOW
        const sessions = state.sessions.filter((session) => {
          if (!state.showAll && session.time.updated < cutoff) return false
          if (!query) return true
          return [session.title, session.project, session.directory, modelName(session), session.agent]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query))
        })

        elements.list.replaceChildren(...sessions.map(createSessionRow))
        elements.empty.classList.toggle('hidden', sessions.length !== 0)
        elements.count.textContent = sessions.length + (sessions.length === 1 ? ' session' : ' sessions')
        elements.scope.textContent = state.showAll ? 'Show active' : 'Show all'
        elements.scopeLabel.textContent = state.showAll ? 'All root sessions' : 'Updated within 24 hours'
      }

      async function load() {
        if (state.loading) return
        state.loading = true
        elements.refresh.disabled = true
        elements.refresh.textContent = 'Loading'
        try {
          const response = await fetch('/api/sessions', { cache: 'no-store' })
          if (!response.ok) throw new Error('Request failed with status ' + response.status)
          const payload = await response.json()
          state.sessions = payload.sessions
          elements.status.textContent = payload.failedProjects
            ? 'Partial data (' + payload.failedProjects + ' failed)'
            : 'Live'
          elements.statusDot.className = 'size-1.5 rounded-full ' + (payload.failedProjects ? 'bg-amber-400' : 'bg-emerald-400')
          render()
        } catch (error) {
          elements.status.textContent = error instanceof Error ? error.message : 'Connection failed'
          elements.statusDot.className = 'size-1.5 rounded-full bg-red-400'
        } finally {
          state.loading = false
          elements.refresh.disabled = false
          elements.refresh.textContent = 'Refresh'
        }
      }

      elements.search.addEventListener('input', (event) => {
        state.query = event.target.value
        render()
      })
      elements.scope.addEventListener('click', () => {
        state.showAll = !state.showAll
        render()
      })
      elements.refresh.addEventListener('click', load)
      load()
      setInterval(load, 5_000)
    </script>
  </body>
</html>`

export const SessionDashboardPlugin: Plugin = async ({ client }) => {
  const app = new Hono()
  let server: ReturnType<typeof Bun.serve> | undefined
  let nextStartAttempt = 0
  let cached: { expiresAt: number; payload: DashboardPayload } | undefined
  let pending: Promise<DashboardPayload> | undefined

  async function log(level: 'info' | 'warn' | 'error', message: string): Promise<void> {
    try {
      await client.app.log({
        body: {
          service: 'session-dashboard',
          level,
          message
        }
      })
    } catch (error) {
      console.error('[session-dashboard]', error)
    }
  }

  async function collectSessions(): Promise<DashboardPayload> {
    if (cached && cached.expiresAt > Date.now()) return cached.payload
    if (pending) return pending

    pending = (async () => {
      const projectsResponse = await client.project.list()
      if (!projectsResponse.data) throw new Error('Could not load OpenCode projects.')

      const requests = [
        client.session.list(),
        ...projectsResponse.data
          .filter((project) => project.id !== 'global')
          .map((project) => client.session.list({ query: { directory: project.worktree } }))
      ]
      const responses = await Promise.allSettled(requests)
      const sessions = new Map<string, SessionRecord>()
      let failedProjects = 0

      for (const response of responses) {
        if (response.status === 'rejected' || !response.value.data) {
          failedProjects++
          continue
        }
        for (const session of response.value.data as SessionRecord[]) {
          if (!session.parentID) sessions.set(session.id, session)
        }
      }

      const payload: DashboardPayload = {
        sessions: [...sessions.values()]
          .sort((left, right) => right.time.updated - left.time.updated)
          .map((session) => ({
            ...session,
            hrefPath: sessionHrefPath(session),
            project: projectName(session.directory),
            totalTokens: totalTokens(session)
          })),
        failedProjects,
        generatedAt: Date.now()
      }
      cached = { expiresAt: Date.now() + cacheDuration, payload }
      return payload
    })().finally(() => {
      pending = undefined
    })

    return pending
  }

  async function dashboardIsHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`http://${healthHost}:${port}/health`, {
        signal: AbortSignal.timeout(300)
      })
      if (!response.ok) return false
      const body = (await response.json()) as Record<string, unknown>
      return body.service === 'session-dashboard' && body.status === 'ok'
    } catch (error) {
      if (error instanceof Error && error.name !== 'TimeoutError') return false
      return false
    }
  }

  async function ensureServer(): Promise<void> {
    if (server || nextStartAttempt > Date.now()) return
    nextStartAttempt = Date.now() + retryDuration
    if (await dashboardIsHealthy()) return

    try {
      server = Bun.serve({
        fetch: app.fetch,
        hostname: host,
        port
      })
      await log('info', `Session dashboard listening on http://${host}:${port}`)
    } catch (error) {
      await log('warn', `Session dashboard could not bind port ${port}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  app.get('/health', (context) =>
    context.json({ service: 'session-dashboard', status: 'ok', pid: process.pid })
  )
  app.get('/api/sessions', async (context) => {
    try {
      return context.json(await collectSessions())
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : String(error) }, 500)
    }
  })
  app.get('/', (context) => context.html(page))
  app.notFound((context) => context.json({ error: 'Not found.' }, 404))

  await ensureServer()

  return {
    dispose: async () => {
      await server?.stop(true)
      server = undefined
    },
    event: async ({ event }) => {
      if (event.type === 'session.created' || event.type === 'session.updated' || event.type === 'session.deleted') {
        cached = undefined
      }
      await ensureServer()
    }
  }
}
