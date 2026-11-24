import type { Plugin } from '@opencode/plugin'
import { setupAntigravity } from './antigravity'
import { models } from './models'

const allowed = new Set(
  models.map((model) => `${model.providerID}/${model.id}`)
)

export default {
  id: 'custom.oc-dunbar',

  async setup(ctx) {
    const stopAntigravity = await setupAntigravity(ctx)
    // Reapply the allowlist whenever OpenCode rebuilds the model catalog.
    await ctx.model.transform((editor) => {
      for (const model of editor.list()) {
        if (allowed.has(`${model.providerID}/${model.id}`)) continue

        editor.remove(String(model.providerID), String(model.id))
      }
    })
    return stopAntigravity
  }
} satisfies Plugin.Plugin
