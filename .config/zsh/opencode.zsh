# OpenCode

# Env wrapper - exports only affect this command
oc() {
  (
    export GOOGLE_CLOUD_PROJECT="purchaser-dev"
    export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/opencode/vertex-key.json"
    export VERTEX_LOCATION="global"
    command opencode "$@"
  )
}

ocs() {
  (
    export GOOGLE_CLOUD_PROJECT="purchaser-dev"
    export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/opencode/vertex-key.json"
    export VERTEX_LOCATION="global"

    nohup opencode serve \
      --port 4096 \
      --hostname "0.0.0.0" \
      >>"$HOME/.local/share/opencode/log/server.log" \
      2>&1 </dev/null
  ) &!
}

ocs-stop() {
  local pid
  pid="$(lsof -tiTCP:4096 -sTCP:LISTEN)"

  [[ -n "$pid" ]] || return 0
  kill -KILL "$pid"
}

ocs-restart() {
  ocs-stop
  ocs
}

alias oca="oc attach http://localhost:4096 --dir ."
alias oc-upgrade="oc upgrade"
alias oc-login="oc auth login"
alias oc-config="code ~/.config/opencode"
alias oc-auth="bun run ~/.config/scripts/oc-auth.ts"
alias oc-db-mcp="bun run ~/.config/scripts/db-mcp.ts"
alias oc-logs="code ~/.local/share/opencode/log"
alias oc-cache="code ~/.cache/opencode"
alias oc-nuke="rm -rf ~/.local/share/opencode ~/.local/share/opencode/bin ~/.local/share/opencode/log ~/.cache/opencode ~/.config/opencode ~/.local/state/opencode"

# Codex plan usage
alias oc-usage="bun run $HOME/.config/scripts/oc-usage.ts"

# Links
alias oc-zen="open https://opencode.ai/zen"
alias oc-or="open https://openrouter.ai/settings/credits"
alias oc-gh="open https://github.com/anomalyco/opencode"

add-skill() { bunx skills add "$1" --agent opencode -y; }

# Lists models I have whitelisted
oc-models() { oc models | tr -d '\r' | fzf; }

# Lists all models available for a provider (points to empty config dir so no whitelist is enforced)
oc-allmodels() {
  XDG_CONFIG_HOME=/tmp/opencode-empty-config oc models "$@" | tr -d '\r' | fzf
}

# List OpenCode processes
oc-list() {
  ps ax -o pid=,args= | rg '/\.bun/bin/opencode|opencode-darwin-arm64/bin/opencode|/\.config/opencode/toolbox'
}

# Kill all OpenCode instances
oc-kill() {
  local -a pids
  pids=("${(@f)$(oc-list | rg -o '^[0-9]+')}")
  (( ${#pids} )) || { echo "No opencode processes found"; return 0; }
  kill "${pids[@]}"
}
