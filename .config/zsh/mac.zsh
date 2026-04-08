# Prefer asdf paths over brew paths
export PATH="$HOME/.asdf/shims:$PATH"

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

# Solves an issue with asdf + postgres
export PKG_CONFIG_PATH="$HOMEBREW_PREFIX/bin/pkg-config:$HOMEBREW_PREFIX/opt/icu4c/lib/pkgconfig:$HOMEBREW_PREFIX/opt/curl/lib/pkgconfig:$HOMEBREW_PREFIX/opt/zlib/lib/pkgconfig"

# fnm
eval "$(fnm env --use-on-cd --shell zsh)"
alias nvm="fnm"

# rbenv
eval "$(rbenv init - zsh --no-rehash)"

# Cocoapods
export LC_ALL=en_US.UTF-8

# pyenv
eval "$(pyenv init - --no-rehash)"

# Capacitor
export CAPACITOR_ANDROID_STUDIO_PATH="$HOME/Applications/Android Studio.app"

# Jetbrains Toolbox Scripts
export PATH="$PATH:$HOME/Library/Application Support/JetBrains/Toolbox/scripts"

# Expo
export ANDROID_HOME="$HOME/Library/Android/sdk"

alias updates="brew update && brew upgrade"
