return {
	{
		"williamboman/mason.nvim",
		lazy = false,
		config = function()
			require("mason").setup()
		end,
	},
	{
		"williamboman/mason-lspconfig.nvim",
		lazy = false,
		config = function()
			require("mason-lspconfig").setup({
				ensure_installed = { "lua_ls", "ts_ls", "gopls", "astro", "eslint", "jsonls" },
				automatic_installation = true,
			})
		end,
	},
	{
		"neovim/nvim-lspconfig",
		config = function()
			local capabilities = require("cmp_nvim_lsp").default_capabilities()

			-- Configure ts_ls
			vim.lsp.config("ts_ls", {
				capabilities = capabilities,
			})
			vim.lsp.enable("ts_ls")

			-- Configure lua_ls
			vim.lsp.config("lua_ls", {
				capabilities = capabilities,
			})
			vim.lsp.enable("lua_ls")

			-- Configure gopls
			vim.lsp.config("gopls", {
				capabilities = capabilities,
				settings = {
					gopls = {
						gofumpt = true,
					},
				},
			})
			vim.lsp.enable("gopls")

			-- LSP keymaps
			vim.keymap.set("n", "K", vim.lsp.buf.hover, {})
			vim.keymap.set("n", "<leader>gd", vim.lsp.buf.definition, {})
			vim.keymap.set("n", "<leader>gr", vim.lsp.buf.references, {})
			vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, {})
		end,
	},
}
