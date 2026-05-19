import { $ } from 'bun'

const toolboxPath = `${import.meta.dir}/toolbox`

// Download the toolbox file
await $`curl -L -o ${toolboxPath} https://storage.googleapis.com/mcp-toolbox-for-databases/v1.2.0/darwin/arm64/toolbox`

// Make it executable
await $`chmod +x ${toolboxPath}`

/*

Example of the opencode.jsonc inside a project (or globally) for running the toolbox as an MCP
Here was pulled from a project where the path was:
PROJECT_DIR/.opencode/opencode.jsonc
---

{
    "$schema": "https://opencode.ai/config.json",
    "mcp": {
        "databasemcp": {
            "type": "local",
            "command": ["/Users/matt/.config/opencode/toolbox", "--prebuilt", "postgres", "--stdio"],
            "enabled": true,
            "environment": {
                "POSTGRES_HOST": "localhost",
                "POSTGRES_PORT": "5432",
                "POSTGRES_DATABASE": "purchaser_db",
                "POSTGRES_USER": "postgres",
                "POSTGRES_PASSWORD": "password"
            }
        }
    }
}

---
*/
