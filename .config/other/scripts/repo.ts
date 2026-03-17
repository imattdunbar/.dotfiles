// @ts-nocheck

import { $ } from 'bun'

const result = await $`git remote -v`.text()

/*
Ex:
origin  git@github.com:imattdunbar/dunbar-web.git (fetch)
origin  git@github.com:imattdunbar/dunbar-web.git (push)

origin  https://github.com/imattdunbar/dunbar-web.git (fetch)
origin  https://github.com/imattdunbar/dunbar-web.git (push)
*/
const parsedOutput = result.split('\t')[1].split(' ')[0].replace('.git', '')

let openURL = ''

if (parsedOutput.includes('https://')) {
  // HTTPS
  openURL = parsedOutput
} else {
  // SSH
  openURL = 'https://' + parsedOutput.replace('git@', '').replace(':', '/')
}

await $`open ${openURL}`
