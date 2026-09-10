# Brew
if [[ $(uname -m) == "x86_64" ]]; then
    # Intel
    export HOMEBREW_PREFIX="/usr/local"
else
    # Apple Silicon
    export HOMEBREW_PREFIX="/opt/homebrew"
fi

export PATH="$HOMEBREW_PREFIX/bin:$HOMEBREW_PREFIX/sbin:$PATH"

export HOMEBREW_NO_ENV_HINTS=TRUE

# Cocoapods
export LC_ALL=en_US.UTF-8

# Capacitor
export CAPACITOR_ANDROID_STUDIO_PATH="$HOME/Applications/Android Studio.app"

# Jetbrains Toolbox Scripts
export PATH="$PATH:$HOME/Library/Application Support/JetBrains/Toolbox/scripts"

# Expo
export ANDROID_HOME="$HOME/Library/Android/sdk"

updates() {
    brew update || return
    brew upgrade --no-ask || return
    mise self-update --yes || return
    mise -C "$HOME" upgrade # updates global packages
}
