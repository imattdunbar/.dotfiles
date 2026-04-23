#! /usr/bin/env bash

# $(date -v -8H) == Now - 8 hours
# [-v[+|-]val[y|m|w|d|H|M|S]]
gtt() {
  GIT_COMMITER_DATE=$(date)
  git commit --amend --no-edit --date "$(date)"
}

# Interactive branch switcher
fsb() {
  local selected line kind ref branch
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 0

  selected="$(
    {
      local_branches="$(git for-each-ref --format='%(refname:short)' refs/heads)"
      git for-each-ref --sort=-committerdate refs/heads \
        --format=$'\033[32mlocal\033[0m\t%(refname:short)'

      git for-each-ref --sort=-committerdate refs/remotes \
        --format='%(refname:short)' |
        grep -vE '^(origin|.+/HEAD)$' |
        while IFS= read -r remote_ref; do
          branch_name="${remote_ref#*/}"
          if ! printf '%s\n' "$local_branches" | grep -Fxq "$branch_name"; then
            printf '\033[38;5;214mremote\033[0m\t%s\n' "$remote_ref"
          fi
        done
    } | fzf --ansi --reverse --height=75% --border --prompt='Branch > ' \
      --preview='git log --color=always --oneline -n 12 {2} 2>/dev/null'
  )" || return 0

  kind="${selected%%$'\t'*}"
  ref="${selected#*$'\t'}"

  if [[ "$kind" == $'\033[32mlocal\033[0m' ]]; then
    git switch "$ref"
    return
  fi

  branch="${ref#*/}"

  if git show-ref --verify --quiet "refs/heads/$branch"; then
    git switch "$branch"
  else
    git switch --track "$ref"
  fi
}

# Fetch the latest remote of the branch for the local branch, then merge
gmerge() { git fetch origin "$1":"$1" && git merge "$1"; }

# Fetch the latest version of main and merge it with the current branch, use automated commit message
merge-main() {
  git fetch origin main --prune && git merge --no-edit origin/main
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

# Clone repo as template
gh-template() {
  bunx gitpick https://$GITHUB_PAT@github.com/imattdunbar/$1
}

# Kill process on port
killport() {
  kill -9 $(lsof -ti:$1)
}

checkport() {
  lsof -i :$1
}

# Push New Branch
pushnewb() {
    BRANCH=$(git branch | grep \* | cut -d ' ' -f2)
    git push --set-upstream origin "${BRANCH}"
}

download-video() {
    setopt localoptions noglob
    yt-dlp --format best --output "~/Desktop/%(title)s.%(ext)s" "$*"
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

# Utility to get the size of a directory, no params means current, can pass in multiple paths
sizeof() {
  if [[ $# -eq 0 ]]; then
    du -sh .
  else
    du -sh -- "$@"
  fi
}

# Not used - keeping for reference to patch icons
# patchalacritty() {
#   cp ~/.config/alacritty/alacritty.icns /Applications/Alacritty.app/Contents/Resources/alacritty.icns
#   touch /Applications/Alacritty.app
#   sudo sh -c 'killall Finder && killall Dock'
# }

# patchwezterm() {
#   cp ~/.config/wezterm/wezterm.icns /Applications/WezTerm.app/Contents/Resources/terminal.icns
#   touch /Applications/WezTerm.app
#   sudo sh -c 'killall Finder && killall Dock'
# }