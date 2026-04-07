bindkey -s ^f 'fzf --preview "bat --color=always --style=numbers --line-range=:500 {}"\n'

# Ctrl + Space = Clear terminal
bindkey -s '^ ' "clear\n"


# Interactive git switch for Ctrl+P (CMD+Shift+B from Ghostty)
git_branch_picker_widget() {
  zle -I
  fsb
  zle reset-prompt
}
zle -N git_branch_picker_widget
bindkey '^P' git_branch_picker_widget