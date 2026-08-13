import { defineConfig } from 'drizzle-kit'

const target = process.env.LOCAL_STUDIO_TARGET
const schema = process.env.LOCAL_STUDIO_SCHEMA
const sqlitePath = process.env.LOCAL_STUDIO_SQLITE
const databaseId = process.env.LOCAL_STUDIO_D1_DATABASE_ID
const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID
const cloudflareD1ApiToken = process.env.CLOUDFLARE_D1_API_TOKEN

if (target !== 'sqlite' && target !== 'd1') {
  throw new Error('Invalid Studio target')
}

if (!schema) {
  throw new Error('Missing schema path')
}

const config = target === 'sqlite' ? getSqliteConfig() : getD1Config()

function getSqliteConfig() {
  if (!sqlitePath) {
    throw new Error('Missing SQLite database path')
  }

  return defineConfig({
    dialect: 'sqlite',
    schema,
    dbCredentials: {
      url: sqlitePath
    }
  })
}

function getD1Config() {
  if (!databaseId) {
    throw new Error('Missing D1 database ID')
  }

  if (!cloudflareAccountId || !cloudflareD1ApiToken) {
    throw new Error('Missing Cloudflare credentials')
  }

  return defineConfig({
    dialect: 'sqlite',
    driver: 'd1-http',
    schema,
    dbCredentials: {
      accountId: cloudflareAccountId,
      databaseId,
      token: cloudflareD1ApiToken
    }
  })
}

export default config
