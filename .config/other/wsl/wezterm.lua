local wezterm = require("wezterm")
local config = wezterm.config_builder()
local act = wezterm.action
local mux = wezterm.mux

-- 1. Default to your Ubuntu WSL2 instance & Linux Home
config.default_domain = "WSL:Ubuntu-26.04"

-- 2. Theme & Typography
config.color_scheme = "Catppuccin Mocha"
config.font = wezterm.font("FiraCode Nerd Font Mono", { weight = "Medium" })
config.font_size = 14.0
-- Keep TUI redraws from making a blinking cursor look erratic.
config.cursor_blink_rate = 0

-- 3. Window Sizing & Window Padding
config.initial_rows = 48
config.initial_cols = 160
config.window_padding = {
	left = 20,
	right = 8,
	top = 18,
	bottom = 0,
}
config.enable_scroll_bar = true

-- 4. Rounded Corners & Clean Borders (Windows 11 DWM)
config.window_close_confirmation = "NeverPrompt"
config.window_decorations = "RESIZE"
-- config.win32_system_backdrop = "Acrylic"
config.win32_system_backdrop = "Disable"
config.window_background_opacity = 0.88

-- 5. Tab Bar Styling (Bottom-aligned, minimal)
config.tab_bar_at_bottom = true
config.use_fancy_tab_bar = false
config.hide_tab_bar_if_only_one_tab = false

config.colors = {
	scrollbar_thumb = "#585b70",
	tab_bar = {
		background = "rgba(0, 0, 0, 0)",
		active_tab = {
			bg_color = "rgba(0, 0, 0, 0.4)",
			fg_color = "#cdd6f4",
			intensity = "Bold",
		},
		inactive_tab = {
			bg_color = "rgba(0, 0, 0, 0)",
			fg_color = "#6c7086",
		},
		inactive_tab_hover = {
			bg_color = "#313244",
			fg_color = "#cdd6f4",
		},
		new_tab = {
			bg_color = "rgba(0, 0, 0, 0)",
			fg_color = "#6c7086",
		},
		new_tab_hover = {
			bg_color = "#313244",
			fg_color = "#cdd6f4",
		},
	},
}

-- Minimal tab numbers (same format as your Mac setup)
wezterm.on("format-tab-title", function(tab)
	return {
		{ Text = "  " .. (tab.tab_index + 1) .. "  " },
	}
end)

-- Only show the scrollbar when the active pane has content above the viewport.
wezterm.on("update-status", function(window, pane)
	local dimensions = pane:get_dimensions()
	local has_scrollback = dimensions.scrollback_rows > dimensions.viewport_rows
	local overrides = window:get_config_overrides() or {}

	if overrides.enable_scroll_bar ~= has_scrollback then
		overrides.enable_scroll_bar = has_scrollback
		window:set_config_overrides(overrides)
	end
end)

-- Open new GUI instances centered on the active monitor at a comfortable size.
wezterm.on("gui-startup", function(cmd)
	local screen = wezterm.gui.screens().active
	local width = math.floor(screen.width * 2 / 3)
	local height = math.floor(screen.height * 3 / 4)
	local _, _, window = mux.spawn_window(cmd or {})
	local gui = window:gui_window()

	gui:set_inner_size(width, height)
	gui:set_position(
		screen.x + math.floor((screen.width - width) / 2),
		screen.y + math.floor((screen.height - height) / 2)
	)
end)

config.keys = {
	-- Tab creation & closing
	{ key = "t", mods = "CTRL", action = act.SpawnTab("CurrentPaneDomain") },
	{ key = "w", mods = "CTRL", action = act.CloseCurrentTab({ confirm = false }) },

	-- Switch tabs via Ctrl+1 through Ctrl+9
	{ key = "1", mods = "CTRL", action = act.ActivateTab(0) },
	{ key = "2", mods = "CTRL", action = act.ActivateTab(1) },
	{ key = "3", mods = "CTRL", action = act.ActivateTab(2) },
	{ key = "4", mods = "CTRL", action = act.ActivateTab(3) },
	{ key = "5", mods = "CTRL", action = act.ActivateTab(4) },
	{ key = "6", mods = "CTRL", action = act.ActivateTab(5) },
	{ key = "7", mods = "CTRL", action = act.ActivateTab(6) },
	{ key = "8", mods = "CTRL", action = act.ActivateTab(7) },
	{ key = "9", mods = "CTRL", action = act.ActivateTab(8) },

	-- Tab cycling
	{ key = "[", mods = "CTRL", action = act.ActivateTabRelative(-1) },
	{ key = "]", mods = "CTRL", action = act.ActivateTabRelative(1) },

	-- Splits & Navigation (retained under ALT to prevent shell collisions)
	{ key = "DownArrow", mods = "ALT", action = act.SplitVertical({ domain = "CurrentPaneDomain" }) },
	{ key = "RightArrow", mods = "ALT", action = act.SplitHorizontal({ domain = "CurrentPaneDomain" }) },
	{ key = ".", mods = "ALT", action = act.ActivatePaneDirection("Next") },

	-- Clipboard standard
	{ key = "c", mods = "CTRL|SHIFT", action = act.CopyTo("Clipboard") },
	{ key = "v", mods = "CTRL|SHIFT", action = act.PasteFrom("Clipboard") },

	{ key = "r", mods = "CTRL|SHIFT", action = act.ReloadConfiguration },

	-- 1. Nuke the ENTIRE WezTerm application (all windows/tabs)
	{
		key = "q",
		mods = "CTRL",
		action = act.QuitApplication,
	},

	-- 2. Close CURRENT WINDOW (all tabs in this window only, no confirmation)
	{
		key = "W",
		mods = "CTRL|SHIFT",
		action = act.CloseCurrentTab({ confirm = false }), -- Repeat per tab or use window
	},

	{
		key = "T",
		mods = "CTRL|SHIFT",
		action = act.SpawnCommandInNewTab({
			domain = { DomainName = "local" },
			args = { "C:\\Program Files\\gsudo\\Current\\gsudo.exe", "powershell.exe", "-NoLogo", "-NoExit" },
		}),
	},
}

return config
