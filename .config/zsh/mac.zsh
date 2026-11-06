# Brew
if [[ $(uname -m) == "x86_64" ]]; then
    # Intel
    export HOMEBREW_PREFIX="/usr/local"
else
    # Apple Silicon
    export HOMEBREW_PREFIX="/opt/homebrew"
fi

export HOMEBREW_NO_ENV_HINTS=TRUE

# Cocoapods
export LC_ALL=en_US.UTF-8

# Capacitor
export CAPACITOR_ANDROID_STUDIO_PATH="$HOME/Applications/Android Studio.app"

# Expo
export ANDROID_HOME="$HOME/Library/Android/sdk"

# OrbStack
if [[ -r "$HOME/.orbstack/shell/init.zsh" ]]; then
    source "$HOME/.orbstack/shell/init.zsh"
fi

alias updates="bun run ~/.config/scripts/updates/index.ts"
