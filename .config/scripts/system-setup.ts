import { $ } from 'bun'
import { z } from 'zod'

const ACCOUNT_ID = 'JTBWQ5UAQRHP7G2DZ66QVMOY4U'
const VAULT_NAME = 'Personal'
const ITEM_NAME = 'ssh'

const commandSchema = z.enum(['load', 'save'])

const fileSchema = z.object({
  id: z.string(),
  name: z.string()
})

type OPFile = z.infer<typeof fileSchema>

async function main() {
  // Move .gitconfig
  await $`cp -f "${Bun.env.HOME}/.config/other/.gitconfig" "${Bun.env.HOME}/.gitconfig"`

  // Load .ssh directory from 1Pass, open folder to unzip manually
  const content = await $`op read "op://${VAULT_NAME}/${ITEM_NAME}/ssh.zip"`.text()
  await Bun.write(`${Bun.env.HOME}/.ssh/ssh.zip`, content)
  await $`open ~/.ssh`
}

await main()
