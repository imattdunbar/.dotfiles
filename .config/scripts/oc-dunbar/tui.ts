import type { Plugin } from '@opencode/plugin/tui'
import { models } from './models'

export default {
  id: 'custom.oc-dunbar',

  setup(ctx) {
    ctx.keymap.layer(() => ({
      commands: models
        .filter((model) => model.bind)
        .map((model) => ({
          id: `oc-dunbar.model.${model.providerID}/${model.id}`,
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
  }
} satisfies Plugin.Definition
