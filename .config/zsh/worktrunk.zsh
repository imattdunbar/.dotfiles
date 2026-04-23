# init
if [[ -o interactive ]] && command -v wt >/dev/null 2>&1; then eval "$(command wt config shell init zsh)"; fi

# Helper around wt merge that just merges the commits into the specified branch or main branch without
# doing a bunch of work or generating the commit message
wt_merge() {
  local target_branch=""
  local -a base_flags
  base_flags=(--no-remove --no-squash --no-commit)
  # If first arg is a branch name (not a flag), treat it as merge target.
  if [[ $# -gt 0 && "$1" != -* ]]; then
    target_branch="$1"
    shift
  fi
  if [[ -n "$target_branch" ]]; then
    wt merge "$target_branch" "${base_flags[@]}" "$@"
    return
  fi
  wt merge "${base_flags[@]}" "$@"
}

alias wtm="wt_merge"
alias wt-merge="wt_merge"

# Helper around switching worktree to the branch and if it's not a valid branch yet, creates the branch
wt_switch() { wt switch --create "$@" 2>/dev/null || wt switch "$@"; }

alias wts="wt_switch"
alias wt-switch="wt_switch"

alias wtl="wt list"
alias wtd="wt remove"