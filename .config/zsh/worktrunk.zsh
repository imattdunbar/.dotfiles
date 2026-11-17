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

# Worktree names identify folders, not their current branches.
wt_switch() {
  if [[ $# -ne 1 || "$1" == -* ]]; then
    print -u2 'Usage: wts <worktree-name|main>'
    return 1
  fi

  local -x WT_COPY_SOURCE
  WT_COPY_SOURCE=$(git rev-parse --show-toplevel) || return

  local worktrees primary_worktree worktree_path slug expected_path
  worktrees=$(wt list --format=json) || return
  primary_worktree=$(print -r -- "$worktrees" |
    jq -er '.items[] | select(.worktree.main) | .worktree.path') || return

  if [[ "$1" == main ]]; then
    builtin cd -- "$primary_worktree"
    return
  fi

  slug=${1//\//-}
  slug=${slug//\\/-}
  expected_path="${primary_worktree:h}/${primary_worktree:t}.${slug}"
  worktree_path=$(print -r -- "$worktrees" |
    jq -r --arg name "$1" --arg expected "$expected_path" '
      [.items[] | select(.worktree) | .worktree.path |
        select(. == $expected or . == $name or
          (split("/") | last) == $name)]
      | unique
      | if length > 1 then error("Ambiguous worktree name")
        else .[0] // empty end
    ') || return

  if [[ -n "$worktree_path" ]]; then
    builtin cd -- "$worktree_path"
    return
  fi

  # Do not navigate to an unrelated folder just because its branch matches.
  if print -r -- "$worktrees" |
    jq -e --arg branch "$1" \
      'any(.items[]; .worktree and .branch == $branch)' >/dev/null; then
    print -u2 "Branch '$1' is already in another worktree. Use its folder name from wtl."
    return 1
  fi

  if git show-ref --verify --quiet "refs/heads/$1" ||
    git for-each-ref --format='%(refname:strip=3)' refs/remotes |
      grep -Fxq -- "$1"; then
    wt switch "$1" --path "$expected_path"
    return
  fi

  wt switch --create "$1" --base=@ --path "$expected_path"
}

alias wts="wt_switch"
alias wt-switch="wt_switch"

unalias wtl 2>/dev/null
wtl() {
  wt list --format=json |
    jq -r '
      ["Worktree", "Branch"],
      (.items[] | select(.worktree) |
        [
          ((if .worktree.current then "* " else "  " end) +
           (if .worktree.main then "main"
            else (.worktree.path | split("/") | last)
            end)),
          (.branch // "(detached)")
        ])
      | @tsv
    ' |
    column -t -s $'\t'
}

unalias wtd 2>/dev/null
wtd() {
  if [[ $# -eq 0 ]]; then
    wt remove --foreground
    return
  fi

  if [[ "$1" == -* ]]; then
    print -u2 'Usage: wtd [worktree-name] [options]'
    return 1
  fi

  local name="$1"
  shift
  local worktrees primary_worktree worktree_path slug expected_path
  worktrees=$(wt list --format=json) || return
  primary_worktree=$(print -r -- "$worktrees" |
    jq -er '.items[] | select(.worktree.main) | .worktree.path') || return

  slug=${name//\//-}
  slug=${slug//\\/-}
  expected_path="${primary_worktree:h}/${primary_worktree:t}.${slug}"
  worktree_path=$(print -r -- "$worktrees" |
    jq -r --arg name "$name" --arg expected "$expected_path" '
      [.items[] | select(.worktree) | .worktree.path |
        select(. == $expected or . == $name or
          (split("/") | last) == $name)]
      | unique
      | if length > 1 then error("Ambiguous worktree name")
        else .[0] // empty end
    ') || return

  if [[ "$name" == main || "$worktree_path" == "$primary_worktree" ]]; then
    print -u2 'Cannot remove the primary worktree.'
    return 1
  fi

  if [[ -z "$worktree_path" ]]; then
    print -u2 "No worktree folder found for '$name'."
    return 1
  fi

  wt remove --foreground "$@" -- "$worktree_path"
}
