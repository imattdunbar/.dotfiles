# herdr
h() {
    if [[ -n "$1" ]]; then
        herdr --session "$1"
        return
    fi
    herdr
}
alias h-reload="herdr config check && herdr server reload-config"
alias h-nw='herdr workspace rename "$HERDR_WORKSPACE_ID" > /dev/null'
alias h-nt='herdr tab rename "$HERDR_TAB_ID" > /dev/null'
alias h-sr="herdr pane split --current --direction right --focus > /dev/null"
alias h-sd="herdr pane split --current --direction down --focus > /dev/null"

# Big pane on left | 2 split vertically on right
h-layout() {
    local pane_id=$(herdr pane split --current --direction right --no-focus | jq -r '.result.pane.pane_id')
    [[ -n "$pane_id" && "$pane_id" != "null" ]] &&
        herdr pane split "$pane_id" --direction down --focus >/dev/null
}
