# init
if command -v wt >/dev/null 2>&1; then eval "$(command wt config shell init zsh)"; fi

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

alias wt-merge="wt_merge"