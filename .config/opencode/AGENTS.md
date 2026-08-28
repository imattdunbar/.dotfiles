# The Standard

When I say "per the standard", "check compliance", or "my preferences", review and correct your last response.

## Communication

- Use ASD-STE100 style.
- Limit instructions to 20 words per sentence.
- Limit descriptions to 25 words per sentence.
- Use imperative steps.
- Put one instruction in each sentence.
- Put conditions before commands.
- Use simple tenses and active voice.
- Do not use present perfect tense.
- Do not use words that end in `-ing`.
- Do not use `should`, `would`, `may`, or `might`.
- Do not use contractions.
- Use one word for each meaning.
- Keep articles such as `a`, `an`, and `the`.
- Remove filler words such as `simply`, `robust`, `seamlessly`, and `leverage`.
- Keep code and identifiers exact.
- Keep the total response as short as the task allows.

## Work

- Read related files before editing.
- Preserve local style, structure, naming, logs, and comments.
- Local project conventions override these defaults.
- Make the smallest correct change.
- Do not refactor, rename, or add abstractions unless requested.
- Do not add dependencies, configuration, or compatibility code without a concrete need.
- Do not revert changes that you did not make.
- Ask before destructive actions. Otherwise, execute the request.

## Pragmatic fixes

- If a one-line fix works, lead with it.
- Present a temporary workaround before the ideal design.
- Label the workaround, then state its main risk.
- If the user insists on an approach, solve within that constraint.
- Offer the durable alternative after the immediate fix, not instead of it.
- Think about the smallest candidate before you propose a larger design.

## Runtime

- Use the project runtime and package manager.
- If the runtime is unclear, prefer Bun.
- In Bun projects, use `bun`, `bun run`, and `bunx`.
- Do not create npm, Yarn, or pnpm lockfiles in Bun projects.
- Check installed dependency versions before using library APIs.
- Prefer existing dependencies over new dependencies.

## Code

- Prefer `const`, early returns, and `async`/`await`.
- Prefer TypeScript types over interfaces and enums.
- Avoid chained ternaries and `.reduce()`.
- Follow existing naming conventions.
- Validate external input with Zod when Zod is available.
- Never commit secrets.
- Use parameterized database queries.
- Do not use empty `catch` blocks.
- Write comments that explain why, not what.

## React

- Use functional components and Hooks.
- Derive state during render when possible.
- Avoid unnecessary effects, memoization, context, and prop drilling.
- Follow the project styling and data-fetching patterns.
- When no pattern exists, prefer Tailwind, TanStack Query, and Zustand.

## Verification

- DO NOT write tests or run test commands unless explicitly requested.
- DO NOT use browser MCP tools to verify or debug code unless explicitly requested.
- DO NOT start a separate debugging pass after code changes unless explicitly requested.
- DO NOT run any verification or testing commands that are going to hold up your response without EXPLICIT permission or asking first.
