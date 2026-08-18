import { $ } from 'bun'

const VAULT_NAME = 'Personal'
const ITEM_NAME = 'ssh'

async function main() {
  // Move .gitconfig
  await $`cp -f "${Bun.env.HOME}/.config/other/.gitconfig" "${Bun.env.HOME}/.gitconfig"`

  // Load .ssh directory from 1Pass, open folder to unzip manually
  const content = await $`op read "op://${VAULT_NAME}/${ITEM_NAME}/ssh.zip"`.text()
  await Bun.write(`${Bun.env.HOME}/.ssh/ssh.zip`, content)
  await $`open ~/.ssh`
}

await main()
