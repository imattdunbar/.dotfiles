if [[ "$(uname -s)" == "Darwin" ]]; then
  # macOS
  source $HOME/.config/zsh/mac.zsh
else
  # Linux
  source $HOME/.config/zsh/linux.zsh
fi

# Starship
eval "$(starship init zsh)"

# direnv
eval "$(direnv hook zsh)"

# Zoxide
eval "$(zoxide init zsh)"

# Atuin
eval "$(atuin init zsh)"

# Source
source $HOME/.config/zsh/aliases.zsh
source $HOME/.config/zsh/docker.zsh
source $HOME/.config/zsh/functions.zsh
source $HOME/.config/zsh/keybinds.zsh

if [[ -f $HOME/.config/zsh/local.zsh ]]; then
    source $HOME/.config/zsh/local.zsh
fi

# bun completions
[ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"

# bun global bin
export PATH="$PATH:$HOME/.bun/bin"

# Go
export PATH="$PATH:$(go env GOPATH)/bin"