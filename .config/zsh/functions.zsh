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

gsp() {
  git stash push --include-untracked -m "$1"
}

gsa() {
  stash=$(git stash list | fzf)
  [[ -z "$stash" ]] && return # If no stash is selected, exit the function
  stash_index=$(echo "$stash" | sed -E 's/stash@\{([0-9]+)\}.*/\1/') # Extract the stash reference
  git stash apply "$stash_index" # Apply index
}

gsl() {
  git stash list
}

gsd() {
  # Same as gsa() but for deleting
  stash=$(git stash list | fzf)
  [[ -z "$stash" ]] && return
  stash_index=$(echo "$stash" | sed -E 's/stash@\{([0-9]+)\}.*/\1/')
  git stash drop "$stash_index"
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

patchwezterm() {
  cp ~/.config/wezterm/wezterm.icns /Applications/WezTerm.app/Contents/Resources/terminal.icns
  touch /Applications/WezTerm.app
  sudo sh -c 'killall Finder && killall Dock'
}

# Push New Branch
pushnewb() {
    BRANCH=$(git branch | grep \* | cut -d ' ' -f2)
    git push --set-upstream origin "${BRANCH}"
}

# Tab Naming
DISABLE_AUTO_TITLE="true"

# Set terminal tab title to folder name
set_terminal_title() {
    local folder_name=$(basename "$PWD")
    echo -ne "\033]0;${folder_name}\007"
}

# Set terminal tab title if not inside tmux
if [[ -z "$TMUX" ]]; then
    autoload -Uz add-zsh-hook
    add-zsh-hook chpwd set_terminal_title
    set_terminal_title
fi

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