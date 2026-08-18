import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(advancedFormat)
dayjs.extend(utc)
dayjs.extend(timezone)

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

console.log(`${remainingPercent}% remaining | Reset: ${resetAt}`)
