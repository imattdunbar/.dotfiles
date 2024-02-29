# Brew
eval "$(/opt/homebrew/bin/brew shellenv)"

# Starship
eval "$(starship init zsh)"

# Zoxide
eval "$(zoxide init zsh)"

# nvm
export NVM_DIR="$HOME/.nvm"
    [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"
    [ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"

# rbenv
eval "$(rbenv init - zsh)"

# Cocoapods
export LC_ALL=en_US.UTF-8

# pyenv
eval "$(pyenv init -)"

# Java 11
#export JAVA_HOME="$HOME/Library/Java/JavaVirtualMachines/corretto-11.0.18/Contents/Home"

# Java 17
export JAVA_HOME="$HOME/Library/Java/JavaVirtualMachines/jbr-17.0.8/Contents/Home"

# Capacitor
export CAPACITOR_ANDROID_STUDIO_PATH="$HOME/Applications/Android Studio.app"

# Jetbrains Toolbox Scripts
export PATH="$PATH:$HOME/Library/Application Support/JetBrains/Toolbox/scripts"

# Expo
export ANDROID_HOME="$HOME/Library/Android/sdk"

if [[ $HOST == *"DunbarMBP"* ]]; then
    source $HOME/.config/zsh/personal_aliases.zsh
else
    source $HOME/.config/zsh/work_aliases.zsh
fi

# Source
source $HOME/.config/zsh/aliases.zsh
source $HOME/.config/zsh/docker.zsh
source $HOME/.config/zsh/functions.zsh
source $HOME/.config/zsh/keybinds.zsh

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
