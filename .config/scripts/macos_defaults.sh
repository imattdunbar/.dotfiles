# Inspired by https://github.com/pstadler/dotfiles/blob/master/macos-defaults.sh

sudo -v

# Close any open System Preferences panes, to prevent them from overriding
# settings we’re about to change
osascript -e 'tell application "System Preferences" to quit'

# Avoid creating .DS_Store files on network or USB volumes
defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool true
defaults write com.apple.desktopservices DSDontWriteUSBStores -bool true

# Disable disk image verification
defaults write com.apple.frameworks.diskimages skip-verify -bool true
defaults write com.apple.frameworks.diskimages skip-verify-locked -bool true
defaults write com.apple.frameworks.diskimages skip-verify-remote -bool true

# Show all files
defaults write com.apple.Finder AppleShowAllFiles true

# Show path bar
defaults write com.apple.finder ShowPathbar true

# When performing a search, search the current folder by default
defaults write com.apple.finder FXDefaultSearchScope -string "SCcf"

# Save screenshots to the desktop
defaults write com.apple.screencapture location -string "${HOME}/Desktop"

# Save screenshots in PNG format (other options: BMP, GIF, JPG, PDF, TIFF)
defaults write com.apple.screencapture type -string "png"

# Disable the warning when changing a file extension
defaults write com.apple.finder FXEnableExtensionChangeWarning -bool false

# Disable press-and-hold for keys in favor of key repeat + fast key repeat
# defaults write NSGlobalDomain ApplePressAndHoldEnabled -bool false
# defaults write NSGlobalDomain KeyRepeat -int 1
# defaults write NSGlobalDomain InitialKeyRepeat -int 12

# Enable full keyboard access for all controls
# (e.g. enable Tab in modal dialogs)
defaults write NSGlobalDomain AppleKeyboardUIMode -int 3


# Disable “natural” scrolling - because Apple made it up
defaults write NSGlobalDomain com.apple.swipescrolldirection -bool false

# Disable the “Are you sure you want to open this application?” dialog
defaults write com.apple.LaunchServices LSQuarantine -bool false

# Save to disk (not to iCloud) by default
defaults write NSGlobalDomain NSDocumentSaveNewDocumentsToCloud -bool false

# Expand save panel by default
defaults write NSGlobalDomain NSNavPanelExpandedStateForSaveMode -bool true
defaults write NSGlobalDomain NSNavPanelExpandedStateForSaveMode2 -bool true

# Supposedly enables Airdrop over ethernet and unsupported Macs
defaults write com.apple.NetworkBrowser BrowseAllInterfaces -bool true

# Show the ~/Library folder
chflags nohidden ~/Library

# Don’t show recent applications in Dock
defaults write com.apple.dock show-recents -bool false


# Hot corners
# Possible values:
#  0: no-op
#  2: Mission Control
#  3: Show application windows
#  4: Desktop
#  5: Start screen saver
#  6: Disable screen saver
#  7: Dashboard
# 10: Put display to sleep
# 11: Launchpad
# 12: Notification Center
# 13: Lock Screen

# Set all hot corners to do nothing
defaults write com.apple.dock wvous-tl-modifier -int 0
defaults write com.apple.dock wvous-tr-modifier -int 0
defaults write com.apple.dock wvous-bl-modifier -int 0
defaults write com.apple.dock wvous-br-modifier -int 0

# Show Safari debug menu
defaults write com.apple.Safari IncludeInternalDebugMenu -bool true

# Enable the Develop menu and the Web Inspector in Safari
defaults write com.apple.Safari IncludeDevelopMenu -bool true
defaults write com.apple.Safari WebKitDeveloperExtrasEnabledPreferenceKey -bool true
defaults write com.apple.Safari com.apple.Safari.ContentPageGroupIdentifier.WebKit2DeveloperExtrasEnabled -bool true

# Add a context menu item for showing the Web Inspector in web views
defaults write NSGlobalDomain WebKitDeveloperExtras -bool true

# Show all processes in Activity Monitor
defaults write com.apple.ActivityMonitor ShowCategory -int 0

# Disable smart quotes as it’s annoying for messages that contain code
defaults write com.apple.messageshelper.MessageController SOInputLineSettings -dict-add "automaticQuoteSubstitutionEnabled" -bool false

# Disable continuous spell checking
defaults write com.apple.messageshelper.MessageController SOInputLineSettings -dict-add "continuousSpellCheckingEnabled" -bool false

# Show bluetooth icon
defaults -currentHost write com.apple.controlcenter Bluetooth -int 18

# Show volume icon
defaults -currentHost write com.apple.controlcenter Sound -int 18

# Disable Siri
defaults write com.apple.Siri StatusMenuVisible -bool false
defaults write com.apple.assistant.support "Assistant Enabled" -bool false

# Move windows by dragging any part of the window CMD+CTRL + Mouse
defaults write -g NSWindowShouldDragOnGesture -bool true

# Free up Hyper+C
defaults write NSGlobalDomain NSUserKeyEquivalents -dict-add "Convert Text to Simplified Chinese" "nil"

# CMD+Shift+L to Lock Screen
# @ = Command, $ = Shift, L = L key
defaults write NSGlobalDomain NSUserKeyEquivalents -dict-add "Lock Screen" "@\$L"
killall pbs

# Apparently the format of these preference settings in the plist were changed in macOS Tahoe, so if trying to set others like this it's probably a good idea to have an agent look at the before/after of the plist when setting them and copy over the edits like this.

# Disable Spotlight search so Raycast can use CMD+Space
defaults write com.apple.symbolichotkeys AppleSymbolicHotKeys -dict-add 64 '<dict><key>enabled</key><false/><key>value</key><dict><key>parameters</key><array><integer>32</integer><integer>49</integer><integer>1048576</integer></array><key>type</key><string>standard</string></dict></dict>'

# Disable alternate Spotlight shortcut to avoid conflicts
defaults write com.apple.symbolichotkeys AppleSymbolicHotKeys -dict-add 65 '<dict><key>enabled</key><false/></dict>'

# Override hammerspoon config 
defaults write org.hammerspoon.Hammerspoon MJConfigFile "~/.config/hammerspoon/init.lua"

# Restart the system UI server to apply changes
/System/Library/PrivateFrameworks/SystemAdministration.framework/Resources/activateSettings -u

# Refresh preferences
killall cfprefsd

# Dock Icon size
defaults write com.apple.dock tilesize -int 48
killall Dock

# Install and start the Herdr window title watcher
mkdir -p "$HOME/Library/LaunchAgents"
cp -f "$HOME/.config/herdr/com.dunbar.watch-herdr.plist" "$HOME/Library/LaunchAgents/com.dunbar.watch-herdr.plist"

if launchctl print "gui/$(id -u)/com.dunbar.watch-herdr" >/dev/null 2>&1; then
    launchctl bootout "gui/$(id -u)/com.dunbar.watch-herdr"

    while launchctl print "gui/$(id -u)/com.dunbar.watch-herdr" >/dev/null 2>&1; do
        sleep 0.1
    done
fi

launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.dunbar.watch-herdr.plist"
launchctl kickstart -k "gui/$(id -u)/com.dunbar.watch-herdr"

echo "Reminder to make sure Hammerspoon is installed and that Move Focus to Next Window is set to CMD+backtick"

echo "If something failed, make sure to give Ghostty full disk access. Settings -> Privacy & Security -> Full Disk Access"
echo "Done. Should probably restart now."
