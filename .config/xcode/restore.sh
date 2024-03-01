#!/bin/bash

USER="$(whoami)"
XC_USER_DATA="/Users/$USER/Library/Developer/Xcode/UserData"
XCODE_BACKUP="/Users/$USER/.config/xcode"

THEME_DIR="$XC_USER_DATA/FontAndColorThemes/"
mkdir -p $THEME_DIR
cp "$XCODE_BACKUP/Dunbar.xccolortheme" $THEME_DIR

KB_DIR="$XC_USER_DATA/KeyBindings/"
mkdir -p $KB_DIR
cp "$XCODE_BACKUP/Default.idekeybindings" $KB_DIR

cp "$XCODE_BACKUP/IDEPreferencesController.xcuserstate" "$XC_USER_DATA"

echo 'Xcode settings restored'