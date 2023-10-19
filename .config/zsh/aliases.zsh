# Open in VSCode
alias zshrc="code $HOME/.zshrc"
alias aliases="code $HOME/.config/zsh"
alias config="code $HOME/.config"
alias ssh-config="code $HOME/.ssh/config"
alias edithosts="code /etc/hosts"
alias eggi="code $HOME/.gitignore"
alias eggc="code $HOME/.gitconfig"
alias editpackage="code package.json"
alias ep="code package.json"
alias egi="code .gitignore"
alias editpodfile="code Podfile"
alias starshipconfig="code $HOME/.config/starship.toml"

# Reload zshrc
alias zr="source $HOME/.zshrc"

# dotfiles
alias dotfiles='git --git-dir=$HOME/.dotfiles/ --work-tree=$HOME'
alias dotfiles-reset='dotfiles reset --hard'
alias dotfiles-squash='dotfiles reset $(dotfiles commit-tree HEAD^{tree} -m "Squashed")'
alias dotfiles-update='dotfiles commit -a -m "Updates"; dotfiles push'

# Repos
alias update-repos='$HOME/.config/scripts/repo/update_repos.sh'

# Git
alias initsubmodules="git submodule update --init --recursive"
alias updatesubmodules="git submodule update -f --recursive"
alias deletebranch="git push origin --delete"
alias hardclean="git clean -fd && git reset --hard"
alias lastcommit="git reset --hard HEAD^"
alias pushtags="git push origin --tags"
alias grc="git rebase --continue"
alias squash-all='git reset $(git commit-tree HEAD^{tree} -m "Squashed")'

# Utilities
alias getpath="pwd|pbcopy"
alias gotopath="cd pbpaste"
alias path="pwd"
alias localip="ipconfig getifaddr en0"
alias externalip="dig +short myip.opendns.com @resolver1.opendns.com"

# ls
alias ls="colorls"

# Neovim
alias vim="nvim"
alias v="nvim"

# tmux
alias t="tmux attach || tmux"
alias t-source="tmux source-file $HOME/.config/tmux/tmux.conf"
alias t-ks="tmux kill-server"
alias t-ls="tmux list-sessions"
alias td="tmux detach"
alias t-config="code ~/.config/tmux/tmux.conf"

# Git Utils
alias clearorig="find . -name '*.orig' -delete"
alias clearignored="git rm -r --cached . && git add ."
alias repo="npx -y openup"
alias gcb="\$(git fetch --prune; git checkout \$(node ~/.config/scripts/branch.js \$(git branch -a) | fzf); git pull); clear"
alias gdb="git branch -D \$(git branch | fzf)"

# iOS
alias xcw="open -a '/Applications/Xcode.app' *.xcworkspace"
alias xcp="open -a '/Applications/Xcode.app' *.xcodeproj"
alias deriveddata="cd $HOME/Library/Developer/Xcode/DerivedData; open ."
alias nukedd="sudo rm -rf $HOME/Library/Developer/Xcode/DerivedData"
alias nukespm="sudo rm -rf $HOME/Library/Caches/org.swift.swiftpm"
alias nukecc="sudo rm -rf $HOME/Library/Caches/CocoaPods"
alias ios-playground="cd ~/Dev/Playground/iOS/ios-playground"

# Android
alias ktlint="./gradlew ktlintFormat"
alias kill-ae="kill \$(pgrep -f qemu-system-aarch64) && echo 'Android emulator killed.'"
alias android-playground="cd ~/Dev/Playground/Android/android-playground"
alias nukebuild="sudo rm -rf $PWD/app/build"

# TypeScript
alias ts-playground="cd $HOME/Dev/Playground/Web/ts-playground"

# npm
alias npmlinks="npm ls -g --depth=0 --link=true"
alias updatesnapshots="npm test -- -u"
alias rrnm="rm -rf node_modules"

# pnpm
alias pnpx="pnpm dlx"

# Vite
alias cva="npm create vite@latest"