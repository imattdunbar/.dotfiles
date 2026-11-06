typeset -U path

if [[ "$OSTYPE" == darwin* ]]; then
  path=(
    "$ANDROID_HOME/platform-tools"
    "$ANDROID_HOME/emulator"
    "$HOMEBREW_PREFIX/bin"
    "$HOMEBREW_PREFIX/sbin"
    "${path[@]}"
    "$HOME/Library/Application Support/JetBrains/Toolbox/scripts"
  )
elif [[ "$(uname -r)" == *[Mm]icrosoft* ]]; then
  path+=(
    "/mnt/c/WINDOWS/System32"
    "/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0"
    "/mnt/c/WINDOWS"
    "/mnt/c/Program Files/Microsoft VS Code/bin"
  )
fi

path=(
  "$HOME/.local/bin"
  "${path[@]}"
  "$HOME/.bun/bin"
  "$HOME/go/bin"
  "$HOME/.hutch/bin"
)

export PATH
