# AI AGENT BEHAVIORAL & CODING STANDARDS

# META INSTRUCTIONS

- Reference name: "The Standard"
- When I use the phrase "per the standard", "check compliance", or "my preferences", you must strictly review your last output against the rules below and correct any violations.

# ENTROPY REMINDER

This codebase will outlive you. Every shortcut you take becomes
someone else's burden. Every hack compounds into technical debt
that slows the whole team down.

You are not just writing code. You are shaping the future of this
project. The patterns you establish will be copied. The corners
you cut will be cut again.

**Fight entropy. Leave the codebase better than you found it.**

## BROWSER & WEB TASKS

**IF** the user request involves:

- Visiting a website (e.g., "Go to google.com")
- Scraping or reading documentation from a URL
- Running end-to-end (E2E) tests
- Taking screenshots or visual inspection

**AND** the request is **NOT** related to GitHub Repositories:

- **Exclusion Rule:** If the URL is a GitHub repository (e.g., `github.com/user/repo`) and the goal is to search code, read files, or check commits, **DO NOT** use the browser agent.
- **Action:** Instead, use your native **gitmcp** tool to inspect the repository directly.

**THEN** you must:

1.  **STOP** attempting to use tools yourself.
2.  **DELEGATE** the task immediately to the `@browser` subagent.
3.  **INSTRUCT** the `@browser` agent with the specific goal (e.g., "@browser please navigate to X and retrieve the text from the header").

## CODE GENERATION PROTOCOL (STRICT)

**CRITICAL INSTRUCTION: PLAN MODE == CODE MODE**
When operating in "Plan Mode" or answering complex queries, you are strictly FORBIDDEN from producing text-only lists, bullet points, or high-level descriptions.

- **No Prose Plans:** Do not describe what you _will_ do. Show me the code that _does_ it.
- **Drafting Over Discussing:** If you are unsure of the implementation, output the **Code Skeleton** or **Interface Definitions** immediately.
- **Incomplete is Acceptable:** It is better to output a function with a `// TODO: Implement logic` comment inside a valid code block than to describe the function in a paragraph.
- **Show Your Work:** If you need to "think," think inside a code comment block, not in the chat response body.

**RESPONSE FORMAT:**

- **Conciseness:** Do not offer conversational filler ("Here is the code...", "I have analyzed...").
- **No Apologies:** Do not apologize for errors or incomplete logic. Just output the corrected or drafted code.
- **Context Awareness:** Always read related files before editing to ensure consistency.

**Safety & Simplicity:**

- **Simplicity:** Prefer the simplest solution. Do not over-engineer.
- **Ternaries:** Max 1 ternary. No chaining.
- **No Reduce:** Avoid `.reduce()`.
- **Proactivity:** Warn me only if a request is destructive. Otherwise, execute the draft.

## PACKAGE MANAGEMENT & RUNTIME (STRICT)

- **Runtime Authority:** Generally, most projects I work in use Bun. The following rules apply unless it is VERY obvious the project is not using Bun.
- **Prohibited Commands:**
  - NEVER use `npm`, `yarn`, or `pnpm`.
  - NEVER use `npx`.
- **Required Commands:**
  - Use `bun add [package]` instead of `npm install`.
  - Use `bun add -d [package]` for dev dependencies.
  - Use `bun run [script]` to execute `package.json` scripts.
  - Use `bunx [command]` instead of `npx`.
- **Lockfile:**
  - Only rely on `bun.lock` or `bun.lockb`. Do not generate `package-lock.json` or `yarn.lock`.
  - If you see a non-Bun lockfile, warn me to delete it. Unless the entire project is clearly an npm, pnpm or yarn project.
- **Shell Compatibility:**
  - When writing shell scripts or CI/CD pipelines, assume the environment is Bun.
- **Prefer Bun built-ins over Node:**
  - When dealing with things like `fs`, try to use the Bun equivalents instead of Node.
  - Do not recommend using the package `dotenv` for environment variables when using Bun.
- **Dependency Check**
  - When installing a dependency, make sure to accurately install it as a dev dependency if it is only needed for dev.

## TYPESCRIPT & GENERAL CODE QUALITY

- **Interfaces vs Types:** Prefer using types over interfaces
- **Immutability:** Prefer `const` over `let`. Never use `var`.
- **Naming Conventions:**
  - Variables/Functions: `camelCase`
  - Components/Classes: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Booleans: Prefix with `is`, `has`, `should` (e.g., `isVisible`, `hasError`).
- **Early Returns:** Use early returns (guard clauses) to reduce nesting complexity.
- **Async/Await:** Always use `async/await` syntax over `.then()` chains.
- **Enums:** Avoid using TypeScript enums. Prefer using `type SomeEnum = 'OPTION1' | 'OPTION2'` or zod enums.
- **Complex Validation Logic:** Avoid manually doing complex type validation logic. Utilize zod if possible to wrap the logic in a schema.
- **Package/Dependency Awareness:**
  - Before recommending a solution that utilizes a library, make sure to check what version is installed or use an already installed package.
  - When utilizing a library in a solution, make sure that functions/variables used actually exist in the package.
  - If your knowledge about a particular package does not seem correct, try and look up the documentation for the package.

## PREFERRED LIBRARIES (IF NEEDED)

- **Input Validation:** zod (>4.0)
- **Dates:** dayjs
- **State Management:** zustand
- **Data Fetching & Mutations:** Tanstack Query

## REACT (FRONTEND)

- **Functional Components:** Use functional components with Hooks. NEVER use class components.
- **Component Structure:**
  ```tsx
  export const MyComponent = (props: { prop1: string; prop2: number }) => {
    const props = { prop1, prop2 }
  }
  ```
- **State Management:**
  - Avoid `useEffect` for derived state. Calculate derived state directly in the render body or utilize Tanstack Query.
  - Avoid prop drilling more than 1-2 components deep.
  - When data is needed in deep component trees, avoid prop drilling and context; call useQuery in each component that needs the data.
  - If the data that needs to be shared throughout nested components is not related to a useQuery, then you should recommend zustand as an option.
  - Unless absolutely necessary do not recommend using React Context.
- **Avoid React Overengineering**
  - Unless absolutely necessary avoid using advanced React Hooks like: useMemo, useCallback, useImperativeHandle, useLayoutEffect
- **Styling:** (Adjust based on your stack, e.g., Tailwind):
  - Use Tailwind utility classes.
  - Avoid inline styles (`style={{...}}`) unless dynamic values are required.
  - Use `clsx` or `tailwind-merge` for conditional class names (if they are installed).
- **Data Fetching & Mutation:** Always use Tanstack Query for data fetching and mutations.

## BACKEND (NODE API)

- **Validation:** ALWAYS validate external inputs (API body, query params) using **Zod**.
- **Security:**
  - Never commit secrets/API keys.
  - Assume all inputs are malicious. Sanitize SQL/NoSQL queries (use parameterized queries or ORM methods).
- **Error Handling:**
  - Do not use empty `try/catch` blocks.

## TESTING & DOCUMENTATION

- **Comments:** Write "Why" comments, not "What" comments. Explain complex logic, but let clean code explain the basics.
