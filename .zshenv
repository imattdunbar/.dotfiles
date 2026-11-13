typeset -U path

if [[ "$OSTYPE" == darwin* ]]; then
  path+=("$HOME/Library/Application Support/com.superlogical.rex/RexServer/Versions/Current/Rex Server.app/Contents/MacOS")
fi

export PATH