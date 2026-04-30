// @ts-nocheck
import { $ } from "bun";

const remoteUrl = (await $`git remote get-url origin`.quiet().text()).trim();

if (!remoteUrl) {
  console.error("Could not find origin remote");
  process.exit(1);
}

const repoUrl = remoteUrl
  .replace(/^git@github\.com:/, "https://github.com/")
  .replace(/\.git$/, "");
  
await $`open ${repoUrl}/pulls`;