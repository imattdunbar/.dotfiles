import { $ } from 'bun'

const toolVersions = await Bun.file(`${Bun.env.HOME}/.tool-versions`).text()
const installedPlugins = new Set((await $`asdf plugin list`.text()).trim().split('\n'))

const plugins = toolVersions
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.split(/\s+/)[0])

for (const plugin of plugins) {
  if (!plugin || installedPlugins.has(plugin)) {
    continue
  }

  await $`asdf plugin add ${plugin}`
}

await $`asdf install`
