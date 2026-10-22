rex.bind("cmd+h", "pane.focus", { direction = "left" })
rex.bind("cmd+j", "pane.focus", { direction = "down" })
rex.bind("cmd+k", "pane.focus", { direction = "up" })
rex.bind("cmd+l", "pane.focus", { direction = "right" })

rex.bind("cmd+d", "pane.split", { direction = "right" })
rex.bind("cmd+shift+d", "pane.split", { direction = "down" })

rex.bind("cmd+shift+r", "client.config.reload")
rex.bind("cmd+shift+x", "client.palette.toggle")
rex.bind("cmd+o", "session.switch")

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

rex.bind("ctrl+d", "pane.send_key", { key = "ctrl+d" })
rex.bind("ctrl+shift+d", "pane.send_key", { key = "ctrl+shift+d" })
