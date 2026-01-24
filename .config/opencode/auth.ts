import { $ } from 'bun'
import { z } from 'zod'

const VAULT_NAME = 'Personal'
const ITEM_NAME = 'OpenCode Secrets'
const OC_AUTH_PATH = `${Bun.env.HOME}/.local/share/opencode/auth.json`

const commandSchema = z.enum(['load', 'save'])

const fileSchema = z.object({
  id: z.string(),
  name: z.string()
})

type OPFile = z.infer<typeof fileSchema>

async function main() {
  const cmd = commandSchema.safeParse(Bun.argv[2]).data
  if (!cmd) throw new Error('Must specify load or save')

  if (cmd === 'load') {
    // Load item from 1Pass
    const result = await $`op item get "${ITEM_NAME}" --vault "${VAULT_NAME}" --format json`.text()
    const item = JSON.parse(result)
    const files = item.files as any[]

    // Parse files
    const validFiles: OPFile[] = []
    files.forEach((file) => {
      const parsed = fileSchema.safeParse(file)
      if (parsed.success) validFiles.push(parsed.data)
    })

    // Make sure it exists
    const authFile = validFiles.find((f) => f.name === 'auth.json')
    if (!authFile) {
      throw new Error('No auth file exists in 1Password')
    }

    // Load the file
    const loadedFile = await $`op read "op://${VAULT_NAME}/${ITEM_NAME}/auth.json"`.text()

    // Save it to where OpenCode keeps auth state
    await Bun.write(OC_AUTH_PATH, loadedFile)

    console.log('LOADED OpenCode auth credentials from 1Password')
  }

  if (cmd === 'save') {
    const authFile = Bun.file(OC_AUTH_PATH)
    const exists = await authFile.exists()

    if (!exists) {
      throw new Error(`No auth file exists at ${OC_AUTH_PATH}`)
    }

    // Validate it's valid JSON before uploading
    const content = await authFile.text()
    try {
      JSON.parse(content)
    } catch {
      throw new Error('auth.json is not valid JSON')
    }

    await $`op item edit "${ITEM_NAME}" "auth\.json[file]=${OC_AUTH_PATH}" --vault "${VAULT_NAME}" > /dev/null`

    console.log('SAVED OpenCode auth credentials to 1Password')
  }
}

await main()
