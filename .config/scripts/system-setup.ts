import { $ } from 'bun'
import AdmZip from 'adm-zip'
import { rm } from 'node:fs/promises'
import { chmod } from 'node:fs/promises'

const VAULT_NAME = 'Personal'
const ITEM_NAME = 'ssh'

async function main() {
  // Move .gitconfig
  const gitConfigName = process.platform === 'linux' ? '.gitconfig-linux' : '.gitconfig'
  await $`cp -f "${Bun.env.HOME}/.config/other/${gitConfigName}" "${Bun.env.HOME}/.gitconfig"`

  const sshDir = `${Bun.env.HOME}/.ssh`
  const zipPath = `${sshDir}/ssh.zip`

  const opProcess = Bun.spawn(
    ['op', 'read', '--force', '--out-file', zipPath, `op://${VAULT_NAME}/${ITEM_NAME}/ssh.zip`],
    {
      stdout: 'ignore',
      stderr: 'inherit'
    }
  )

  const exitCode = await opProcess.exited

  if (exitCode !== 0) {
    throw new Error(`op read failed with exit code ${exitCode}`)
  }

  try {
    const archive = new AdmZip(zipPath)

    for (const entry of archive.getEntries()) {
      if (entry.isDirectory) continue

      if (!entry.entryName.startsWith('ssh/')) {
        continue
      }

      const relativePath = entry.entryName.slice('ssh/'.length)

      // Keep only direct children of the archived ssh directory.
      if (!relativePath || relativePath.includes('/')) continue

      archive.extractEntryTo(entry, sshDir, false, true)

      await chmod(`${sshDir}/${relativePath}`, 0o600)
    }

    await chmod(sshDir, 0o700)
  } finally {
    await rm(zipPath, { force: true })
  }

  await $`zsh -ic 'open ~/.ssh' </dev/null`

  await $`zsh -ic 'dotfiles remote set-url origin git@github.com:imattdunbar/.dotfiles.git' </dev/null`
}

await main()
