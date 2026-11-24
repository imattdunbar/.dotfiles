import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable, Writable } from 'node:stream'
import { pathToFileURL } from 'node:url'
import * as acp from '@agentclientprotocol/sdk'
import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3Content,
  LanguageModelV3FinishReason,
  LanguageModelV3StreamPart,
  LanguageModelV3Usage
} from '@ai-sdk/provider'
import { Model, Provider, type Plugin } from '@opencode/plugin'

const providerID = Provider.ID.make('antigravity')
const packageName = pathToFileURL(join(homedir(), '.config', 'scripts', 'oc-dunbar', 'antigravity.ts')).href
const providerPackage = `aisdk:${packageName}`
const families = [
  { id: 'gemini-4-neon', name: 'Gemini 4 Neon', efforts: ['low', 'medium', 'high', 'xhigh'] },
  { id: 'gemini-4-argon', name: 'Gemini 4 Argon', efforts: ['low', 'medium', 'high'] },
  { id: 'gemini-4-hydrogen', name: 'Gemini 4 Hydrogen', efforts: ['low', 'medium', 'high', 'xhigh'] }
]
const usage: LanguageModelV3Usage = {
  inputTokens: { total: undefined, noCache: undefined, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: undefined, text: undefined, reasoning: undefined }
}
const methods = acp.methods.agent.session

// The built-in loader resolves the package before the location plugin supplies its SDK.
export function createAntigravity() {
  return {
    languageModel() {
      throw new Error('oc-dunbar did not supply the Antigravity provider for this location.')
    }
  }
}

type Live = {
  agent: acp.ClientContext
  id: string
  config: acp.SessionConfigOption[]
  promptHistory: string[]
  onUpdate?: (update: acp.SessionNotification['update']) => void
  close: () => void
  closed: AbortSignal
}

function choices(config: acp.SessionConfigOption & { type: 'select' }) {
  return config.options.flatMap((option) => ('value' in option ? [option] : option.options))
}

async function open(
  cwd: string,
  sandbox: boolean,
  readOnly: boolean,
  mcpServers: acp.McpServer[],
  signal: AbortSignal
): Promise<Live> {
  const installed = join(homedir(), '.local', 'bin', 'agy')
  // agy needs a per-session worker to connect HTTP MCP servers that a client supplies.
  const args = ['acp', '--process-per-session', ...(sandbox ? ['--sandbox'] : [])]
  const child = spawn(existsSync(installed) ? installed : 'agy', args, {
    cwd,
    stdio: ['pipe', 'pipe', 'ignore']
  })
  let connection: acp.ClientConnection | undefined
  const close = () => {
    connection?.close()
    child.kill()
  }
  try {
    await once(child, 'spawn', { signal })
    let live: Live | undefined
    connection = acp
      .client({ name: 'oc-dunbar' })
      .onRequest(acp.methods.client.session.requestPermission, ({ params }) => {
        // OpenCode 2.0.26 gives plugins no permission prompt, so decide here.
        // agy's own rules and Plan mode still apply before it asks.
        const mutates = ['edit', 'delete', 'move'].includes(params.toolCall.kind ?? '')
        const kind = readOnly && mutates ? 'reject_once' : 'allow_once'
        const choice = params.options.find((option) => option.kind === kind)
        if (choice) return { outcome: { outcome: 'selected', optionId: choice.optionId } }
        return { outcome: { outcome: 'cancelled' } }
      })
      .onNotification(acp.methods.client.session.update, ({ params }) => {
        if (!live || params.sessionId !== live.id) return
        if (params.update.sessionUpdate === 'config_option_update') live.config = params.update.configOptions
        live.onUpdate?.(params.update)
      })
      .connect(
        acp.ndJsonStream(Writable.toWeb(child.stdin), Readable.toWeb(child.stdout) as ReadableStream<Uint8Array>)
      )
    const agent = connection.agent
    const requestOptions = { cancellationSignal: signal, stopWaitingOnCancel: true }
    const init = await agent.request(
      acp.methods.agent.initialize,
      { protocolVersion: acp.PROTOCOL_VERSION },
      requestOptions
    )
    const caps = init.agentCapabilities?.mcpCapabilities
    const servers = mcpServers.filter((server) => {
      if (!('type' in server)) return true
      return server.type === 'http' ? caps?.http === true : caps?.sse === true
    })
    const session = await agent.request(methods.new, { cwd, mcpServers: servers }, requestOptions)
    live = {
      agent,
      id: session.sessionId,
      config: session.configOptions ?? [],
      promptHistory: [],
      close,
      closed: connection.signal
    }
    return live
  } catch (error) {
    close()
    throw error
  }
}

async function select(live: Live, modelId: string, effort: string | undefined, readOnly: boolean, signal: AbortSignal) {
  const set = async (configId: string, value: string) => {
    const result = await live.agent.request(
      methods.setConfigOption,
      {
        sessionId: live.id,
        configId,
        value
      },
      { cancellationSignal: signal, stopWaitingOnCancel: true }
    )
    live.config = result.configOptions
  }
  const model = live.config.find(
    (option) => option.type === 'select' && (option.category === 'model' || option.id === 'model')
  )
  if (model?.type !== 'select') throw new Error('Antigravity did not return an ACP model selector.')

  const values = choices(model)
  const levelName = effort ?? 'medium'
  const requested = `${modelId}-${levelName}`
  const exact = values.find((option) => option.value === requested)
  const selection = exact ?? values.find((option) => option.value === modelId)
  if (!selection) throw new Error(`Antigravity does not offer ${requested} through ACP.`)
  if (selection.value !== model.currentValue) await set(model.id, selection.value)

  if (!exact) {
    const level = live.config.find((option) => option.category === 'thought_level')
    if (level?.type !== 'select') throw new Error(`Antigravity does not expose an effort selector for ${modelId}.`)
    const aliases = levelName === 'xhigh' ? ['xhigh', 'extra', 'extra_high'] : [levelName]
    const value = choices(level).find((choice) =>
      [choice.value, choice.name].some((text) => aliases.includes(text.toLowerCase().trim().replace(/[- ]+/g, '_')))
    )
    if (!value) throw new Error(`Antigravity does not offer ${levelName} effort for ${modelId}.`)
    if (value.value !== level.currentValue) await set(level.id, value.value)
  }

  if (readOnly) {
    const mode = live.config.find((option) => option.category === 'mode' || option.id === 'mode')
    const plan = mode?.type === 'select' ? choices(mode).find((option) => option.value === 'plan') : undefined
    if (mode?.type !== 'select' || !plan) throw new Error('Antigravity does not expose Plan mode through ACP.')
    if (mode.currentValue !== plan.value) await set(mode.id, plan.value)
  }
}

function transcript(prompt: LanguageModelV3CallOptions['prompt']) {
  return prompt.flatMap((message): { role: string; text: string }[] => {
    if (message.role === 'system') return [{ role: message.role, text: message.content }]
    const text = message.content.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join('\n')
    return text ? [{ role: message.role, text }] : []
  })
}

export async function setupAntigravity(ctx: Plugin.Context) {
  const sessions = new Map<string, Live>()
  const busy = new Set<string>()
  const lifetime = new AbortController()
  // OpenCode connects its MCP servers itself, so agy only sees them when the session lists them.
  let mcpServers: acp.McpServer[] = []
  const expand = (value: string) => value.replace(/\{env:(\w+)\}/g, (_, name) => process.env[name] ?? '')
  await ctx.mcp.transform((editor) => {
    mcpServers = editor.list().flatMap(([name, server]): acp.McpServer[] => {
      if (server.disabled) return []
      if (server.type === 'remote') {
        const headers = Object.entries(server.headers ?? {}).map(([key, value]) => ({ name: key, value: expand(value) }))
        return [{ type: 'http', name, url: server.url, headers }]
      }
      const [command, ...args] = server.command.map(expand)
      if (!command) return []
      const env = Object.entries(server.environment ?? {}).map(([key, value]) => ({ name: key, value: expand(value) }))
      return [{ name, command: Bun.which(command) ?? command, args, env }]
    })
  })
  const isAntigravity = (model: { providerID: string }) => model.providerID === providerID
  await ctx.provider.transform((editor) => {
    editor.add({
      info: {
        ...Provider.Info.empty(providerID),
        name: 'Antigravity',
        activation: 'enabled',
        package: providerPackage
      },
      models: families.map(({ id, name, efforts }) => ({
        ...Model.Info.default(providerID, Model.ID.make(id)),
        name,
        capabilities: { tools: false, input: ['text'], output: ['text'] },
        variants: efforts.map((effort) => ({ id: Model.VariantID.make(effort), settings: { agyEffort: effort } }))
      }))
    })
  })
  await ctx.session.hook('context', (event) => {
    if (!isAntigravity(event.model)) return
    event.options.agySession = event.sessionID
    event.options.agyPlan = event.agent === 'plan'
    // OpenCode reports "default" when no variant is chosen; select() then uses medium.
    const variant = event.model.variant
    if (variant && ['low', 'medium', 'high', 'xhigh'].includes(variant)) event.options.agyEffort = variant
  })
  await ctx.session.hook('retry', (event) => {
    // An ACP turn can already have changed files when a transport error occurs.
    if (isAntigravity(event.model)) event.decision = { retry: false }
  })

  async function run(
    modelId: string,
    options: LanguageModelV3CallOptions,
    emit: (part: LanguageModelV3StreamPart) => void,
    cancel?: AbortSignal
  ) {
    const extra = options.providerOptions?.antigravity
    const id = typeof extra?.agySession === 'string' ? extra.agySession : undefined
    const readOnly = extra?.agyPlan === true
    const effort = typeof extra?.agyEffort === 'string' ? extra.agyEffort : undefined
    const key = id ? `${id}:${readOnly ? 'plan' : 'build'}` : undefined
    const signal = AbortSignal.any([
      lifetime.signal,
      ...[options.abortSignal, cancel].filter((item) => item !== undefined)
    ])
    const history = transcript(options.prompt)
    const prompts = history.filter((message) => message.role === 'user').map((message) => message.text)
    const latest = prompts.at(-1)
    if (!latest) throw new Error('Antigravity needs a text prompt.')
    if (key && busy.has(key)) throw new Error('An Antigravity turn is already active in this session.')
    if (key) busy.add(key)

    let live: Live | undefined
    let scratch: string | undefined
    try {
      signal.throwIfAborted()
      live = key ? sessions.get(key) : undefined
      if (
        live &&
        (live.closed.aborted ||
          live.promptHistory.length !== prompts.length - 1 ||
          !live.promptHistory.every((text, index) => text === prompts[index]))
      ) {
        live.close()
        live = undefined
      }
      const resume = !!live
      if (!key) scratch = await mkdtemp(join(tmpdir(), 'oc-dunbar-agy-'))
      live ??= await open(
        scratch ?? ctx.location.directory,
        !key,
        readOnly,
        mcpServers,
        AbortSignal.any([signal, AbortSignal.timeout(30_000)])
      )
      if (key) sessions.set(key, live)
      await select(live, modelId, effort, readOnly, AbortSignal.any([signal, AbortSignal.timeout(30_000)]))

      const turn = live
      const tools = new Map<string, { id: string; name: string }>()
      let block: { type: 'text' | 'reasoning'; id: string } | undefined
      const endBlock = () => {
        if (!block) return
        emit({ type: block.type === 'text' ? 'text-end' : 'reasoning-end', id: block.id })
        block = undefined
      }
      turn.onUpdate = (update) => {
        if (signal.aborted) return
        if (update.sessionUpdate === 'agent_message_chunk' || update.sessionUpdate === 'agent_thought_chunk') {
          if (update.content.type !== 'text') return
          const type = update.sessionUpdate === 'agent_message_chunk' ? 'text' : 'reasoning'
          if (block?.type !== type) {
            endBlock()
            block = { type, id: crypto.randomUUID() }
            emit({ type: type === 'text' ? 'text-start' : 'reasoning-start', id: block.id })
          }
          emit({ type: type === 'text' ? 'text-delta' : 'reasoning-delta', id: block.id, delta: update.content.text })
        }
        if (update.sessionUpdate === 'tool_call' || update.sessionUpdate === 'tool_call_update') {
          endBlock()
          let tool = tools.get(update.toolCallId)
          if (!tool) {
            tool = { id: crypto.randomUUID(), name: update.name ?? `agy_${update.kind ?? 'tool'}` }
            tools.set(update.toolCallId, tool)
            emit({
              type: 'tool-call',
              toolCallId: tool.id,
              toolName: tool.name,
              providerExecuted: true,
              input: JSON.stringify({ title: update.title, input: update.rawInput })
            })
          }
          if (update.status === 'completed' || update.status === 'failed') {
            emit({
              type: 'tool-result',
              toolCallId: tool.id,
              toolName: tool.name,
              result: JSON.stringify(update.content ?? update.rawOutput ?? update.title ?? update.status),
              isError: update.status === 'failed'
            })
            tools.delete(update.toolCallId)
          }
        }
      }
      const text = resume ? latest : history.map(({ role, text }) => `${role}: ${text}`).join('\n\n')
      const abort = () => {
        turn.agent.notify(methods.cancel, { sessionId: turn.id }).catch(() => turn.close())
      }
      signal.addEventListener('abort', abort, { once: true })
      try {
        signal.throwIfAborted()
        const result = await turn.agent.request<acp.PromptResponse>(
          methods.prompt,
          {
            sessionId: turn.id,
            prompt: [{ type: 'text', text }]
          },
          { cancellationSignal: signal, stopWaitingOnCancel: true }
        )
        signal.throwIfAborted()
        endBlock()
        for (const tool of tools.values()) {
          emit({
            type: 'tool-result',
            toolCallId: tool.id,
            toolName: tool.name,
            result: 'Antigravity ended the turn without a tool result.',
            isError: true
          })
        }
        turn.promptHistory = prompts
        const raw = result.stopReason
        const finishReason: LanguageModelV3FinishReason = { raw, unified: 'other' }
        if (raw === 'end_turn') finishReason.unified = 'stop'
        if (raw === 'max_tokens') finishReason.unified = 'length'
        if (raw === 'refusal') finishReason.unified = 'content-filter'
        return finishReason
      } finally {
        turn.onUpdate = undefined
        signal.removeEventListener('abort', abort)
      }
    } catch (error) {
      if (key) sessions.delete(key)
      live?.close()
      throw error
    } finally {
      if (key) busy.delete(key)
      else live?.close()
      if (scratch) await rm(scratch, { recursive: true, force: true })
    }
  }

  function languageModel(modelId: string): LanguageModelV3 {
    return {
      specificationVersion: 'v3',
      provider: providerID,
      modelId,
      supportedUrls: {},
      async doGenerate(options) {
        let text = ''
        const finishReason = await run(modelId, options, (part) => {
          if (part.type === 'text-delta') text += part.delta
        })
        const content: LanguageModelV3Content[] = [{ type: 'text', text }]
        return { content, finishReason, usage, warnings: [] }
      },
      async doStream(options) {
        const cancel = new AbortController()
        return {
          stream: new ReadableStream<LanguageModelV3StreamPart>({
            start(controller) {
              controller.enqueue({ type: 'stream-start', warnings: [] })
              run(
                modelId,
                options,
                (part) => {
                  if (!cancel.signal.aborted) controller.enqueue(part)
                },
                cancel.signal
              )
                .then((finishReason) => {
                  if (cancel.signal.aborted) return
                  controller.enqueue({ type: 'finish', finishReason, usage })
                  controller.close()
                })
                .catch((error) => {
                  if (!cancel.signal.aborted) controller.error(error)
                })
            },
            cancel: () => cancel.abort()
          })
        }
      }
    }
  }

  await ctx.aisdk.hook('sdk', (event) => {
    if (event.package === packageName && isAntigravity(event.model)) event.sdk = { languageModel }
  })

  return () => {
    lifetime.abort()
    for (const live of sessions.values()) live.close()
    sessions.clear()
  }
}
