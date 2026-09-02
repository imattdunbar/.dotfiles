import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { getChromeCookies } from './cookies'

dayjs.extend(advancedFormat)
dayjs.extend(utc)
dayjs.extend(timezone)

async function fetchCodexUsage() {
  type AuthFile = {
    openai?: {
      access?: string
      accountId?: string
    }
  }

  type UsageResponse = {
    rate_limit?: {
      primary_window?: {
        used_percent: number
        reset_at: number
      }
    }
  }

  const authPath = `${Bun.env.HOME}/.local/share/opencode/auth.json`
  const auth = (await Bun.file(authPath).json()) as AuthFile
  const accessToken = auth.openai?.access
  const accountId = auth.openai?.accountId

  if (!accessToken || !accountId) {
    throw new Error('OpenAI access token or account ID is absent')
  }

  const response = await fetch('https://chatgpt.com/backend-api/wham/usage', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'ChatGPT-Account-Id': accountId,
      'User-Agent': 'oc-usage'
    }
  })

  if (!response.ok) {
    throw new Error(`Usage request failed with HTTP ${response.status}`)
  }

  const usage = (await response.json()) as UsageResponse
  const window = usage.rate_limit?.primary_window

  if (!window) {
    throw new Error('The response contains no primary usage window')
  }

  const remainingPercent = Math.max(0, 100 - window.used_percent)
  const resetAt = dayjs.unix(window.reset_at).tz(dayjs.tz.guess()).format('MMM D h:mmA z')

  return [`Codex\n${remainingPercent}% remaining | Reset: ${resetAt}`]
}

async function fetchClaudeUsage() {
  type ClaudeCredentials = {
    claudeAiOauth?: {
      accessToken?: string
    }
  }

  type UsageWindow = {
    utilization: number
    resets_at: string
  }

  type UsageResponse = {
    five_hour?: UsageWindow | null
    seven_day?: UsageWindow | null
    seven_day_opus?: UsageWindow | null
    seven_day_sonnet?: UsageWindow | null
  }

  try {
    const credentialResult = Bun.spawnSync(['security', 'find-generic-password', '-s', 'Claude Code-credentials', '-w'])

    if (credentialResult.exitCode !== 0) {
      throw new Error('Could not retrieve Claude Code credentials from Keychain')
    }

    const credentials = JSON.parse(credentialResult.stdout.toString()) as ClaudeCredentials
    const accessToken = credentials.claudeAiOauth?.accessToken

    if (!accessToken) {
      throw new Error('Claude OAuth access token is absent')
    }

    const response = await fetch('https://api.anthropic.com/api/oauth/usage', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'anthropic-beta': 'oauth-2025-04-20',
        'Content-Type': 'application/json',
        'User-Agent': 'oc-usage'
      }
    })

    if (!response.ok) {
      throw new Error(`Claude usage request failed with HTTP ${response.status}`)
    }

    const usage = (await response.json()) as UsageResponse
    const windows = [
      ['five_hour', '5 hour'],
      ['seven_day', 'Weekly'],
      ['seven_day_opus', 'Weekly Opus'],
      ['seven_day_sonnet', 'Weekly Sonnet']
    ] as const

    const lines: string[] = ['\nClaude']
    for (const [key, label] of windows) {
      const window = usage[key]
      if (!window) continue

      const remainingPercent = Math.max(0, Math.round((100 - window.utilization) * 10) / 10)
      const resetAt = dayjs(window.resets_at).tz(dayjs.tz.guess()).format('MMM D h:mmA z')
      lines.push(`${label}: ${remainingPercent}% remaining | Reset: ${resetAt}`)
    }
    return lines
  } catch (e) {
    return []
  }
}

async function fetchGoUsage() {
  const cookies = getChromeCookies('opencode.ai')
  if (!cookies) return []

  if (!cookies.auth) {
    console.error("No 'auth' session found for opencode.ai in Chrome. Ensure you are logged in.")
    return []
  }

  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')

  const targetUrl = 'https://opencode.ai/workspace/wrk_01KJ9VVHAYZT3Z5WJ0SY6GPYPM/go'

  const res = await fetch(targetUrl, {
    headers: {
      Cookie: cookieHeader,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    }
  })

  if (!res.ok) {
    throw new Error(`HTTP Error ${res.status}: ${res.statusText}`)
  }

  const html = await res.text()

  const regex =
    /(rollingUsage|weeklyUsage|monthlyUsage):\$R\[\d+\]=\{status:"ok",resetInSec:(\d+),usagePercent:([\d.]+)/g
  const matches = Array.from(html.matchAll(regex))

  if (matches.length === 0) return []

  const lines: string[] = ['\nOpenCode Go']
  for (const m of matches) {
    const labels: Record<string, string> = {
      rollingUsage: '5 hour',
      weeklyUsage: 'Weekly',
      monthlyUsage: 'Monthly'
    }
    const remainingPercent = Math.max(0, Math.round((100 - Number(m[3])) * 10) / 10)
    const resetAt = dayjs().add(Number(m[2]), 'second').tz(dayjs.tz.guess()).format('MMM D h:mmA z')

    lines.push(`${labels[m[1]]}: ${remainingPercent}% remaining | Reset: ${resetAt}`)
  }
  return lines
}

const results = await Promise.all([
  fetchCodexUsage().catch(() => [] as string[]),
  fetchClaudeUsage(),
  fetchGoUsage().catch(() => [] as string[])
])

console.log(results.flat().join('\n'))
