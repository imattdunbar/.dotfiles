import { $ } from 'bun'
import { z } from 'zod'

const ACCOUNT_ID = 'JTBWQ5UAQRHP7G2DZ66QVMOY4U'
const VAULT_NAME = 'Personal'
const ITEM_NAME = 'OpenCode Secrets'

const result =
  await $`op item get "${ITEM_NAME}" --vault "${VAULT_NAME}" --account "${ACCOUNT_ID}" --format json`.text()
const item = JSON.parse(result)
const fields = item.fields as any[]

const fieldSchema = z.object({
  type: z.string(),
  label: z.string(),
  value: z.string()
})

type Field = z.infer<typeof fieldSchema>

const validFields: Field[] = []

fields.forEach((field) => {
  const parsed = fieldSchema.safeParse(field)
  if (parsed.success) validFields.push(parsed.data)
})

for (const field of validFields) {
  await Bun.write(`${import.meta.dir}/${field.label}`, field.value)
  console.log(`Loaded secret: ${field.label}`)
}
