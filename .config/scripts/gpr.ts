import { $ } from 'bun'

const remoteUrl = (await $`git remote get-url origin`.quiet().text()).trim()
const currentBranch = (await $`git branch --show-current`.quiet().text()).trim()

if (!remoteUrl) {
  console.error('Could not find origin remote')
  process.exit(1)
}

if (!currentBranch) {
  console.error('Could not determine current branch')
  process.exit(1)
}

const repoUrl = remoteUrl.replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '')

const allPrsUrl = `${repoUrl}/pulls`

const prUrl = `${repoUrl}/compare/main...${currentBranch}`

await $`open ${prUrl}`
