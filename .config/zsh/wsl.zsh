# Enable Windows executables in SSH sessions under WSL
if [[ -z "${WSL_INTEROP:-}" && -S /run/WSL/1_interop ]]; then
    export WSL_INTEROP=/run/WSL/1_interop
fi

alias open="explorer.exe"
