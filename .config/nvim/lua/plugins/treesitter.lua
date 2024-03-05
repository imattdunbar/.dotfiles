return {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    config = function()
        local nvim_ts_config = require("nvim-treesitter.configs")
        nvim_ts_config.setup({
            auto_install = true,
            ensure_installed = { "lua", "javascript", "astro", "css", "go", "svelte", "typescript" },
            highlight = { enable = true },
            indent = { enable = true },
        })
    end,
}
