require("matt.plugins-setup")
require("matt.core.options")
require("matt.core.keymaps")
require("matt.core.colorscheme")

require("matt.plugins.comment")
require("matt.plugins.nvim-tree")
require("matt.plugins.lualine")
require("matt.plugins.telescope")
require("matt.plugins.nvim-cmp")

require("matt.plugins.lsp.mason")

-- Require saga before config
require("matt.plugins.lsp.lsp-saga")
require("matt.plugins.lsp.lsp-config")
require("matt.plugins.lsp.null-ls")

require("matt.plugins.autopairs")
require("matt.plugins.treesitter")

require("matt.plugins.gitsigns")
