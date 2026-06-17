---
name: bun-catalog-update
description: Use when updating package.json catalog dependencies in Bun projects to the latest npm versions.
---

# Bun Catalog Update

Read the current directory's `package.json`, get every package in the top-level `catalog`, check each latest version from npm, update only the version values in the top-level `catalog`, then run Bun install to refresh the lockfile.

Use Bun only.

```bash
bun install --minimum-release-age 0
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

And npm says latest is `4.4.3` and `1.6.19`, update `package.json` to:

```json
{
  "catalog": {
    "zod": "^4.4.3",
    "better-auth": "^1.6.19"
  }
}
```

Then run:

```bash
bun install --minimum-release-age 0
```

Only update packages from `catalog`. Do not run `bun install package@version` for catalog updates because Bun may add those packages to root dependencies instead of updating the catalog. Keep existing non-catalog dependency entries unchanged and let Bun update only `bun.lock` after the catalog versions have been edited.
