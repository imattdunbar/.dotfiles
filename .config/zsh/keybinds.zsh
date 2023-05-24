# bindkey -s ^f "~/.local/bin/tmux-sessionizer\n"
# bindkey -s ^g "lazygit\n"

# Repos
bindkey -s ^f "cd \$(node ~/.config/scripts/repo/repo.js | fzf) && clear\n"

# Git Branches
bindkey -s ^b "gcb\n"

# Ctrl + Space = Clear terminal
bindkey -s '^ ' "clear\n"