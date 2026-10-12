import { $ } from 'bun'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { z } from 'zod'

const ACCOUNT_ID = 'JTBWQ5UAQRHP7G2DZ66QVMOY4U'
const VAULT_NAME = 'Personal'
const ITEM_NAME = 'OpenCode Secrets'
const BACKUP_NAME = 'auth.json'
const OP = process.platform === 'win32' || process.env.WSL_DISTRO_NAME ? 'op.exe' : 'op'

const commandSchema = z.enum(['load', 'save', 'clear'])

const metadataSchema = z.record(z.string(), z.unknown()).optional()

const credentialsSchema = z.array(
  z.object({
    id: z.string().min(1),
    integrationID: z.string().min(1),
    label: z.string(),
    active: z.boolean(),
    value: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('oauth'),
        methodID: z.string().min(1),
        refresh: z.string(),
        access: z.string(),
        expires: z.number().int(),
        metadata: metadataSchema
      }),
      z.object({
        type: z.literal('key'),
        key: z.string(),
        metadata: metadataSchema,
        configuration: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]))
          .optional()
      }),
      z.object({
        type: z.literal('external'),
        methodID: z.string().min(1),
        metadata: metadataSchema
      })
    ])
  })
)

function parseCredentials(content: string) {
  let value: unknown
  try {
    value = JSON.parse(content)
  } catch {
    throw new Error('Invalid credential JSON')
  }

  const result = credentialsSchema.safeParse(value)
  // Validation errors must not print credential values.
  if (!result.success) throw new Error('Invalid V2 credential document')
  return result.data
}

async function clearCredentials() {
  const content = await $`opencode auth export`.text()
  const accounts = parseCredentials(content)

  for (const account of accounts) {
    await $`opencode auth logout ${account.integrationID} ${account.id}`
  }
}

async function main() {
  if (!Bun.argv[2]) {
    await $`opencode auth list`
    return
  }

  const command = commandSchema.parse(Bun.argv[2])
  if (command === 'clear') {
    await clearCredentials()
    return
  }

  const content =
    command === 'save'
      ? await $`opencode auth export`.text()
      : await $`${OP} read ${`op://${VAULT_NAME}/${ITEM_NAME}/${BACKUP_NAME}`} --account ${ACCOUNT_ID}`.text()
  parseCredentials(content)

  const directory = await mkdtemp(join(tmpdir(), 'oc-auth-'))
  const filePath = join(directory, BACKUP_NAME)
  try {
    await writeFile(filePath, content, { mode: 0o600 })

    if (command === 'save') {
      const field = `${BACKUP_NAME.replaceAll('.', '\\.')}[file]=${filePath}`
      await $`${OP} item edit ${ITEM_NAME} ${field} --vault ${VAULT_NAME} --account ${ACCOUNT_ID} > /dev/null`
      console.log(`SAVED ${BACKUP_NAME}`)
      return
    }

    // Import skips existing IDs, so remove saved accounts only after the backup is validated and staged.
    await clearCredentials()
    await $`opencode auth import ${filePath}`
    console.log(`LOADED ${BACKUP_NAME}`)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

await main()
