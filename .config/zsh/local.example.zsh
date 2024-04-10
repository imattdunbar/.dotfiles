# Used for machine specific aliases and configs (personal, work, server, etc.)
# Changes are ignored but this file stays.

# Must create local.zsh in this directory, this is just an example file.

# Java
export JAVA_HOME="$HOME/Library/Java/JavaVirtualMachines/jbr-17.0.8/Contents/Home"

# Where $1 should be the full ticket name-number
jira() {
  open "https://SOME_JIRA_URL.com/$1"
}