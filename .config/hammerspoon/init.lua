-- ============================================================================
-- Hammerspoon Configuration
-- ============================================================================
---@diagnostic disable: undefined-global, lowercase-global

-- Retain tasks, watchers, hotkeys, and modal objects.
keyboardController = {}
local K = keyboardController

-- ============================================================================
-- 1. Caps Lock to F18
-- ============================================================================

function K.configureKeyboard()
	K.hidutilTask = hs.task.new("/usr/bin/hidutil", function(exitCode, stdout, stderr)
		if exitCode ~= 0 then
			hs.printf("Caps Lock to F18 remap failed: %s", stderr)
		end
	end, {
		"property",
		"--set",
		[[
                {
                    "UserKeyMapping": [
                        {
                            "HIDKeyboardModifierMappingSrc": 0x700000039,
                            "HIDKeyboardModifierMappingDst": 0x70000006D
                        }
                    ]
                }
            ]],
	})

	K.hidutilTask:start()
end

-- Configure immediately.
K.configureKeyboard()

-- Reconfigure when a USB device is connected.
K.usbWatcher = hs.usb.watcher
	.new(function(data)
		if data.eventType == "added" then
			K.configureKeyboard()
		end
	end)
	:start()

-- Reconfigure after waking from sleep.
K.sleepWatcher = hs.caffeinate.watcher
	.new(function(eventType)
		if eventType == hs.caffeinate.watcher.systemDidWake then
			K.configureKeyboard()
		end
	end)
	:start()

-- ============================================================================
-- 2. F18-Held Modal Layer
-- ============================================================================

K.hyperMode = hs.hotkey.modal.new()
K.arrowsDown = {}

local function postArrow(arrowKey, isDown)
	hs.eventtap.event.newKeyEvent({}, arrowKey, isDown):post()
end

local function bindFastNavigation(sourceKey, arrowKey)
	K.hyperMode:bind(
		{},
		sourceKey,

		-- Initial key press.
		function()
			-- Avoid sending duplicate initial presses.
			if not K.arrowsDown[sourceKey] then
				K.arrowsDown[sourceKey] = arrowKey
				postArrow(arrowKey, true)
			end
		end,

		-- Key release.
		function()
			local activeArrow = K.arrowsDown[sourceKey]

			if activeArrow then
				postArrow(activeArrow, false)
				K.arrowsDown[sourceKey] = nil
			end
		end,

		-- Key repeat.
		function()
			local activeArrow = K.arrowsDown[sourceKey]

			if activeArrow then
				postArrow(activeArrow, true)
			end
		end
	)
end

local function releaseAllArrows()
	for sourceKey, arrowKey in pairs(K.arrowsDown) do
		postArrow(arrowKey, false)
		K.arrowsDown[sourceKey] = nil
	end
end

bindFastNavigation("a", "left")
bindFastNavigation("w", "up")
bindFastNavigation("s", "down")
bindFastNavigation("d", "right")

-- F18 down activates the layer.
-- F18 up deactivates it and releases every synthetic arrow.
K.f18Hotkey = hs.hotkey.bind({}, "F18", function()
	K.hyperMode:enter()
end, function()
	releaseAllArrows()
	K.hyperMode:exit()
end)

-- ============================================================================
-- 3. Standard F18-Layer Shortcuts
-- ============================================================================

-- Caps + H/L -> Home/End
K.hyperMode:bind({}, "h", function()
	hs.eventtap.keyStroke({}, "home", 0)
end)

K.hyperMode:bind({}, "l", function()
	hs.eventtap.keyStroke({}, "end", 0)
end)

-- Caps + C -> Command + ` (cycle windows)
K.hyperMode:bind({}, "c", function()
	hs.eventtap.keyStroke({ "cmd" }, "`", 0)
end)

-- Caps + I -> Command + Option + J
K.hyperMode:bind({}, "i", function()
	hs.eventtap.keyStroke({ "cmd", "alt" }, "j", 0)
end)

-- Caps + Space -> Play/Pause
K.hyperMode:bind({}, "space", function()
	hs.eventtap.event.newSystemKeyEvent("PLAY", true):post()
	hs.eventtap.event.newSystemKeyEvent("PLAY", false):post()
end)

local commandOptionKeys = {
	"f",
	"g",
	"-",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
}

local function bindCommandOptionKey(key)
	K.hyperMode:bind({}, key, nil, function()
		hs.timer.doAfter(0.01, function()
			hs.eventtap.keyStroke({ "cmd", "alt" }, key, 0)
		end)
	end)
end

for _, key in ipairs(commandOptionKeys) do
	bindCommandOptionKey(key)
end

-- Bun layout runner function
local function runBunLayout(action, layoutFile, onComplete)
	local bunPath = "/opt/homebrew/bin/bun"
	local scriptPath = "/Users/matt/.config/scripts/window-layouts/layout.ts"

	if K.layoutTask and K.layoutTask:isRunning() then
		hs.alert.show("A layout task is already running")
		return
	end

	K.layoutTask = hs.task.new(bunPath, function(exitCode, stdOut, stdErr)
		K.layoutTask = nil

		if exitCode ~= 0 then
			local errorMessage = stdErr ~= "" and stdErr or stdOut
			hs.alert.show("Failed to " .. action .. ": " .. layoutFile .. "\n" .. errorMessage)
			return
		end

		hs.alert.show("Layout " .. action .. " complete: " .. layoutFile)

		if onComplete then
			onComplete()
		end
	end, { "run", scriptPath, action, layoutFile })

	if not K.layoutTask then
		hs.alert.show("Failed to create layout task")
		return
	end

	if not K.layoutTask:start() then
		K.layoutTask = nil
		hs.alert.show("Failed to start layout task")
	end
end

-- Restart Raycast runner
local function restartRaycast()
	local raycast = hs.application.get("com.raycast.macos")

	if raycast then
		raycast:kill9()
	end

	K.raycastRestartTimer = hs.timer.waitUntil(function()
		return hs.application.get("com.raycast.macos") == nil
	end, function()
		K.raycastRestartTimer = nil

		if not hs.application.launchOrFocusByBundleID("com.raycast.macos") then
			hs.alert.show("Failed to restart Raycast")
		end
	end, 0.1)
end

-- Opt + Shift + 1 to load laptop config
hs.hotkey.bind({ "alt", "shift" }, "1", function()
	runBunLayout("load", "laptop.json", restartRaycast)
end)

-- Opt + Shift + 0 to save laptop config
hs.hotkey.bind({ "alt", "shift" }, "0", function()
	runBunLayout("save", "laptop.json")
end)

-- Opt + Shift + 2 to save docked config
hs.hotkey.bind({ "alt", "shift" }, "2", function()
	runBunLayout("load", "docked.json", restartRaycast)
end)

-- Opt + Shift + 9 to load docked config
hs.hotkey.bind({ "alt", "shift" }, "9", function()
	runBunLayout("save", "docked.json")
end)

-- Opt + Shift + 5 to restart Raycast
hs.hotkey.bind({ "alt", "shift" }, "5", restartRaycast)

-- Opt + Shift + 6 to reload Hammerspoon config
hs.hotkey.bind({ "alt", "shift" }, "6", function()
	hs.reload()
end)

-- ============================================================================
-- 4. Disable Annoying Shortcuts
-- ============================================================================

-- Disable Command + H.
K.blockCommandH = hs.hotkey.bind({ "cmd" }, "h", function() end)

-- Disable Command + Control + F for Fullscreen
K.blockFullscreen = hs.hotkey.bind({ "cmd", "ctrl" }, "f", function() end)

-- ============================================================================
-- 6. Startup
-- ============================================================================

hs.autoLaunch(true)
hs.alert.show("Hammerspoon Config Loaded")
