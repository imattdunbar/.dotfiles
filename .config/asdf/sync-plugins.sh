#!/bin/sh

plugins=$(cut -d ' ' -f 1 $HOME/.tool-versions)
for plugin in $plugins; do
  asdf plugin add $plugin
done

asdf install