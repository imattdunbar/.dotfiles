local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
	vim.fn.system({
		"git",
		"clone",
		"--filter=blob:none",
		"https://github.com/folke/lazy.nvim.git",
		"--branch=stable", -- latest stable release
		lazypath,
	})
end
vim.opt.rtp:prepend(lazypath)

-- Vim options
vim.cmd("set expandtab")
vim.cmd("set tabstop=4")
vim.cmd("set softtabstop=4")
vim.cmd("set shiftwidth=4")
vim.cmd("set clipboard=unnamedplus")
vim.g.mapleader = " " -- leader == space

vim.keymap.set("n", "<C-c>", "<ESC>", {})
vim.keymap.set("n", "<C-q>", ":q!<CR>", {})
vim.keymap.set("n", "<C-s>", ":w!<CR>", {})
vim.keymap.set("n", "<leader>wq", ":wq!<CR>", {})

require("lazy").setup("plugins")
