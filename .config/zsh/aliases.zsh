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
alias c="code"

# Reload zshrc
alias zr="source $HOME/.zshrc"

# dotfiles
alias dotfiles='git --git-dir=$HOME/.dotfiles/ --work-tree=$HOME'
alias dotfiles-reset='dotfiles reset --hard'
alias dotfiles-squash='dotfiles reset $(dotfiles commit-tree HEAD^{tree} -m "Squashed")'
alias dotfiles-update='dotfiles commit -a -m "Updates"; dotfiles push'
alias dfdt="dotfiles difftool"
alias dfs="dotfiles status"

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
alias gp="git pull"
alias gs="git status"
alias gdt="git difftool HEAD"
alias gmt="git mergetool"
alias gl="git log --oneline"
alias gf="git fetch"

# Ignore local changes to a file that's already in git
alias git-skip="git update-index --skip-worktree"
alias git-unskip="git update-index --no-skip-worktree"

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
alias myports="sudo lsof -i -P | grep -i 'listen' | grep '$USER'"
alias homeips="ifconfig | grep -o 'inet 10\.10\.[0-9]*\.[0-9]*' | grep -o '10\.10\.[0-9]*\.[0-9]*'"
alias dirSize="du -sh"

function whereami() {
  echo "$HOST, LAN: $(localip), WAN: $(externalip)"
}

# ls
command -v lsd >/dev/null && alias ls="lsd"
alias lsa="lsd -a --tree --depth 1"

# cat
command -v bat >/dev/null && alias cat="bat"

# cd
command -v z >/dev/null && alias cd="z"

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


# AWS
alias aws-whoami="aws sts get-caller-identity"
alias aws-config="code ~/.aws"
alias aws-login='aws sso login --profile $(aws configure list-profiles | fzf)'
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


# --- JS/TS ---

# npm
alias npmlinks="npm ls -g --depth=0 --link=true"
alias updatesnapshots="npm test -- -u"
alias nukenm="rm -rf node_modules"
alias nukepl="rm -rf package-lock.json && rm -rf pnpm-lock.yaml && rm -rf bun.lockb"

alias dev='
if [ -f bun.lockb ] || [ -f bun.lock ]; then (bun run | grep -q "dev:all" && bun dev:all || bun dev);
elif [ -f package-lock.json ]; then (npm run | grep -q "dev:all" && npm run dev:all || npm run dev); 
else echo "No lock file found. Cannot determine dev command."; fi
'
alias tc="bunx tsc -b"
alias bb="bun run build"
alias bli="bun local:init"

alias setup-prettier="bun run $HOME/.config/other/setup-prettier.ts"

# Package
alias package-scripts="jq -r '.scripts | to_entries[] | \"\(.key): \(.value)\"' package.json | fzf"

# pnpm
alias pnpx="pnpm dlx"

# Node Modules
alias find-nm-dir='find . -name "node_modules" -type d -prune -print | xargs du -chs'
alias nuke-nm-dir='find . -name "node_modules" -type d -prune -print -exec rm -rf "{}" \;'

# --- End JS/TS ---

# Go
alias json2go="open https://transform.tools/json-to-go"
alias air="$HOME/go/bin/air" # go install github.com/cosmtrek/air@latest

# Markdown
alias mdcheat="open https://www.markdownguide.org/cheat-sheet/"

# Caddy
alias caddy-config="code /opt/homebrew/etc/caddy/Caddyfile"
alias caddy-start="brew services start caddy"
alias caddy-stop="brew services stop caddy"
alias caddy-restart="brew services restart caddy"
alias caddy-reload="caddy reload --config /opt/homebrew/etc/caddy/Caddyfile"
alias caddy-fmt="caddy fmt --overwrite --config /opt/homebrew/etc/caddy/Caddyfile"

# OpenCode
alias oc="opencode"
alias oc-usage="open https://openrouter.ai/settings/credits"
alias oc-auth="code ~/.local/share/opencode/auth.json"
alias oc-config="code ~/.config/opencode/config.json"
alias oc-cache="code ~/.cache/opencode"