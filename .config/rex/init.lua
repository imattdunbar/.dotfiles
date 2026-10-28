rex.bind("cmd+h", "pane.focus", { direction = "left" })
rex.bind("cmd+j", "pane.focus", { direction = "down" })
rex.bind("cmd+k", "pane.focus", { direction = "up" })
rex.bind("cmd+l", "pane.focus", { direction = "right" })

rex.bind("cmd+d", "pane.split", { direction = "right" })
rex.bind("cmd+shift+d", "pane.split", { direction = "down" })

rex.bind("cmd+shift+r", "client.config.reload")
rex.bind("cmd+shift+x", "client.palette.toggle")
rex.bind("cmd+o", "session.switch")

rex.action{
	name = "setup",
	title = "Set Up Main Session",
	run = function(ctx, args)
		-- Preserve all names if main already exists.
		local result = assert(rex.call("session.list"))
		local sessions = result.sessions or {}

		for _, session in ipairs(sessions) do
			if session.label == "main" then
				return
			end
		end

		-- Select the first session and its first tab.
		local first = sessions[1]
		if first == nil then return end

		local view = assert(rex.session.view{
			session_id = first.session_id,
		})
		local tab = (view.windows or {})[1]
		if tab == nil then return end

		-- Name the tab before the session so a failure permits a retry.
		assert(rex.session.set_window_label{
			session_id = first.session_id,
			window_id = tab.window_id,
			label = "herdr",
		})

		assert(rex.session.set_label{
			session_id = first.session_id,
			label = "main",
		})
	end,
}

rex.bind("cmd+u", "setup")

rex.bind("cmd+shift+b", function()
	rex.block.call("com.superlogical.terminal", "write", {
		data = "fsb\r",
	})
	return true
end)

rex.bind("cmd+shift+c", function()
	rex.block.call("com.superlogical.terminal", "write", {
		data = "pwd | pbcopy\r",
	})
	return true
end)

rex.bind("cmd+shift+t", function(ctx)
	local block_id = assert(ctx.block_id, "No focused pane")
	local process = assert(rex.block.call(
		"com.superlogical.terminal", "process", {
			block_id = block_id,
		}
	))
	local cwd = process.foreground and process.foreground.cwd
	assert(cwd, "No directory available")

	local pane = assert(rex.session.describe_block{
		block_id = block_id,
	})

	assert(rex.session.new_layer{
		window_id = assert(pane.block.window_id),
		bounds = { 0.1, 0.1, 0.8, 0.8 },
		focus = true,
		layout = rex.layout.block{
			flavor = "com.superlogical.terminal.shell",
			options = { cwd = cwd },
		},
	})
	return true
end)

rex.bind("ctrl+d", "pane.send_key", { key = "ctrl+d" })
rex.bind("ctrl+shift+d", "pane.send_key", { key = "ctrl+shift+d" })
