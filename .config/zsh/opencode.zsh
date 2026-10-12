# OpenCode

oc() {
  command opencode "$@"
}

alias ocs="oc service start"
alias ocs-stop="oc service stop"
alias ocs-restart="oc service restart"
alias ocs-status="oc service status"

alias oc-upgrade="oc upgrade"
alias oc-login="oc auth login"
alias oc-config="code ~/.config/opencode"
alias oc-auth="bun run ~/.config/scripts/oc-auth.ts"
alias oc-db-mcp="bun run ~/.config/scripts/db-mcp.ts"
alias oc-logs="code ~/.local/share/opencode/log"
alias oc-cache="code ~/.cache/opencode"
alias oc-nuke="rm -rf ~/.local/share/opencode ~/.local/share/opencode/bin ~/.local/share/opencode/log ~/.cache/opencode ~/.config/opencode ~/.local/state/opencode"

# Codex plan usage
alias oc-usage='bun run "$HOME/.config/scripts/oc-usage.ts"'

# Links
alias oc-zen="open https://opencode.ai/zen"
alias oc-or="open https://openrouter.ai/settings/credits"
alias oc-gh="open https://github.com/anomalyco/opencode"

add-skill() { bunx skills add "$1" --agent opencode -y; }

# Lists curated models
oc-models() { oc models | tr -d '\r' | fzf; }

# Use a private server so the shared server's model filter does not apply.
oc-allmodels() {
  XDG_CONFIG_HOME=/tmp/opencode-empty-config command opencode models --standalone "$@" | tr -d '\r' | fzf
}

# List OpenCode processes
oc-list() {
  ps ax -o pid=,args= | rg '[o]pencode(\.exe|2)?( |$)|[o]pencode-darwin-(arm64|x64)/bin/opencode|/\.config/opencode/[t]oolbox'
}

# Kill all OpenCode instances
oc-kill() {
  local -a pids
  pids=("${(@f)$(oc-list | rg -o '^[0-9]+')}")
  (( ${#pids} )) || { echo "No opencode processes found"; return 0; }
  kill "${pids[@]}"
}
