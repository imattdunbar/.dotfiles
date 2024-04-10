#! /usr/bin/env bash

# $(date -v -8H) == Now - 8 hours
# [-v[+|-]val[y|m|w|d|H|M|S]]
gtt() {
  GIT_COMMITER_DATE=$(date)
  git commit --amend --no-edit --date "$(date)"
}

grf() {
  git restore --source=HEAD --staged --worktree $1
}

gpatch() {
  git add . && git diff --cached --binary > $1
}

gapply() {
  git apply $1
}

unstage() {
  git restore --staged $1
}

# Kill process on port
killport() {
  kill -9 $(lsof -ti:$1)
}

checkport() {
  lsof -i :$1
}

patchalacritty() {
  cp ~/.config/alacritty/alacritty.icns /Applications/Alacritty.app/Contents/Resources/alacritty.icns
  touch /Applications/Alacritty.app
  sudo sh -c 'killall Finder && killall Dock'
}

# Push New Branch
pushnewb() {
    BRANCH=$(git branch | grep \* | cut -d ' ' -f2)
    git push --set-upstream origin "${BRANCH}"
}

# iTerm Tab Naming
DISABLE_AUTO_TITLE="true"
precmd() {
    echo -ne "\e]1;${PWD##*/}\a"
}

# Auto nvm use
autoload -U add-zsh-hook

load-nvmrc() {
  [[ -a .nvmrc ]] || return
  local nvmrc_path
  nvmrc_path="$(nvm_find_nvmrc)"

  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version
    nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$(nvm version)" ]; then
      nvm use
    fi
  elif [ -n "$(PWD=$OLDPWD nvm_find_nvmrc)" ] && [ "$(nvm version)" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}

add-zsh-hook chpwd load-nvmrc
load-nvmrc