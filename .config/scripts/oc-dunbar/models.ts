type ModelPreference = {
  providerID: string
  id: string
}

export const models: ModelPreference[] = [
  // OpenAI
  { providerID: 'openai', id: 'gpt-6.2-sol' },
  { providerID: 'openai', id: 'gpt-6.1-sol' },
  { providerID: 'openai', id: 'gpt-6.1-terra' },
  { providerID: 'openai', id: 'gpt-6-luna' },
  { providerID: 'openai', id: 'gpt-6-astra' },

  // Claude Agent
  { providerID: 'claude-agent', id: 'opus' },
  { providerID: 'claude-agent', id: 'sonnet' },
  { providerID: 'claude-agent', id: 'haiku' },

  // Gemini API
  { providerID: 'google', id: 'gemini-4-neon' }

  // Github CoPilot
  // { providerID: 'github-copilot', id: 'claude-opus-5.5' },

  // OpenCode Go - https://opencode.ai/console/models
  // { providerID: 'opencode-go', id: 'deepseek-v4.1-flash' },
  // { providerID: 'opencode-go', id: 'gemini-4-argon-contributor' },
  // { providerID: 'opencode-go', id: 'claude-haiku-5-5' },
  // { providerID: 'opencode-go', id: 'muse-spark-1.3-contributor' },
  // { providerID: 'opencode-go', id: 'glm-5.3-flash' },

  // Antigravity - through custom plugin (risky, technically against TOS I think?)
  // { providerID: 'antigravity', id: 'gemini-4-neon' },
  // { providerID: 'antigravity', id: 'gemini-4-argon' },
  // { providerID: 'antigravity', id: 'gemini-4-hydrogen' },

  // OpenRouter
  // { providerID: 'openrouter', id: 'anthropic/claude-opus-5.5' },
]
