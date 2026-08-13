import { basename, resolve } from 'node:path'
import { stat } from 'node:fs/promises'
import { $ } from 'bun'
import { defineCommand, runMain } from 'citty'

const SQLITE_PATTERNS = [
  '**/.alchemy/local/d1/cloudflare-runtime-D1DatabaseObject/*.sqlite',
  '**/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite'
]

const findSqliteDatabase = async () => {
  const databasePaths = new Set<string>()

  for (const pattern of SQLITE_PATTERNS) {
    const glob = new Bun.Glob(pattern)

    for await (const databasePath of glob.scan({
      cwd: process.cwd(),
      absolute: true,
      dot: true,
      onlyFiles: true
    })) {
      if (basename(databasePath) !== 'metadata.sqlite') {
        databasePaths.add(databasePath)
      }
    }
  }

  const databases = await Promise.all(
    [...databasePaths].map(async (path) => ({
      path,
      createdAt: (await stat(path)).birthtimeMs
    }))
  )

  if (databases.length === 0) {
    throw new Error('No local Alchemy or Wrangler D1 database found')
  }

  databases.sort((a, b) => b.createdAt - a.createdAt)

  return databases[0].path
}

const openStudio = async ({
  target,
  schema,
  databaseId,
  sqlitePath
}: {
  target: 'sqlite' | 'd1'
  schema: string
  databaseId?: string
  sqlitePath?: string
}) => {
  const schemaPath = resolve(process.cwd(), schema)

  if (!(await Bun.file(schemaPath).exists())) {
    throw new Error(`Schema file does not exist: ${schemaPath}`)
  }

  const drizzleKitPath = resolve(import.meta.dir, 'node_modules/.bin/drizzle-kit')
  const configPath = resolve(import.meta.dir, 'local-studio.config.ts')

  if (!(await Bun.file(drizzleKitPath).exists())) {
    throw new Error('drizzle-kit is not installed in ~/.config/scripts')
  }

  const cloudflareAccountId =
    target === 'd1' ? (await $`op read ${'op://Personal/Cloudflare/Account ID'}`.quiet().text()).trim() : undefined
  const cloudflareD1ApiToken =
    target === 'd1' ? (await $`op read ${'op://Personal/Cloudflare/D1 Token'}`.quiet().text()).trim() : undefined

  const studio = Bun.spawn([drizzleKitPath, 'studio', '--config', configPath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      LOCAL_STUDIO_TARGET: target,
      LOCAL_STUDIO_SCHEMA: schemaPath,
      LOCAL_STUDIO_SQLITE: sqlitePath,
      LOCAL_STUDIO_D1_DATABASE_ID: databaseId,
      CLOUDFLARE_ACCOUNT_ID: cloudflareAccountId,
      CLOUDFLARE_D1_API_TOKEN: cloudflareD1ApiToken
    },
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit'
  })

  const exitCode = await studio.exited

  if (exitCode !== 0) {
    process.exit(exitCode)
  }
}

const sqlite = defineCommand({
  meta: {
    name: 'sqlite',
    description: 'Open a local Alchemy or Wrangler D1 database'
  },
  args: {
    schema: {
      type: 'string',
      description: 'Path to the Drizzle schema',
      valueHint: 'path',
      required: true
    }
  },
  async run({ args }) {
    const databasePath = await findSqliteDatabase()
    console.log(`Opening local D1 database:\n${databasePath}\n`)

    await openStudio({
      target: 'sqlite',
      schema: args.schema,
      sqlitePath: databasePath
    })
  }
})

const d1 = defineCommand({
  meta: {
    name: 'd1',
    description: 'Open a remote Cloudflare D1 database'
  },
  args: {
    databaseId: {
      type: 'positional',
      description: 'Cloudflare D1 database ID',
      valueHint: 'database-id',
      required: true
    },
    schema: {
      type: 'string',
      description: 'Path to the Drizzle schema',
      valueHint: 'path',
      required: true
    }
  },
  async run({ args }) {
    console.log(`Opening remote D1 database:\n${args.databaseId}\n`)

    await openStudio({
      target: 'd1',
      schema: args.schema,
      databaseId: args.databaseId
    })
  }
})

const main = defineCommand({
  meta: {
    name: 'local-studio',
    description: 'Open Drizzle Studio for Cloudflare D1'
  },
  subCommands: {
    sqlite,
    d1
  }
})

await runMain(main)
