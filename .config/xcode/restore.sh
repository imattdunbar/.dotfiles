#!/bin/bash

USER="$(whoami)"
XC_USER_DATA="/Users/$USER/Library/Developer/Xcode/UserData"

THEME_DIR="$XC_USER_DATA/FontAndColorThemes/"
mkdir -p $THEME_DIR
cp ./Dunbar.xccolortheme $THEME_DIR

KB_DIR="$XC_USER_DATA/KeyBindings/"
mkdir -p $KB_DIR
cp ./Default.idekeybindings $KB_DIR

cp ./IDEPreferencesController.xcuserstate "$XC_USER_DATA"

echo 'Xcode settings restored'