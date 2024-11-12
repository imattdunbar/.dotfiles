rm -rf $HOME/.dotfiles
cd $HOME
git clone --separate-git-dir=$HOME/.dotfiles https://github.com/imattdunbar/.dotfiles.git tmpdotfiles
rsync --recursive --verbose --exclude '.git' tmpdotfiles/ $HOME/
rm -r tmpdotfiles
git --git-dir=$HOME/.dotfiles/ --work-tree=$HOME config --local status.showUntrackedFiles no
cp ~/.config/git/.gitconfig.default ~/.gitconfig
cp ~/.config/git/dotfilesGitConfig ~/.dotfiles/config