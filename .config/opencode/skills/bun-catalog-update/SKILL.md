---
name: bun-catalog-update
description: Use when updating package.json catalog dependencies in Bun projects to the latest npm versions.
---

# Bun Catalog Update

Read the current directory's `package.json`, get every package in the top-level `catalog`, check each latest version from npm, then run one Bun install command with caret-pinned latest versions.

Use Bun only.

```bash
bun install package@^latest.version another-package@^latest.version
```

Scoped package registry lookups need the slash encoded:

```ts
const encoded = name.startsWith('@') ? name.replace('/', '%2F') : name
const res = await fetch(`https://registry.npmjs.org/${encoded}/latest`)
```

If the catalog has:

```json
{
  "catalog": {
    "zod": "^4.3.6",
    "better-auth": "1.6.0"
  }
}
```

And npm says latest is `4.4.3` and `1.6.19`, run:

```bash
bun install zod@^4.4.3 better-auth@^1.6.19
```

Only include packages from `catalog`. Let Bun update `package.json` and `bun.lock`.
