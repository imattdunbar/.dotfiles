local mason_status, mason = pcall(require, "mason")

if not mason_status then
	return
end

local mason_lspconfig_status, mason_lspconfig = pcall(require, "mason-lspconfig")
if not mason_lspconfig_status then
	return
end

local mason_null_ls_status, mason_null_ls = pcall(require, "mason-null-ls")
if not mason_null_ls_status then
	return
end

mason.setup()

-- https://github.com/williamboman/mason-lspconfig.nvim

mason_lspconfig.setup({
	ensure_installed = {
		"tsserver",
		"tailwindcss",
		"rust_analyzer",
		"jsonls",
		"cssls",
		"gopls",
		"eslint",
		"lua_ls",
		"dockerls",
		"docker_compose_language_service",
		"kotlin_language_server",
		"sqls",
		"html",
		"emmet_ls",
	},
	automatic_installation = true,
})

-- mason_null_ls.setup({
-- 	automatic_setup = true,
-- })

mason_null_ls.setup({
	-- list of formatters & linters for mason to install
	ensure_installed = {
		"prettier", -- ts/js formatter
		"stylua", -- lua formatter
		"eslint_d", -- ts/js linter
	},
	-- auto-install configured formatters & linters (with null-ls)
	automatic_installation = true,
})
