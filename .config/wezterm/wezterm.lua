local wezterm = require("wezterm")
local config = wezterm.config_builder()
local mux = wezterm.mux

-- inspiration -- https://github.com/joshmedeski/dotfiles/blob/main/.config/wezterm/wezterm.lua

config.color_scheme = "Catppuccin Mocha"

wezterm.on("gui-startup", function(cmd)
	local tab, pane, window = mux.spawn_window(cmd or {})
	window:gui_window():set_position(32, 128)
end)

config.initial_rows = 48
config.initial_cols = 160

config.window_padding = {
	left = 32,
	right = 16,
	top = 24,
	bottom = 16,
}

-- For fancy tab bar only
config.window_frame = {
	-- The size of the font in the tab bar.
	-- Default to 10.0 on Windows but 12.0 on other systems
	font_size = 14.0,

	-- The overall background color of the tab bar when
	-- the window is focused
	active_titlebar_bg = "rgba(0,0,0,0)",

	-- The overall background color of the tab bar when
	-- the window is not focused
	inactive_titlebar_bg = "rgba(0,0,0,0)",
}

config.window_close_confirmation = "NeverPrompt"
config.window_decorations = "RESIZE"
config.window_background_opacity = 0.8

config.tab_bar_at_bottom = true
config.use_fancy_tab_bar = true

config.colors = {
	tab_bar = {
		-- The color of the strip that goes along the top of the window
		-- (does not apply when fancy tab bar is in use)
		background = "rgba(0,0,0,0)",

		-- The active tab is the one that has focus in the window
		active_tab = {
			-- The color of the background area for the tab
			bg_color = "rgba(0,0,0,0)",
			-- The color of the text for the tab
			fg_color = "#c0c0c0",

			-- Specify whether you want "Half", "Normal" or "Bold" intensity for the
			-- label shown for this tab.
			-- The default is "Normal"
			intensity = "Normal",

			-- Specify whether you want "None", "Single" or "Double" underline for
			-- label shown for this tab.
			-- The default is "None"
			underline = "None",

			-- Specify whether you want the text to be italic (true) or not (false)
			-- for this tab.  The default is false.
			italic = false,

			-- Specify whether you want the text to be rendered with strikethrough (true)
			-- or not for this tab.  The default is false.
			strikethrough = false,
		},

		-- Inactive tabs are the tabs that do not have focus
		inactive_tab = {
			bg_color = "rgba(0,0,0,0)",
			fg_color = "#808080",

			-- The same options that were listed under the `active_tab` section above
			-- can also be used for `inactive_tab`.
		},

		-- You can configure some alternate styling when the mouse pointer
		-- moves over inactive tabs
		inactive_tab_hover = {
			bg_color = "#3b3052",
			fg_color = "#909090",
			italic = true,

			-- The same options that were listed under the `active_tab` section above
			-- can also be used for `inactive_tab_hover`.
		},

		-- The new tab button that let you create new tabs
		new_tab = {
			bg_color = "rgba(0,0,0,0)",
			fg_color = "#808080",

			-- The same options that were listed under the `active_tab` section above
			-- can also be used for `new_tab`.
		},

		-- You can configure some alternate styling when the mouse pointer
		-- moves over the new tab button
		new_tab_hover = {
			bg_color = "#3b3052",
			fg_color = "#909090",
			italic = true,

			-- The same options that were listed under the `active_tab` section above
			-- can also be used for `new_tab_hover`.
		},
	},
}

wezterm.on("format-tab-title", function(tab, tabs, panes, config, hover, max_width)
	local pane = tab.active_pane
	-- local title = tab.tab_index + 1 .. " | " .. pane.title .. " "

	local title = " " .. tab.tab_index + 1

	-- You can customize the title further here if needed
	-- Example: use the current working directory as the tab title
	-- title = pane.current_working_dir

	return {
		{ Text = title },
	}
end)

config.exit_behavior = "Hold"

config.font = wezterm.font("FiraCode Nerd Font Mono", { weight = "Medium" })
config.font_size = 14.0

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
	{ key = "1", mods = "ALT", action = wezterm.action({ ActivateTab = 0 }) },
	{ key = "2", mods = "ALT", action = wezterm.action({ ActivateTab = 1 }) },
	{ key = "3", mods = "ALT", action = wezterm.action({ ActivateTab = 2 }) },
	{ key = "4", mods = "ALT", action = wezterm.action({ ActivateTab = 3 }) },
	{ key = "5", mods = "ALT", action = wezterm.action({ ActivateTab = 4 }) },
	{ key = "6", mods = "ALT", action = wezterm.action({ ActivateTab = 5 }) },
	{ key = "7", mods = "ALT", action = wezterm.action({ ActivateTab = 6 }) },
	{ key = "8", mods = "ALT", action = wezterm.action({ ActivateTab = 7 }) },
	{ key = "9", mods = "ALT", action = wezterm.action({ ActivateTab = 8 }) },
	{
		key = "w",
		mods = "CMD",
		action = wezterm.action.CloseCurrentPane({ confirm = false }),
	},
}

-- local bar = wezterm.plugin.require("https://github.com/adriankarlen/bar.wezterm")
-- bar.apply_to_config(config, {
-- 	position = "bottom",
-- 	max_width = 32,
-- 	left_separator = " ",
-- 	right_separator = " ",
-- 	field_separator = "  |  ",
-- 	leader_icon = "",
-- 	workspace_icon = "",
-- 	pane_icon = "",
-- 	user_icon = "",
-- 	hostname_icon = "󰒋",
-- 	clock_icon = "󰃰",
-- 	cwd_icon = "",
-- 	enabled_modules = {
-- 		username = false,
-- 		hostname = false,
-- 		clock = false,
-- 		cwd = false,
-- 		workspace = false,
-- 	},
-- 	ansi_colors = {
-- 		workspace = 8,
-- 		leader = 2,
-- 		pane = 7,
-- 		active_tab = 4,
-- 		inactive_tab = 6,
-- 		username = 6,
-- 		hostname = 8,
-- 		clock = 5,
-- 		cwd = 7,
-- 	},
-- })

return config
