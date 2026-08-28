import { Database } from 'bun:sqlite'
import { createDecipheriv, createHash, pbkdf2Sync } from 'node:crypto'
import { copyFileSync, statSync, unlinkSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'

// Get Chrome Safe Storage password from macOS Keychain
function getChromePassword(): string {
  const proc = Bun.spawnSync(['security', 'find-generic-password', '-w', '-s', 'Chrome Safe Storage'])
  const password = proc.stdout.toString().trim()
  if (!password) {
    throw new Error('Could not retrieve Chrome Safe Storage key from Keychain.')
  }
  return password
}

// Derive AES-128-CBC key used by Chrome on macOS
function getChromeKey(password: string): Buffer {
  return pbkdf2Sync(password, 'saltysalt', 1003, 16, 'sha1')
}

// Decrypt AES-128-CBC cookie payload
function decryptCookie(encryptedBuffer: Buffer, key: Buffer, hostKey: string): string {
  if (encryptedBuffer.length === 0) return ''

  // Strip Chrome's prefix (usually 'v10')
  const payload = encryptedBuffer.slice(3)
  const iv = Buffer.alloc(16, ' ') // 16 space characters

  const decipher = createDecipheriv('aes-128-cbc', key, iv)
  decipher.setAutoPadding(true)

  try {
    const decrypted = Buffer.concat([decipher.update(payload), decipher.final()])
    const hostHash = createHash('sha256').update(hostKey).digest()
    const value = decrypted.subarray(0, hostHash.length).equals(hostHash)
      ? decrypted.subarray(hostHash.length)
      : decrypted
    return value.toString('utf8')
  } catch {
    return ''
  }
}

function getChromeCookiePath(): string {
  const chromeRoot = join(homedir(), 'Library/Application Support/Google/Chrome')
  const cookiePaths = Array.from(
    new Bun.Glob('**/Cookies').scanSync({ cwd: chromeRoot, absolute: true, onlyFiles: true })
  )

  if (cookiePaths.length === 0) {
    throw new Error(`No Chrome Cookies DB found under: ${chromeRoot}`)
  }

  return cookiePaths.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0]
}

// Read the newest SQLite cookie database from any Chrome profile
function queryChromeCookies(domain: string): Record<string, string> {
  const chromeCookiePath = getChromeCookiePath()

  // Copy to temp file to avoid SQLite lock issues if Chrome is open
  const tempDbPath = join(tmpdir(), `chrome_cookies_${Date.now()}.db`)
  copyFileSync(chromeCookiePath, tempDbPath)

  const cookies: Record<string, string> = {}

  try {
    const key = getChromeKey(getChromePassword())
    const db = new Database(tempDbPath)

    const rows = db
      .query('SELECT host_key, name, encrypted_value FROM cookies WHERE host_key = ? OR host_key = ?')
      .all(domain, `.${domain}`) as Array<{
      host_key: string
      name: string
      encrypted_value: Uint8Array
    }>

    for (const row of rows) {
      const val = decryptCookie(Buffer.from(row.encrypted_value), key, row.host_key)
      if (val) cookies[row.name] = val
    }

    db.close()
  } finally {
    unlinkSync(tempDbPath)
  }

  return cookies
}

export function getChromeCookies(domain: string): Record<string, string> | undefined {
  try {
    return queryChromeCookies(domain)
  } catch (e) {
    // ignore
  }
}
