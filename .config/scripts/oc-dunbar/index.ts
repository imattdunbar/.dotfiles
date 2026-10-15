import type { Plugin } from '@opencode/plugin'

type OCPlugin = Plugin.Plugin

const models = new Set<string>([
  // Github CoPilot
  'github-copilot/claude-opus-5.5',

  // Anthropic
  'anthropic/claude-opus-5-5',
  'anthropic/claude-haiku-5-5',

  // OpenAI
  'openai/gpt-6.1-sol',
  'openai/gpt-6-luna',
  'openai/gpt-6-astra',

  // OpenRouter
  // 'openrouter/anthropic/claude-opus-5.5',

  // OpenCode Go
  'opencode-go/gemini-4-argon-contributor',
  'opencode-go/claude-haiku-5-5'
  // 'opencode-go/muse-spark-1.3-contributor',
  // 'opencode-go/glm-5.3-flash',
])

export default {
  id: 'custom.oc-dunbar',

  async setup(ctx) {
    // Reapply the allowlist whenever OpenCode rebuilds the model catalog.
    await ctx.model.transform((editor) => {
      for (const model of editor.list()) {
        if (models.has(`${model.providerID}/${model.id}`)) continue

        editor.remove(String(model.providerID), String(model.id))
      }
    })
  }
} satisfies OCPlugin
