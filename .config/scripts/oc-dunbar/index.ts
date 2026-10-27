import type { Plugin } from '@opencode/plugin'
import type { Plugin as TUIPlugin } from '@opencode/plugin/tui'

type OCPlugin = Plugin.Plugin
type Context = Parameters<OCPlugin['setup']>[0] | TUIPlugin.Context

const models = new Set<string>([
  // OpenAI
  'openai/gpt-6.1-sol',
  'openai/gpt-6.1-terra',
  'openai/gpt-6-luna',
  'openai/gpt-6-astra',

  // Anthropic
  'anthropic/claude-opus-5-5',
  'anthropic/claude-haiku-5-5',

  // Github CoPilot
  'github-copilot/claude-opus-5.5',

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

  async setup(ctx: Context) {
    if ('keymap' in ctx) {
      const shortcuts = [
        { bind: 'ctrl+1', providerID: 'openai', id: 'gpt-6.1-sol' },
        { bind: 'ctrl+2', providerID: 'anthropic', id: 'claude-opus-5-5' }
      ]

      ctx.keymap.layer(() => ({
        commands: shortcuts.map((model, index) => ({
          id: `oc-dunbar.model.${index + 1}`,
          title: `Use ${model.id}`,
          bind: model.bind,
          enabled: () => ctx.ui.router.current().type === 'session',

          async run() {
            const route = ctx.ui.router.current()
            if (route.type !== 'session') return

            try {
              await ctx.client.session.switchModel({
                sessionID: route.sessionID,
                model: { providerID: model.providerID, id: model.id }
              })
            } catch (error) {
              ctx.ui.toast.show({
                message: error instanceof Error ? error.message : String(error),
                variant: 'error'
              })
            }
          }
        }))
      }))
      return
    }

    // Reapply the allowlist whenever OpenCode rebuilds the model catalog.
    await ctx.model.transform((editor) => {
      for (const model of editor.list()) {
        if (models.has(`${model.providerID}/${model.id}`)) continue

        editor.remove(String(model.providerID), String(model.id))
      }
    })
  }
} satisfies OCPlugin & TUIPlugin.Definition
