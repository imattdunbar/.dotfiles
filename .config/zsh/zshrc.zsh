# Brew
if [[ $(uname -m) == "x86_64" ]]; then
    # Intel
    eval "$(/usr/local/bin/brew shellenv)"
else
    # Apple Silicon
    eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# Starship
eval "$(starship init zsh)"

# Zoxide
eval "$(zoxide init zsh)"

# nvm
if [[ $(uname -m) == "x86_64" ]]; then
    # Intel
    export NVM_DIR="$HOME/.nvm"
    [ -s "/usr/local/opt/nvm/nvm.sh" ] && \. "/usr/local/opt/nvm/nvm.sh"
    [ -s "/usr/local/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/usr/local/opt/nvm/etc/bash_completion.d/nvm"
else
    # Apple Silicon
    export NVM_DIR="$HOME/.nvm"
    [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"
    [ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"
fi

# rbenv
eval "$(rbenv init - zsh)"

# Cocoapods
export LC_ALL=en_US.UTF-8

# pyenv
eval "$(pyenv init -)"

# Capacitor
export CAPACITOR_ANDROID_STUDIO_PATH="$HOME/Applications/Android Studio.app"

# Jetbrains Toolbox Scripts
export PATH="$PATH:$HOME/Library/Application Support/JetBrains/Toolbox/scripts"

# Expo
export ANDROID_HOME="$HOME/Library/Android/sdk"

# Source
source $HOME/.config/zsh/aliases.zsh
source $HOME/.config/zsh/docker.zsh
source $HOME/.config/zsh/functions.zsh
source $HOME/.config/zsh/keybinds.zsh
source $HOME/.config/zsh/local.zsh

# 1Password
OP_FILE=$HOME/.config/op/plugins.sh
if [[ -f "$OP_FILE" ]]; then
    source $OP_FILE
fi

# pnpm
export PNPM_HOME="$HOME/Library/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac

# bun completions
[ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"

# Go
export PATH="$PATH:$(go env GOPATH)/bin"