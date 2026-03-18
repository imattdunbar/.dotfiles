-- ==========================================================================
-- 1. LEADER KEY & BASIC OPTIONS
-- ==========================================================================
vim.g.mapleader = " " -- Set Space as the leader key
vim.g.maplocalleader = " "

local opt = vim.opt
opt.number = true -- Show line numbers
opt.relativenumber = false -- SET THIS TO FALSE for absolute line numbers
opt.fillchars = { eob = " " } -- THIS REMOVES THE TILDES
opt.mouse = "a"
opt.ignorecase = true -- Ignore case in searches
opt.smartcase = true -- But don't ignore it if you use capital letters
opt.signcolumn = "yes" -- Always show the sign column (prevents text shifting)
opt.tabstop = 2 -- 2 spaces for tabs (standard for TS/Web)
opt.shiftwidth = 2
opt.expandtab = true
opt.updatetime = 250 -- Faster completion
opt.termguicolors = true -- True color support
opt.clipboard = "unnamedplus" -- Sync Neovim clipboard with macOS

-- ==========================================================================
-- 2. BOOTSTRAP LAZY.NVIM (Plugin Manager)
-- ==========================================================================
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
	vim.fn.system({
		"git",
		"clone",
		"--filter=blob:none",
		"https://github.com/folke/lazy.nvim.git",
		"--branch=stable",
		lazypath,
	})
end
vim.opt.rtp:prepend(lazypath)

-- ==========================================================================
-- 3. PLUGINS
-- ==========================================================================
require("lazy").setup({
	-- UI & Theme
	-- {
	-- 	"folke/tokyonight.nvim",
	-- 	priority = 1000,
	-- 	config = function()
	-- 		vim.cmd([[colorscheme tokyonight]])
	-- 	end,
	-- },

	-- UI & Theme Tokyonight (Transparent)
	-- {
	-- 	"folke/tokyonight.nvim",
	-- 	priority = 1000,
	-- 	config = function()
	-- 		require("tokyonight").setup({
	-- 			transparent = true, -- This is the magic line
	-- 			styles = {
	-- 				sidebars = "transparent",
	-- 				floats = "transparent",
	-- 			},
	-- 		})
	-- 		vim.cmd([[colorscheme tokyonight]])
	-- 	end,
	-- },

	-- Tokyonight Status Line (Sleek Tmux-style)
	-- {
	-- 	"nvim-lualine/lualine.nvim",
	-- 	dependencies = { "nvim-tree/nvim-web-devicons" },
	-- 	config = function()
	-- 		require("lualine").setup({
	-- 			options = {
	-- 				theme = "tokyonight", -- Matches your colorscheme
	-- 				component_separators = "", -- Clean look
	-- 				section_separators = { left = "", right = "" }, -- Rounded pill edges
	-- 				globalstatus = true, -- Only show one status line at the very bottom
	-- 			},
	-- 			-- Optional: Make the background of the statusline transparent too
	-- 			sections = {
	-- 				lualine_a = { "mode" },
	-- 				lualine_b = { "branch", "diff", "diagnostics" },
	-- 				lualine_c = { "filename" },
	-- 				lualine_x = { "encoding", "fileformat", "filetype" },
	-- 				lualine_y = { "progress" },
	-- 				lualine_z = { "location" },
	-- 			},
	-- 		})
	-- 	end,
	-- },

	-- UI & Theme (Poimandres - Transparent)
	{
		"olivercederborg/poimandres.nvim",
		priority = 1000,
		config = function()
			require("poimandres").setup({
				-- disable_background = true, -- Transparent main background
				-- disable_float_background = true, -- Transparent floating windows
			})
			vim.cmd([[colorscheme poimandres]])
		end,
	},

	-- Poinmandres Status Line
	{
		"nvim-lualine/lualine.nvim",
		dependencies = { "nvim-tree/nvim-web-devicons" },
		config = function()
			-- 1. Load the Poimandres lualine theme
			local custom_theme = require("lualine.themes.poimandres")

			-- 2. Strip the background from the middle section (c)
			custom_theme.normal.c.bg = "NONE"
			custom_theme.inactive.c.bg = "NONE"

			-- 3. Pass the custom theme into the setup
			require("lualine").setup({
				options = {
					theme = custom_theme,
					component_separators = "",
					section_separators = { left = "", right = "" },
					globalstatus = true,
				},
				sections = {
					lualine_a = { "mode" },
					lualine_b = { "branch", "diff", "diagnostics" },
					lualine_c = { "filename" },
					lualine_x = { "encoding", "fileformat", "filetype" },
					lualine_y = { "progress" },
					lualine_z = { "location" },
				},
			})
		end,
	},

	-- File Explorer
	{
		"nvim-neo-tree/neo-tree.nvim",
		branch = "v3.x",
		dependencies = { "nvim-lua/plenary.nvim", "nvim-tree/nvim-web-devicons", "MunifTanjim/nui.nvim" },
		keys = { { "<leader>e", "<cmd>Neotree toggle<cr>", desc = "Toggle Explorer" } },
	},

	-- Fuzzy Finder
	{
		"nvim-telescope/telescope.nvim",
		tag = "0.1.5",
		cmd = "Telescope",
		dependencies = { "nvim-lua/plenary.nvim" },
		keys = {
			{ "<leader>ff", "<cmd>Telescope find_files<cr>", desc = "Find Files" },
			{ "<leader>fg", "<cmd>Telescope live_grep<cr>", desc = "Live Grep" },
		},
	},

	-- Keybinding Cheat Sheet (Which-Key)
	{
		"folke/which-key.nvim",
		event = "VeryLazy", -- Loads in the background so it doesn't slow down startup
		init = function()
			vim.o.timeout = true
			vim.o.timeoutlen = 300 -- Wait 300ms before showing the popup
		end,
		opts = {
			-- You can leave this empty, the default UI is fantastic
		},
	},

	-- Dashboard (Startup Screen)
	{
		"goolord/alpha-nvim",
		dependencies = { "nvim-tree/nvim-web-devicons" },
		config = function()
			local alpha = require("alpha")
			local dashboard = require("alpha.themes.dashboard")

			-- A sleek Neovim logo in ASCII
			dashboard.section.header.val = {
				"                                                     ",
				"  ███╗   ██╗███████╗██████╗ ██╗   ██╗███╗   ███╗ ",
				"  ████╗  ██║██╔════╝██╔═══██╗██║   ██║████╗ ████║ ",
				"  ██╔██╗ ██║█████╗  ██║   ██║██║   ██║██╔████╔██║ ",
				"  ██║╚██╗██║██╔══╝  ██║   ██║╚██╗ ██╔╝██║╚██╔╝██║ ",
				"  ██║ ╚████║███████╗╚██████╔╝ ╚████╔╝ ██║ ╚═╝ ██║ ",
				"  ╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═══╝  ╚═╝     ╚═╝ ",
				"                                                     ",
			}

			-- Quick links that map to the Telescope binds we set up
			dashboard.section.buttons.val = {
				dashboard.button("f", "  Find file", "<cmd>Telescope find_files<CR>"),
				dashboard.button("n", "  New file", "<cmd>ene <BAR> startinsert<CR>"),
				dashboard.button("r", "  Recent files", "<cmd>Telescope oldfiles<CR>"),
				dashboard.button("g", "  Find text", "<cmd>Telescope live_grep<CR>"),
				dashboard.button("q", "  Quit", "<cmd>qa<CR>"),
			}

			-- Clean up the bottom footer
			dashboard.section.footer.val = { " " }

			alpha.setup(dashboard.opts)
		end,
	},

	-- Syntax Highlighting
	{
		"nvim-treesitter/nvim-treesitter",
		build = ":TSUpdate",
		config = function()
			require("nvim-treesitter.configs").setup({
				ensure_installed = {
					"typescript",
					"tsx",
					"javascript",
					"html",
					"css",
					"xml",
					"prisma",
					"terraform",
					"lua",
					"vim",
				},
				highlight = { enable = true },
			})
		end,
	},

	-- LSP & Formatting (The IDE Core)
	{
		"neovim/nvim-lspconfig",
		dependencies = {
			"williamboman/mason.nvim",
			"williamboman/mason-lspconfig.nvim",
			"WhoIsSethDaniel/mason-tool-installer.nvim",
			"stevearc/conform.nvim", -- Formatter plugin
			"hrsh7th/nvim-cmp", -- Autocompletion
			"hrsh7th/cmp-nvim-lsp",
			"L3MON4D3/LuaSnip",
		},
		config = function()
			-- Setup Mason (downloads LSPs and formatters automatically)
			require("mason").setup()
			require("mason-tool-installer").setup({
				ensure_installed = {
					"ts_ls",
					"html",
					"cssls",
					"lemminx",
					"terraformls",
					"prismals", -- LSPs
					"prettier",
					"xmlformatter", -- Formatters
				},
			})

			-- Autocompletion Setup
			local cmp = require("cmp")
			cmp.setup({
				snippet = {
					expand = function(args)
						require("luasnip").lsp_expand(args.body)
					end,
				},
				mapping = cmp.mapping.preset.insert({
					["<C-Space>"] = cmp.mapping.complete(),
					["<CR>"] = cmp.mapping.confirm({ select = true }), -- Accept currently selected item
					["<Tab>"] = cmp.mapping.select_next_item(),
					["<S-Tab>"] = cmp.mapping.select_prev_item(),
				}),
				sources = { { name = "nvim_lsp" } },
			})

			-- LSP Setup (Native Neovim 0.11+)
			local capabilities = require("cmp_nvim_lsp").default_capabilities()
			local servers = { "ts_ls", "html", "cssls", "lemminx", "terraformls", "prismals" }

			for _, lsp in ipairs(servers) do
				-- 1. Pass our autocompletion capabilities to the native config
				vim.lsp.config(lsp, { capabilities = capabilities })
				-- 2. Enable the server natively
				vim.lsp.enable(lsp)
			end

			-- Formatting Setup (Conform)
			require("conform").setup({
				formatters_by_ft = {
					javascript = { "prettier" },
					typescript = { "prettier" },
					javascriptreact = { "prettier" },
					typescriptreact = { "prettier" },
					css = { "prettier" },
					html = { "prettier" },
					json = { "prettier" },
					prisma = { "prismaFmt" }, -- Prisma uses its own LSP/formatter
					terraform = { "terraform_fmt" },
					xml = { "xmlformatter" },
				},
				format_on_save = {
					timeout_ms = 1000,
					lsp_fallback = true, -- Falls back to LSP formatting if no specific formatter is set
				},
			})

			-- LSP Keymaps (Only mapped when an LSP attaches to the buffer)
			vim.api.nvim_create_autocmd("LspAttach", {
				callback = function(event)
					local map = function(keys, func, desc)
						vim.keymap.set("n", keys, func, { buffer = event.buf, desc = "LSP: " .. desc })
					end
					map("gd", require("telescope.builtin").lsp_definitions, "Go to Definition")
					map("gr", require("telescope.builtin").lsp_references, "Go to References")
					map("K", vim.lsp.buf.hover, "Hover Documentation")
					map("<leader>rn", vim.lsp.buf.rename, "Rename Symbol")
					map("<leader>ca", vim.lsp.buf.code_action, "Code Action")
				end,
			})
		end,
	},
})

-- ==========================================================================
-- QUALITY OF LIFE KEYBINDS
-- ==========================================================================
local map = vim.keymap.set

map("i", "jk", "<ESC>", { desc = "Exit insert mode quickly" })

map("n", ";", ":", { desc = "Enter command mode without Shift" })

map("n", "<leader>w", "<cmd>w<CR>", { desc = "Save file" })
map("n", "<leader>q", "<cmd>q<CR>", { desc = "Quit window" })
map("n", "<leader>Q", "<cmd>qa!<CR>", { desc = "Force quit ALL without saving" })
map("n", "<leader>x", "<cmd>x<CR>", { desc = "Save and quit" })

map("n", "<leader>a", "ggVG", { desc = "Select All" })

-- Open the full Which-Key cheat sheet manually
map("n", "<leader>?", "<cmd>WhichKey<CR>", { desc = "Show all keymaps" })

-- Format file manually without saving
map("n", "<leader>fm", function()
	require("conform").format({ lsp_fallback = true })
end, { desc = "Format file" })
