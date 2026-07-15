# Setup

## Install this git repo (the dotfiles) to the home directory

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/imattdunbar/.dotfiles/main/.config/scripts/install_dotfiles.sh)"
```

## Install Brew

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## Install Bun + 1Password

```sh
brew install bun 1password 1password-cli
```

## Run system setup

```sh
cd ~/.config/scripts && bun i && bun run ~/.config/scripts/system-setup.ts
```
