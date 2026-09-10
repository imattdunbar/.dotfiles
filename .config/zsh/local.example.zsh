# Used for machine specific aliases and configs (personal, work, server, etc.)

# Must create local.zsh in this directory, this is just an example file.

# Where $1 should be the full ticket name-number
jira() {
  open "https://SOME_JIRA_URL.com/$1"
}

# Android
export ANDROID_HOME="$HOME/Library/Android/sdk" # adb
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH" # adb
