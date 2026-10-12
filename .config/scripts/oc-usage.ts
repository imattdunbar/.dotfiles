import { Database } from 'bun:sqlite'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { z } from 'zod'
import { getChromeCookies } from './cookies'

dayjs.extend(advancedFormat)
dayjs.extend(utc)
dayjs.extend(timezone)

const credentialSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('oauth'),
    access: z.string(),
    metadata: z.object({ accountID: z.string().optional() }).optional()
  }),
  z.object({ type: z.literal('key'), key: z.string() })
])

function readCredential(integrationID: string) {
  const dataDirectory = process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share')
  const databasePath = process.env.OPENCODE_DB || join(dataDirectory, 'opencode', 'opencode.db')
  const db = new Database(databasePath, { readonly: true })

  try {
    // V2 selects the newest credential when imported V1 rows have no active flag.
    const row = db
      .query<{ value: string }, [string]>(
        'SELECT value FROM credential WHERE integration_id = ? ORDER BY active DESC, time_created DESC, id DESC LIMIT 1'
      )
      .get(integrationID)

    if (!row) throw new Error(`No saved credential for ${integrationID}`)
    return credentialSchema.parse(JSON.parse(row.value))
  } finally {
    db.close()
  }
}

function formatReset(value: string | number) {
  const date = typeof value === 'number' ? dayjs.unix(value) : dayjs(value)
  return date.tz(dayjs.tz.guess()).format('MMM D h:mmA z')
}

async function fetchCodexUsage(): Promise<string[]> {
  const credential = readCredential('openai')
  if (credential.type !== 'oauth' || !credential.metadata?.accountID) {
    throw new Error('OpenAI OAuth credential or account ID is absent')
  }

  const response = await fetch('https://chatgpt.com/backend-api/wham/usage', {
    headers: {
      Authorization: `Bearer ${credential.access}`,
      'ChatGPT-Account-Id': credential.metadata.accountID,
      'User-Agent': 'oc-usage'
    },
    signal: AbortSignal.timeout(15_000)
  })
  if (!response.ok) throw new Error(`Usage request failed with HTTP ${response.status}`)

  const usage = z
    .object({
      rate_limit: z.object({
        primary_window: z.object({ used_percent: z.number(), reset_at: z.number() })
      })
    })
    .parse(await response.json())
  const window = usage.rate_limit.primary_window
  const remainingPercent = Math.max(0, 100 - window.used_percent)
  return [`Codex\n${remainingPercent}% remaining | Reset: ${formatReset(window.reset_at)}`]
}

async function fetchClaudeUsage(): Promise<string[]> {
  const result = Bun.spawnSync(['security', 'find-generic-password', '-s', 'Claude Code-credentials', '-w'])
  if (result.exitCode !== 0) return []

  const credential = z
    .object({ claudeAiOauth: z.object({ accessToken: z.string() }) })
    .parse(JSON.parse(result.stdout.toString()))
  const response = await fetch('https://api.anthropic.com/api/oauth/usage', {
    headers: {
      Authorization: `Bearer ${credential.claudeAiOauth.accessToken}`,
      'anthropic-beta': 'oauth-2025-04-20',
      'Content-Type': 'application/json',
      'User-Agent': 'oc-usage'
    },
    signal: AbortSignal.timeout(15_000)
  })
  if (!response.ok) throw new Error(`Usage request failed with HTTP ${response.status}`)

  const windowSchema = z.object({ utilization: z.number(), resets_at: z.string() }).nullable().optional()
  const usage = z
    .object({
      five_hour: windowSchema,
      seven_day: windowSchema,
      seven_day_opus: windowSchema,
      seven_day_sonnet: windowSchema
    })
    .parse(await response.json())
  const windows = [
    ['five_hour', '5 hour'],
    ['seven_day', 'Weekly'],
    ['seven_day_opus', 'Weekly Opus'],
    ['seven_day_sonnet', 'Weekly Sonnet']
  ] as const
  const lines = ['Claude']

  for (const [key, label] of windows) {
    const window = usage[key]
    if (!window) continue
    const remainingPercent = Math.max(0, Math.round((100 - window.utilization) * 10) / 10)
    lines.push(`${label}: ${remainingPercent}% remaining | Reset: ${formatReset(window.resets_at)}`)
  }
  return lines
}

async function fetchGoUsage(): Promise<string[]> {
  const credential = readCredential('opencode-go')
  if (credential.type !== 'key') throw new Error('OpenCode Go API key is absent')

  const response = await fetch('https://opencode.ai/zen/go/v1/usage', {
    headers: { Authorization: `Bearer ${credential.key}`, 'User-Agent': 'oc-usage' },
    signal: AbortSignal.timeout(15_000)
  })
  if (!response.ok) throw new Error(`Usage request failed with HTTP ${response.status}`)

  const windowSchema = z.object({ percent: z.number(), resetsAt: z.string() }).optional()
  const { usage } = z
    .object({ usage: z.object({ rolling: windowSchema, weekly: windowSchema, monthly: windowSchema }) })
    .parse(await response.json())
  const windows = [
    ['rolling', '5 hour'],
    ['weekly', 'Weekly'],
    ['monthly', 'Monthly']
  ] as const
  const lines = ['OpenCode Go']

  for (const [key, label] of windows) {
    const window = usage[key]
    if (!window) continue
    const remainingPercent = Math.max(0, Math.round((100 - window.percent) * 10) / 10)
    lines.push(`${label}: ${remainingPercent}% remaining | Reset: ${formatReset(window.resetsAt)}`)
  }
  return lines
}

async function fetchGitHubCopilotUsage(): Promise<string[]> {
  const cookies = getChromeCookies('github.com')
  if (!cookies?.logged_in) return []

  const cookieHeader = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ')
  const response = await fetch('https://github.com/settings/copilot/features', {
    headers: { Cookie: cookieHeader, 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    signal: AbortSignal.timeout(15_000)
  })
  if (!response.ok) throw new Error(`Usage request failed with HTTP ${response.status}`)

  const html = await response.text()
  const limitMatch = html.match(/([\d,]+) of ([\d,]+) AI credits used/)
  const usedMatch = html.match(/([\d,]+) AI credits used/)
  const cycle = html.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December) \d+-\d+, \d{4}/
  )?.[0]
  if (!usedMatch) return []

  const used = limitMatch
    ? `${usedMatch[1]} of ${limitMatch[2]} AI credits used`
    : `${usedMatch[1]} AI credits used`
  return [`GitHub Copilot\n${used} | Cycle: ${cycle}`]
}

async function getUsage(): Promise<string> {
  const providers = [
    ['Codex', fetchCodexUsage],
    ['Claude', fetchClaudeUsage],
    ['OpenCode Go', fetchGoUsage],
    ['GitHub Copilot', fetchGitHubCopilotUsage]
  ] as const
  const results = await Promise.allSettled(providers.map(([, fetchUsage]) => fetchUsage()))
  const sections: string[] = []

  for (const [index, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      if (result.value.length) sections.push(result.value.join('\n'))
      continue
    }
    // Credential parse failures must never expose token values in the output.
    sections.push(`${providers[index][0]}\nUsage unavailable`)
  }
  return sections.join('\n\n') || 'No provider usage available.'
}

console.log(await getUsage())
