#!/bin/bash

USER="$(whoami)"
XC_USER_DATA="/Users/$USER/Library/Developer/Xcode/UserData"

THEME_DIR="$XC_USER_DATA/FontAndColorThemes/"
mkdir -p $THEME_DIR
cp $THEME_DIR/Dunbar.xccolortheme ./

KB_DIR="$XC_USER_DATA/KeyBindings"
cp $KB_DIR/Default.idekeybindings ./

cp "$XC_USER_DATA/IDEPreferencesController.xcuserstate" ./IDEPreferencesController.xcuserstate 

echo 'Xcode settings backed up'