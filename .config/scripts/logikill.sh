#!/usr/bin/env bash
set -euo pipefail

USER_AGENT="/Library/LaunchAgents/com.logi.optionsplus.plist"
SYSTEM_DAEMON="/Library/LaunchDaemons/com.logi.optionsplus.updater.plist"

sudo -v

launchctl bootout "gui/$(id -u)" "$USER_AGENT" 2>/dev/null || true
sudo launchctl bootout system "$SYSTEM_DAEMON" 2>/dev/null || true

sudo pkill -f "/Applications/logioptionsplus.app/" 2>/dev/null || true
sudo pkill -f "/Applications/Utilities/LogiPluginService.app/" 2>/dev/null || true
sudo pkill -f "/Library/Application Support/Logitech.localized/LogiOptionsPlus/" 2>/dev/null || true

sleep 1

remaining="$(pgrep -afil "logioptionsplus|LogiPluginService" || true)"

if [[ -n "$remaining" ]]; then
  printf "Some Logi Options+ processes remain:\n%s\n" "$remaining" >&2
  exit 1
fi

printf "Logi Options+ is fully stopped.\n"