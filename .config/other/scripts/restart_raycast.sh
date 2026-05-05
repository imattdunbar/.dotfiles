#!/usr/bin/env bash
set -euo pipefail

APP_NAME="Raycast"

if pgrep -x "$APP_NAME" >/dev/null; then
  osascript -e "tell application \"$APP_NAME\" to quit"
  while pgrep -x "$APP_NAME" >/dev/null; do
    sleep 0.2
  done
fi

open -a "$APP_NAME"