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

alias oc-serve='oc serve --hostname "0.0.0.0"'
alias oc-attach="oc attach localhost:4096 --dir ."
alias oc-login="oc auth login"
alias oc-config="code ~/.config/opencode"
alias oc-zen="open https://opencode.ai/zen"
alias oc-or="open https://openrouter.ai/settings/credits"
alias oc-auth="bun run ~/.config/opencode/auth.ts"
alias oc-secrets="bun run ~/.config/opencode/secrets/load.ts"
alias oc-logs="code ~/.local/share/opencode/log"
alias oc-cache="code ~/.cache/opencode"
alias oc-nuke="rm -rf ~/.local/share/opencode ~/.local/share/opencode/bin ~/.local/share/opencode/log ~/.cache/opencode ~/.config/opencode ~/.local/state/opencode"

add-skill() { bunx skills add "$1" --agent opencode -y; }
oc-models() { oc models | tr -d '\r' | fzf; }

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