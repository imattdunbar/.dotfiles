import { $ } from 'bun'
import z from 'zod'

const remoteUrl = (await $`git remote get-url origin`.quiet().text()).trim()
const currentBranch = (await $`git branch --show-current`.quiet().text()).trim()

const repoUrl = remoteUrl.replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '')

const arg = z.enum(['pr', 'prs', 'actions']).safeParse(process.argv.at(2)?.toLowerCase()).data

if (arg) {
  if (arg === 'prs') {
    await $`open ${repoUrl}/pulls`
  }

  if (arg === 'actions') {
    await $`open ${repoUrl}/actions`
  }

  if (arg === 'pr') {
    const compare = `${repoUrl}/compare/main...${currentBranch}`

    try {
      const prs: any[] = await $`gh pr list --json number,title,headRefName,baseRefName,url`.quiet().json()

      const match = prs.find((p) => p.headRefName === currentBranch)
      if (match) {
        await $`open ${match.url}`
      } else {
        throw 'no match'
      }
    } catch {
      await `$open ${compare}`
    }
  }
} else {
  await $`open ${repoUrl}`
}
