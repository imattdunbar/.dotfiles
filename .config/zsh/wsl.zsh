# Enable Windows executables in SSH sessions under WSL
if [[ -z "${WSL_INTEROP:-}" && -S /run/WSL/1_interop ]]; then
    export WSL_INTEROP=/run/WSL/1_interop
fi

export PATH="$PATH:/mnt/c/WINDOWS/System32"
export PATH="$PATH:/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0"
export PATH="$PATH:/mnt/c/WINDOWS"

# Specifically VSCode "code" path
export PATH="$PATH:/mnt/c/Program Files/Microsoft VS Code/bin"

alias open="explorer.exe"