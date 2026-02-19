import { $ } from 'bun'
import { z } from 'zod'

const ACCOUNT_ID = 'JTBWQ5UAQRHP7G2DZ66QVMOY4U'
const VAULT_NAME = 'Personal'
const ITEM_NAME = 'OpenCode Secrets'

// Define all files to sync
const AUTH_FILES = [
  {
    name: 'auth.json',
    localPath: `${Bun.env.HOME}/.local/share/opencode/auth.json`,
    opFieldName: 'auth\\.json' // have to escape . with \\ for op CLI
  },
  {
    name: 'antigravity-accounts.json',
    localPath: `${import.meta.dir}/antigravity-accounts.json`,
    opFieldName: 'antigravity-accounts\\.json'
  },
  {
    name: 'vertex-key.json',
    localPath: `${import.meta.dir}/vertex-key.json`,
    opFieldName: 'vertex-key\\.json'
  }
]

const commandSchema = z.enum(['load', 'save'])

const fileSchema = z.object({
  id: z.string(),
  name: z.string()
})

type OPFile = z.infer<typeof fileSchema>

async function main() {
  const cmd = commandSchema.safeParse(Bun.argv[2]).data

  // If no command just open the current auth.json file
  if (!cmd) {
    await $`code ${Bun.env.HOME}/.local/share/opencode/auth.json`
    return
  }

  // Fetch item once (used by both load and save to validate files exist)
  const result =
    await $`op item get "${ITEM_NAME}" --vault "${VAULT_NAME}" --account "${ACCOUNT_ID}" --format json`.text()
  const item = JSON.parse(result)

  const opFiles = (item.files as any[])
    .map((f) => fileSchema.safeParse(f))
    .filter((r) => r.success)
    .map((r) => r.data)

  for (const file of AUTH_FILES) {
    if (cmd === 'load') {
      const opFile = opFiles.find((f) => f.name === file.name)

      if (!opFile) {
        console.warn(`Skipping ${file.name}: not found in 1Password`)
        continue
      }

      const content = await $`op read "op://${VAULT_NAME}/${ITEM_NAME}/${file.name}"`.text()
      await Bun.write(file.localPath, content)

      console.log(`LOADED ${file.name}`)
    }

    if (cmd === 'save') {
      const localFile = Bun.file(file.localPath)
      const exists = await localFile.exists()
      if (!exists) {
        console.warn(`Skipping ${file.name}: not found at ${file.localPath}`)
        continue
      }

      // Validate JSON
      const content = await localFile.text()
      try {
        JSON.parse(content)
      } catch {
        console.warn(`Skipping ${file.name}: invalid JSON`)
        continue
      }

      await $`op item edit "${ITEM_NAME}" "${file.opFieldName}[file]=${file.localPath}" --vault "${VAULT_NAME}" --account "${ACCOUNT_ID}" > /dev/null`

      console.log(`SAVED ${file.name}`)
    }
  }
}

await main()
