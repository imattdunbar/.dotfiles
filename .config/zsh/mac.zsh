# Prefer asdf paths over brew paths
export PATH="$HOME/.asdf/shims:$PATH"

# Brew
if [[ $(uname -m) == "x86_64" ]]; then
    # Intel
    eval "$(/usr/local/bin/brew shellenv)"
    export HOMEBREW_PREFIX="/usr/local"
else
    # Apple Silicon
    eval "$(/opt/homebrew/bin/brew shellenv)"
    export HOMEBREW_PREFIX="/opt/homebrew"
fi
export HOMEBREW_NO_ENV_HINTS=TRUE

# Solves an issue with asdf + postgres
export PKG_CONFIG_PATH="/opt/homebrew/bin/pkg-config:$(brew --prefix icu4c)/lib/pkgconfig:$(brew --prefix curl)/lib/pkgconfig:$(brew --prefix zlib)/lib/pkgconfig"

# fnm
eval "$(fnm env --use-on-cd --shell zsh)"
alias nvm="fnm"

# rbenv
eval "$(rbenv init - zsh)"

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