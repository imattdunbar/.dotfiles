import { $ } from 'bun'

const remoteUrl = (await $`git remote get-url origin`.quiet().text()).trim();

const repoUrl = remoteUrl
  .replace(/^git@github\.com:/, "https://github.com/")
  .replace(/\.git$/, "");

await $`open ${repoUrl}`;
