# Repos
# bindkey -s ^f "cd \$(node ~/.config/scripts/repo/repo.js | fzf) && clear\n"


bindkey -s ^f 'fzf --preview "bat --color=always --style=numbers --line-range=:500 {}"\n'

# Git Branches
# bindkey -s ^b "gcb\n"

# Ctrl + Space = Clear terminal
bindkey -s '^ ' "clear\n"