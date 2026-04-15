import { Database } from 'bun:sqlite'
import { homedir } from 'node:os'

const HOME = homedir()
const dbPath = `${HOME}/.local/share/opencode/opencode.db`

// Open in readonly mode so we don't lock the database
const db = new Database(dbPath, { readonly: true })

const query = db.query(`
    SELECT id, directory, time_updated, title 
    FROM session 
    ORDER BY time_updated DESC
  `)

const sessions = query.all() as {
  id: string
  directory: string
  time_updated: string
  title: string
}[]

const sessionId = process.argv.slice(2).at(0)
if (sessionId) {
  const dir = sessions.find((s) => s.id === sessionId)?.directory
  console.log('should go to', dir)
}

const truncateStart = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value
  if (maxLength <= 3) return '.'.repeat(maxLength)
  return `...${value.slice(value.length - (maxLength - 3))}`
}

const truncateEnd = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value
  if (maxLength <= 3) return '.'.repeat(maxLength)
  return `${value.slice(0, maxLength - 3)}...`
}

try {
  for (const row of sessions) {
    // 1. Extract just the project folder name from the absolute path
    const dirName = row.directory.replace(HOME, '~').split('/').pop() || row.directory

    // 2. Format the raw ISO date into something readable
    const date = new Date(row.time_updated)
    const dateStr = `${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`

    // 3. Construct the output line.
    // IMPORTANT: We keep 'id' as word 1, and 'directory' as word 2.
    // This ensures your Zsh awk script still parses them perfectly behind the scenes!
    // Everything after the first two words is purely for your visual interface.
    // const hiddenData = `${row.id} ${row.directory}`
    // const visualData = `${teal(dirName.padEnd(20))} ${dim('│')} ${row.title.padEnd(40)} ${dim(dateStr)}`

    const displayDirectory = truncateStart(dirName, 40)
    const displayTitle = row.title //truncateEnd(row.title, 40)

    console.log(`${displayDirectory.padEnd(20)} ${dateStr.padEnd(20)} ${displayTitle.padEnd(96)} ${row.id}`)

    // console.log(`${hiddenData}  ${visualData}`)
  }

  db.close()
} catch (err) {
  console.error('Failed to read OpenCode DB:', err)
  process.exit(1)
}
