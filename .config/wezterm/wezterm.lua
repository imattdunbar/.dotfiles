local wezterm = require("wezterm")
local config = wezterm.config_builder()
local mux = wezterm.mux

-- inspiration -- https://github.com/joshmedeski/dotfiles/blob/main/.config/wezterm/wezterm.lua

config.color_scheme = "Catppuccin Mocha"
config.font = wezterm.font("FiraCode Nerd Font Mono", { weight = "Medium" })
config.font_size = 14.0

wezterm.on("gui-startup", function(cmd)
	local tab, pane, window = mux.spawn_window(cmd or {})
	window:gui_window():set_position(32, 128)
end)

-- config.exit_behavior = "Hold"

config.initial_rows = 48
config.initial_cols = 160

config.window_padding = {
	left = 16,
	right = 16,
	top = 16,
	bottom = 16,
}

-- For fancy tab bar only
config.window_frame = {
	font_size = 14.0,
	active_titlebar_bg = "rgba(0,0,0,0)",
	inactive_titlebar_bg = "rgba(0,0,0,0)",
}

config.window_close_confirmation = "NeverPrompt"
config.window_decorations = "RESIZE"
config.window_background_opacity = 0.85

config.tab_bar_at_bottom = true
config.use_fancy_tab_bar = true

config.colors = {
	tab_bar = {
		-- The color of the strip that goes along the top of the window
		-- (does not apply when fancy tab bar is in use)
		background = "rgba(0,0,0,0)",
		active_tab = {
			bg_color = "rgba(0,0,0,0)",
			fg_color = "#c0c0c0",
			intensity = "Bold",
		},
		inactive_tab = {
			bg_color = "rgba(0,0,0,0)",
			fg_color = "#808080",
		},
		inactive_tab_hover = {
			bg_color = "#3b3052",
			fg_color = "#909090",
		},
		new_tab = {
			bg_color = "rgba(0,0,0,0)",
			fg_color = "#808080",
		},
		new_tab_hover = {
			bg_color = "#3b3052",
			fg_color = "#909090",
		},
	},
}

wezterm.on("format-tab-title", function(tab, tabs, panes, config, hover, max_width)
	local pane = tab.active_pane
	-- local title = tab.tab_index + 1 .. " | " .. pane.title .. " "
	local title = " " .. tab.tab_index + 1
	return {
		{ Text = title },
	}
end)

local k = require("keys")

config.keys = {
	k.cmd_to_tmux_prefix("1", "1"),
	k.cmd_to_tmux_prefix("2", "2"),
	k.cmd_to_tmux_prefix("3", "3"),
	k.cmd_to_tmux_prefix("4", "4"),
	k.cmd_to_tmux_prefix("5", "5"),
	k.cmd_to_tmux_prefix("6", "6"),
	k.cmd_to_tmux_prefix("7", "7"),
	k.cmd_to_tmux_prefix("8", "8"),
	k.cmd_to_tmux_prefix("9", "9"),
	k.cmd_to_tmux_prefix("e", "e"),
	k.cmd_to_tmux_prefix("[", "p"),
	k.cmd_to_tmux_prefix("]", "n"),
	{ key = "1", mods = "ALT", action = wezterm.action({ ActivateTab = 0 }) },
	{ key = "2", mods = "ALT", action = wezterm.action({ ActivateTab = 1 }) },
	{ key = "3", mods = "ALT", action = wezterm.action({ ActivateTab = 2 }) },
	{ key = "4", mods = "ALT", action = wezterm.action({ ActivateTab = 3 }) },
	{ key = "5", mods = "ALT", action = wezterm.action({ ActivateTab = 4 }) },
	{ key = "6", mods = "ALT", action = wezterm.action({ ActivateTab = 5 }) },
	{ key = "7", mods = "ALT", action = wezterm.action({ ActivateTab = 6 }) },
	{ key = "8", mods = "ALT", action = wezterm.action({ ActivateTab = 7 }) },
	{ key = "9", mods = "ALT", action = wezterm.action({ ActivateTab = 8 }) },
	{ key = "[", mods = "ALT", action = wezterm.action.ActivateTabRelative(-1) },
	{ key = "]", mods = "ALT", action = wezterm.action.ActivateTabRelative(1) },
	{
		key = "w",
		mods = "CMD",
		action = wezterm.action.CloseCurrentPane({ confirm = false }),
	},
	{
		key = "b",
		mods = "CMD",
		action = wezterm.action(wezterm.action.PaneSelect),
	},
	{
		key = "DownArrow",
		mods = "CMD",
		action = wezterm.action.SplitVertical,
	},
	{
		key = "RightArrow",
		mods = "CMD",
		action = wezterm.action.SplitHorizontal,
	},
	{
		key = ".",
		mods = "CMD",
		action = wezterm.action({ ActivatePaneDirection = "Next" }),
	},
}

return config
