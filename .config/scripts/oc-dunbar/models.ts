type ModelPreference = {
  providerID: string
  id: string
  bind?: string
}

export const models: ModelPreference[] = [
  // OpenAI
  { providerID: 'openai', id: 'gpt-6.1-sol', bind: 'ctrl+1' },
  { providerID: 'openai', id: 'gpt-6.1-terra' },
  { providerID: 'openai', id: 'gpt-6-luna' },
  { providerID: 'openai', id: 'gpt-6-astra' },

  // Anthropic
  { providerID: 'anthropic', id: 'claude-opus-5-5', bind: 'ctrl+2' },
  { providerID: 'anthropic', id: 'claude-haiku-5-5' },

  // Github CoPilot
  { providerID: 'github-copilot', id: 'claude-opus-5.5' },

  // OpenRouter
  // { providerID: 'openrouter', id: 'anthropic/claude-opus-5.5' },

  // OpenCode Go
  { providerID: 'opencode-go', id: 'gemini-4-argon-contributor' },
  { providerID: 'opencode-go', id: 'claude-haiku-5-5' }
  // { providerID: 'opencode-go', id: 'muse-spark-1.3-contributor' },
  // { providerID: 'opencode-go', id: 'glm-5.3-flash' },
]
