// @ts-nocheck

import { Database } from 'bun:sqlite'
import type { Plugin } from '@opencode-ai/plugin'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { Hono } from 'hono'

type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | Array<Record<string, unknown>> | null
}

type ChatCompletionRequest = {
  model: string
  messages: ChatMessage[]
  stream?: boolean
}

type AgyUsage = {
  input_tokens?: number
  output_tokens?: number
  thinking_tokens?: number
  cache_read_tokens?: number
  total_tokens?: number
}

type AgyResult = {
  conversationId?: string
  response: string
  usage: AgyUsage
}

type RequestMetadata = {
  sessionId: string
  messageId: string
  agent: string
  cwd: string
  mode: 'plan' | 'build'
  ephemeral: boolean
}

type CachedResponse = {
  response: string
  conversation_id: string | null
  usage_json: string
}

type ConversationRow = {
  conversation_id: string
  cwd: string
}

const host = process.env.AGY_PROXY_HOST?.trim() || '127.0.0.1'
const port = Number(process.env.AGY_PROXY_PORT || '8787')
const agyBinary = process.env.AGY_PROXY_BINARY?.trim() || 'agy'
const agyTimeout = process.env.AGY_PROXY_TIMEOUT?.trim() || '10m'
const dataHome = process.env.XDG_DATA_HOME?.trim() || join(homedir(), '.local', 'share')
const stateDirectory = resolve(process.env.AGY_PROXY_STATE_DIR?.trim() || join(dataHome, 'opencode', 'agy-proxy'))
const defaultModels = ['gemini-3.7-flash-high']
const models = (process.env.AGY_PROXY_MODELS?.split(',') ?? defaultModels).map((model) => model.trim()).filter(Boolean)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid AGY_PROXY_PORT: ${process.env.AGY_PROXY_PORT}`)
}

mkdirSync(stateDirectory, { recursive: true })
const database = new Database(join(stateDirectory, 'state.sqlite'), { create: true })
database.run('PRAGMA journal_mode = WAL')
database.run(`
  CREATE TABLE IF NOT EXISTS conversations (
    session_id TEXT NOT NULL,
    agent TEXT NOT NULL,
    cwd TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (session_id, agent)
  )
`)
database.run(`
  CREATE TABLE IF NOT EXISTS requests (
    message_id TEXT PRIMARY KEY,
    response TEXT NOT NULL,
    conversation_id TEXT,
    usage_json TEXT NOT NULL,
    completed_at INTEGER NOT NULL
  )
`)

const getConversationQuery = database.query<ConversationRow, [string, string]>(
  'SELECT conversation_id, cwd FROM conversations WHERE session_id = ? AND agent = ?'
)
const upsertConversationQuery = database.query(
  `INSERT INTO conversations (session_id, agent, cwd, conversation_id, updated_at)
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(session_id, agent) DO UPDATE SET
     cwd = excluded.cwd,
     conversation_id = excluded.conversation_id,
     updated_at = excluded.updated_at`
)
const getCachedResponseQuery = database.query<CachedResponse, [string]>(
  'SELECT response, conversation_id, usage_json FROM requests WHERE message_id = ?'
)
const cacheResponseQuery = database.query(
  `INSERT OR REPLACE INTO requests
   (message_id, response, conversation_id, usage_json, completed_at)
   VALUES (?, ?, ?, ?, ?)`
)

const locks = new Map<string, Promise<void>>()

async function withSessionLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve()
  let release = () => {}
  const current = new Promise<void>((resolveLock) => {
    release = resolveLock
  })
  const queued = previous.then(() => current)
  locks.set(key, queued)
  await previous

  try {
    return await operation()
  } finally {
    release()
    if (locks.get(key) === queued) locks.delete(key)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseRequest(value: unknown): ChatCompletionRequest {
  if (!isRecord(value) || typeof value.model !== 'string' || !Array.isArray(value.messages)) {
    throw new Error('Request must contain a model and messages array.')
  }

  const messages = value.messages.map((message) => {
    if (
      !isRecord(message) ||
      !['system', 'user', 'assistant', 'tool'].includes(String(message.role)) ||
      !(typeof message.content === 'string' || message.content === null || Array.isArray(message.content))
    ) {
      throw new Error('Request contains an invalid message.')
    }
    return {
      role: message.role as ChatMessage['role'],
      content: message.content as ChatMessage['content']
    }
  })

  return {
    model: value.model,
    messages,
    stream: value.stream === true
  }
}

function textFromContent(content: ChatMessage['content']): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .flatMap((part) => {
      if (typeof part.text === 'string') return [part.text]
      if (typeof part.content === 'string') return [part.content]
      return []
    })
    .join('\n')
}

function latestUserPrompt(messages: ChatMessage[]): string {
  const message = messages.findLast((candidate) => candidate.role === 'user')
  const prompt = message ? textFromContent(message.content).trim() : ''
  if (!prompt) throw new Error('Request does not contain a non-empty user message.')
  return prompt
}

function validDirectory(value: string | null): string {
  const cwd = resolve(value?.trim() || process.cwd())
  if (!existsSync(cwd) || !statSync(cwd).isDirectory()) {
    throw new Error(`Working directory does not exist: ${cwd}`)
  }
  return cwd
}

function metadataFromHeaders(headers: Headers): RequestMetadata {
  const sessionId = headers.get('x-opencode-session-id')?.trim() || crypto.randomUUID()
  const messageId = headers.get('x-opencode-message-id')?.trim() || crypto.randomUUID()
  const agent = headers.get('x-opencode-agent')?.trim() || 'unknown'
  const mode = headers.get('x-agy-mode') === 'build' ? 'build' : 'plan'
  return {
    sessionId,
    messageId,
    agent,
    cwd: validDirectory(headers.get('x-opencode-cwd')),
    mode,
    ephemeral: headers.get('x-agy-ephemeral') === 'true'
  }
}

function finiteToken(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined
}

function usageFrom(value: unknown): AgyUsage {
  if (!isRecord(value)) return {}
  return {
    input_tokens: finiteToken(value.input_tokens),
    output_tokens: finiteToken(value.output_tokens),
    thinking_tokens: finiteToken(value.thinking_tokens),
    cache_read_tokens: finiteToken(value.cache_read_tokens),
    total_tokens: finiteToken(value.total_tokens)
  }
}

function openAiUsage(usage: AgyUsage) {
  const promptTokens = usage.input_tokens ?? 0
  const completionTokens = usage.output_tokens ?? 0
  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: usage.total_tokens ?? promptTokens + completionTokens,
    prompt_tokens_details: {
      cached_tokens: usage.cache_read_tokens ?? 0
    },
    completion_tokens_details: {
      reasoning_tokens: usage.thinking_tokens ?? 0
    }
  }
}

function storedConversation(metadata: RequestMetadata): string | undefined {
  if (metadata.ephemeral) return undefined
  const row = getConversationQuery.get(metadata.sessionId, metadata.agent)
  return row?.cwd === metadata.cwd ? row.conversation_id : undefined
}

function storeConversation(metadata: RequestMetadata, conversationId: string): void {
  if (metadata.ephemeral) return
  upsertConversationQuery.run(metadata.sessionId, metadata.agent, metadata.cwd, conversationId, Date.now())
}

function cachedResponse(messageId: string): AgyResult | undefined {
  const cached = getCachedResponseQuery.get(messageId)
  if (!cached) return undefined
  return {
    conversationId: cached.conversation_id ?? undefined,
    response: cached.response,
    usage: JSON.parse(cached.usage_json) as AgyUsage
  }
}

function cacheResponse(messageId: string, result: AgyResult): void {
  cacheResponseQuery.run(
    messageId,
    result.response,
    result.conversationId ?? null,
    JSON.stringify(result.usage),
    Date.now()
  )
}

async function runAgy(input: {
  prompt: string
  model: string
  metadata: RequestMetadata
  signal: AbortSignal
  onDelta?: (delta: string) => void
}): Promise<AgyResult> {
  const conversationId = storedConversation(input.metadata)
  const args = [
    agyBinary,
    '--output-format',
    'stream-json',
    '--print-timeout',
    agyTimeout,
    '--model',
    input.model,
    '--mode',
    input.metadata.mode === 'build' ? 'accept-edits' : 'plan',
    '--add-dir',
    input.metadata.cwd
  ]

  if (input.metadata.mode === 'build') {
    args.push('--dangerously-skip-permissions')
  }
  if (conversationId) {
    args.push('--conversation', conversationId)
  }
  const workspaceContext = [
    `The active workspace root is ${input.metadata.cwd}.`,
    'Treat this directory as the project and use its files for project context.',
    input.metadata.mode === 'plan'
      ? 'Use read-only file tools inside this workspace and do not inspect Antigravity app-data as the project.'
      : 'Do not inspect Antigravity app-data as the project.'
  ].join('\n')
  args.push('-p', `${workspaceContext}\n\n${input.prompt}`)

  const subprocess = Bun.spawn(args, {
    cwd: input.metadata.cwd,
    env: process.env,
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe'
  })
  let exited = false
  const abort = () => {
    if (exited) return
    subprocess.kill('SIGTERM')
    setTimeout(() => {
      if (!exited) subprocess.kill('SIGKILL')
    }, 2_000).unref()
  }
  input.signal.addEventListener('abort', abort, { once: true })

  const stderrPromise = new Response(subprocess.stderr).text()
  const reader = subprocess.stdout.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let response = ''
  let finalResponse = ''
  let finalStatus = ''
  let finalError = ''
  let finalConversationId = conversationId
  let usage: AgyUsage = {}

  const consumeLine = (line: string) => {
    if (!line.trim()) return
    let event: unknown
    try {
      event = JSON.parse(line)
    } catch {
      throw new Error(`Antigravity emitted invalid JSON: ${line.slice(0, 200)}`)
    }
    if (!isRecord(event) || typeof event.event !== 'string') return

    if (event.event === 'init') {
      if (typeof event.conversation_id === 'string') {
        finalConversationId = event.conversation_id
        storeConversation(input.metadata, event.conversation_id)
      }
      return
    }

    if (event.event === 'step_update' && isRecord(event.step_update)) {
      const step = event.step_update
      if (step.step_type === 'agent_response' && typeof step.text_delta === 'string') {
        response += step.text_delta
        input.onDelta?.(step.text_delta)
      }
      if (step.state === 'DONE') usage = { ...usage, ...usageFrom(step.usage) }
      return
    }

    if (event.event === 'result' && isRecord(event.result)) {
      const result = event.result
      if (typeof result.conversation_id === 'string') {
        finalConversationId = result.conversation_id
        storeConversation(input.metadata, result.conversation_id)
      }
      if (typeof result.response === 'string') finalResponse = result.response
      if (typeof result.status === 'string') finalStatus = result.status
      if (typeof result.error === 'string') finalError = result.error
      usage = { ...usage, ...usageFrom(result.usage) }
    }
  }

  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      buffer += decoder.decode(chunk.value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) consumeLine(line)
    }
    buffer += decoder.decode()
    if (buffer.trim()) consumeLine(buffer)

    const exitCode = await subprocess.exited
    exited = true
    const stderr = (await stderrPromise).trim()
    if (input.signal.aborted) throw new DOMException('Request aborted', 'AbortError')
    if (exitCode !== 0 || (finalStatus && finalStatus !== 'SUCCESS')) {
      throw new Error(finalError || stderr || `Antigravity exited with code ${exitCode}.`)
    }

    if (!response && finalResponse) {
      response = finalResponse
      input.onDelta?.(finalResponse)
    }
    if (!response) throw new Error(stderr || 'Antigravity returned no assistant response.')

    return {
      conversationId: finalConversationId,
      response,
      usage
    }
  } finally {
    input.signal.removeEventListener('abort', abort)
    reader.releaseLock()
    if (!exited) abort()
  }
}

function errorBody(message: string, code = 'agy_proxy_error') {
  return {
    error: {
      message,
      type: 'invalid_request_error',
      code
    }
  }
}

function completionBody(model: string, result: AgyResult) {
  return {
    id: `chatcmpl-${crypto.randomUUID()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: result.response },
        finish_reason: 'stop'
      }
    ],
    usage: openAiUsage(result.usage)
  }
}

function sseResponse(input: {
  request: ChatCompletionRequest
  prompt: string
  metadata: RequestMetadata
  requestSignal: AbortSignal
}): Response {
  const id = `chatcmpl-${crypto.randomUUID()}`
  const created = Math.floor(Date.now() / 1000)
  const encoder = new TextEncoder()
  const abortController = new AbortController()
  input.requestSignal.addEventListener('abort', () => abortController.abort(), { once: true })
  let heartbeat: ReturnType<typeof setInterval> | undefined

  const encodeEvent = (value: unknown) => encoder.encode(`data: ${JSON.stringify(value)}\n\n`)
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const lockKey = `${input.metadata.sessionId}:${input.metadata.agent}`
      controller.enqueue(
        encodeEvent({
          id,
          object: 'chat.completion.chunk',
          created,
          model: input.request.model,
          choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }]
        })
      )
      heartbeat = setInterval(() => controller.enqueue(encoder.encode(': keep-alive\n\n')), 10_000)

      try {
        const result = await withSessionLock(lockKey, async () => {
          const cached = cachedResponse(input.metadata.messageId)
          if (cached) {
            controller.enqueue(
              encodeEvent({
                id,
                object: 'chat.completion.chunk',
                created,
                model: input.request.model,
                choices: [{ index: 0, delta: { content: cached.response }, finish_reason: null }]
              })
            )
            return cached
          }

          const next = await runAgy({
            prompt: input.prompt,
            model: input.request.model,
            metadata: input.metadata,
            signal: abortController.signal,
            onDelta: (delta) => {
              controller.enqueue(
                encodeEvent({
                  id,
                  object: 'chat.completion.chunk',
                  created,
                  model: input.request.model,
                  choices: [{ index: 0, delta: { content: delta }, finish_reason: null }]
                })
              )
            }
          })
          cacheResponse(input.metadata.messageId, next)
          return next
        })

        controller.enqueue(
          encodeEvent({
            id,
            object: 'chat.completion.chunk',
            created,
            model: input.request.model,
            choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
            usage: openAiUsage(result.usage)
          })
        )
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        if (!abortController.signal.aborted) {
          controller.enqueue(encodeEvent(errorBody(error instanceof Error ? error.message : String(error))))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      } finally {
        if (heartbeat) clearInterval(heartbeat)
      }
    },
    cancel() {
      abortController.abort()
      if (heartbeat) clearInterval(heartbeat)
    }
  })

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream; charset=utf-8',
      'X-Accel-Buffering': 'no'
    }
  })
}

const app = new Hono()

app.get('/health', (context) =>
  context.json({ service: 'agy-proxy', status: 'ok', pid: process.pid, agyBinary, models: models.length })
)

app.get('/v1/models', (context) =>
  context.json({
    object: 'list',
    data: models.map((model) => ({
      id: model,
      object: 'model',
      created: 0,
      owned_by: 'antigravity-cli'
    }))
  })
)

app.post('/v1/chat/completions', async (context) => {
  try {
    const request = parseRequest(await context.req.json())
    if (!models.includes(request.model)) {
      return context.json(errorBody(`Unknown model: ${request.model}`, 'model_not_found'), 404)
    }
    const prompt = latestUserPrompt(request.messages)
    const metadata = metadataFromHeaders(context.req.raw.headers)

    if (request.stream) {
      return sseResponse({
        request,
        prompt,
        metadata,
        requestSignal: context.req.raw.signal
      })
    }

    const lockKey = `${metadata.sessionId}:${metadata.agent}`
    const result = await withSessionLock(lockKey, async () => {
      const cached = cachedResponse(metadata.messageId)
      if (cached) return cached
      const next = await runAgy({
        prompt,
        model: request.model,
        metadata,
        signal: context.req.raw.signal
      })
      cacheResponse(metadata.messageId, next)
      return next
    })
    return context.json(completionBody(request.model, result))
  } catch (error) {
    return context.json(errorBody(error instanceof Error ? error.message : String(error)), 400)
  }
})

app.notFound((context) => context.json(errorBody('Not found.', 'not_found'), 404))

const proxyUrl = `http://127.0.0.1:${port}`
const planAgents = new Set(['plan', 'explore', 'title', 'summary', 'compaction'])
const buildAgents = new Set(['build', 'general'])
const ephemeralAgents = new Set(['title', 'summary', 'compaction'])
let startupPromise: Promise<void> | undefined

async function proxyIsHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`${proxyUrl}/health`, {
      signal: AbortSignal.timeout(500)
    })
    if (!response.ok) return false
    const body = (await response.json()) as Record<string, unknown>
    return body.status === 'ok' && body.service === 'agy-proxy'
  } catch {
    return false
  }
}

async function startDetachedProxy(): Promise<void> {
  const bunPath = Bun.which('bun') ?? 'bun'
  const nohupPath = process.platform === 'win32' ? undefined : Bun.which('nohup')
  const command = nohupPath ? [nohupPath, bunPath, 'run', import.meta.path] : [bunPath, 'run', import.meta.path]
  const subprocess = Bun.spawn(command, {
    cwd: import.meta.dir,
    env: process.env,
    stdin: 'ignore',
    stdout: 'ignore',
    stderr: 'ignore'
  })
  subprocess.unref()

  for (let attempt = 0; attempt < 50; attempt++) {
    if (await proxyIsHealthy()) return
    if (subprocess.exitCode !== null) break
    await Bun.sleep(100)
  }

  throw new Error(`agy-proxy did not become healthy at ${proxyUrl}.`)
}

async function ensureProxy(): Promise<void> {
  if (await proxyIsHealthy()) return
  startupPromise ??= startDetachedProxy().finally(() => {
    startupPromise = undefined
  })
  await startupPromise
}

export const AntigravityProxyPlugin: Plugin = async ({ client, directory }) => {
  try {
    await ensureProxy()
  } catch (error) {
    await client.app.log({
      body: {
        service: 'agy-proxy',
        level: 'error',
        message: error instanceof Error ? error.message : String(error)
      }
    })
  }

  return {
    'chat.headers': async (input, output) => {
      if (input.model.providerID !== 'antigravity') return
      await ensureProxy()

      const mode = buildAgents.has(input.agent) ? 'build' : planAgents.has(input.agent) ? 'plan' : 'plan'

      output.headers['x-opencode-session-id'] = input.sessionID
      output.headers['x-opencode-message-id'] = input.message.id
      output.headers['x-opencode-agent'] = input.agent
      output.headers['x-opencode-cwd'] = directory
      output.headers['x-agy-mode'] = mode
      output.headers['x-agy-ephemeral'] = ephemeralAgents.has(input.agent) ? 'true' : 'false'
    },
    'experimental.compaction.autocontinue': async (input, output) => {
      if (input.provider.info.id === 'antigravity') {
        output.enabled = false
      }
    }
  }
}

if (import.meta.main) {
  console.log(`agy-proxy listening on http://${host}:${port}`)
  Bun.serve({
    fetch: app.fetch,
    hostname: host,
    port
  })
}
