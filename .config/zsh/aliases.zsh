# Open in VSCode
alias zshrc="code $HOME/.config/zsh/zshrc.zsh"
alias aliases="code $HOME/.config/zsh; code $HOME/.config/zsh/aliases.zsh"
alias config="code $HOME/.config"
alias ssh-config="code $HOME/.ssh/config"
alias edithosts="code /etc/hosts"
alias eggi="code $HOME/.gitignore"
alias eggc="code $HOME/.gitconfig"
alias editpackage="code package.json"
alias ep="code package.json"
alias egi="code .gitignore"
alias editpodfile="code Podfile"

# Reload zshrc
alias zr="source $HOME/.zshrc"

# dotfiles
alias dotfiles='git --git-dir=$HOME/.dotfiles/ --work-tree=$HOME'
alias dotfiles-reset='dotfiles reset --hard'
alias dotfiles-squash='dotfiles reset $(dotfiles commit-tree HEAD^{tree} -m "Squashed")'
alias dotfiles-update='dotfiles commit -a -m "Updates"; dotfiles push'
alias ddt="dotfiles difftool"

# Git
alias initsubmodules="git submodule update --init --recursive"
alias updatesubmodules="git submodule update -f --recursive"
alias deletebranch="git push origin --delete"
alias hardclean="git clean -fd && git reset --hard"
alias lastcommit="git reset --hard HEAD^"
alias pushtags="git push origin --tags"
alias grc="git rebase --continue"
alias gc="git commit -a"
alias ga="git add ."
alias gp="git push"
alias gs="git status"
alias gdt="git difftool HEAD"
alias gmt="git mergetool"
alias gl="git log --oneline"

# git reset --soft BRANCH or COMMIT
# commit changes back for clean 1 commit

# git tag -a SOME_TAG_NAME e3afd034(commit-hash) -m "TAG_MESSAGE"
# then pushtags

# Git Utils
alias clearorig="find . -name '*.orig' -delete"
alias clearignored="git rm -r --cached . && git add ."
alias repo="go run ~/.config/scripts/repo.go"
alias gdb="git branch -D \$(git branch | fzf)"
alias squash-all='git reset $(git commit-tree HEAD^{tree} -m "Squashed")'

# Utilities
alias pwdcopy="pwd|pbcopy"
alias gotopath="cd pbpaste"
alias path="pwd"
alias localip="ipconfig getifaddr en0"
alias externalip="curl --silent ifconfig.me"
alias whereami="echo $HOST, LAN: $(localip), WAN: $(externalip)"

alias homeips="ifconfig | grep -o 'inet 10\.10\.[0-9]*\.[0-9]*' | grep -o '10\.10\.[0-9]*\.[0-9]*'"

# ls
alias ls="lsd"
alias lsa="ls -a --tree --depth 1"
alias ogls="\ls"

# cat
alias cat="bat"

# cd
alias cd="z"
alias ogcd="\cd"

# macOS
alias disablegatekeeper="sudo spctl --master-disable"
alias brew-bundle-install="brew bundle install --file ~/.config/other/Brewfile"
alias brew-bundle-dump="brew bundle dump --force --file ~/.config/other/Brewfile; sed -i '' '/^vscode/d' ~/.config/other/Brewfile
"

# xattr file_path
# to check if app has com.apple.quarantine

# sudo xattr -r -d com.apple.quarantine file_path
# to remove quarantine

# Neovim
alias vim="nvim"
alias v="nvim"
alias nuke-nvim="rm -rf ~/.config/nvim && rm -rf ~/.local/share/nvim"
alias reset-nvim="rm -rf ~/.local/share/nvim"

# tmux
alias t="tmux attach || tmux"
alias t-source="tmux source-file $HOME/.config/tmux/tmux.conf"
alias t-kserver="tmux kill-server"
alias t-ks="tmux kill-session"
alias t-kp="tmux kill-pane"
alias t-kw="tmux kill-window"
alias t-ls="tmux list-sessions"
alias split-right="tmux split-window -h"
alias split-down="tmux split-window -v"
alias sr="tmux split-window -h"
alias sd="tmux split-window -v"
alias td="tmux detach"
alias t-new="echo ':new after leader or tmux new'"
alias t-ns="tmux rename-session"
alias t-nw="tmux rename-window"
alias t-config="code ~/.config/tmux/tmux.conf"
alias t-plugins="sh ~/.config/tmux/plugins/tpm/scripts/install_plugins.sh"
alias t-cheat="open https://tmuxcheatsheet.com"
alias nuke-tmux="rm -rf ~/.config/tmux/plugins && git clone https://github.com/tmux-plugins/tpm ~/.config/tmux/plugins/tpm && t-plugins && t-source"

# Terraform
alias tf="terraform"

# Kubernetes
alias k="kubectl"

# iOS
alias xcw="find . -maxdepth 2 -name '*.xcworkspace' -exec open -a '/Applications/Xcode.app' {} \;"
alias xcp="find . -maxdepth 2 -name '*.xcodeproj' -exec open -a '/Applications/Xcode.app' {} \;"

alias opendd="open $HOME/Library/Developer/Xcode/DerivedData"
alias nukedd="sudo rm -rf $HOME/Library/Developer/Xcode/DerivedData"
alias nukespm="sudo rm -rf $HOME/Library/Caches/org.swift.swiftpm"
alias nukecc="sudo rm -rf $HOME/Library/Caches/CocoaPods"
alias nukesc="sudo rm -rf $HOME/Library/Developer/CoreSimulator/Caches"
alias nukeios="nukedd && nukespm && nukecc && nukesc"
alias ios-playground="cd ~/Dev/Playground/iOS/ios-playground"

# Xcode
alias xcode-backup="go run ~/.config/xcode/xcode-sync.go --backup"
alias xcode-restore="go run ~/.config/xcode/xcode-sync.go --restore"

# Android
alias ktlint="./gradlew ktlintFormat"
alias kill-ae="kill \$(pgrep -f qemu-system-aarch64) && echo 'Android emulator killed.'"
alias android-playground="cd ~/Dev/Playground/Android/android-playground"
alias nukebuild="sudo rm -rf $PWD/app/build"

# npm
alias npmlinks="npm ls -g --depth=0 --link=true"
alias updatesnapshots="npm test -- -u"
alias nukenm="rm -rf node_modules"
alias nukepl="rm -rf package-lock.json && rm -rf pnpm-lock.yaml && rm -rf bun.lockb"

# pnpm
alias pnpx="pnpm dlx"

# Go
alias json2go="open https://transform.tools/json-to-go"
alias air="$HOME/go/bin/air" # go install github.com/cosmtrek/air@latest

# Markdown
alias mdcheat="open https://www.markdownguide.org/cheat-sheet/"

# Utils
alias myports="sudo lsof -i -P | grep -i 'listen' | grep '$USER'"