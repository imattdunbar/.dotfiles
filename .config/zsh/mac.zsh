# Prefer asdf paths over brew paths
export PATH=$HOME/.asdf/shims:$PATH

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

# asdf
source "$(brew --prefix asdf)/libexec/asdf.sh"

# Solves an issue with asdf + postgres
export PKG_CONFIG_PATH="/opt/homebrew/bin/pkg-config:$(brew --prefix icu4c)/lib/pkgconfig:$(brew --prefix curl)/lib/pkgconfig:$(brew --prefix zlib)/lib/pkgconfig"

# Navi
eval "$(navi widget zsh)"

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