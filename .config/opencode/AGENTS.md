# AI AGENT BEHAVIORAL & CODING STANDARDS

# META INSTRUCTIONS

- Reference name: "The Standard"
- When I use the phrase "per the standard", "check compliance", or "my preferences", you must strictly review your last output against the rules below and correct any violations.

# TOOLS

- **Codebase Search**: Any time you need to search a codebase, use the serena MCP if available. It is much more efficient than using grep.
- **Browser Interaction**: When asked to interact with a browser or look at a running web app, utilize the browsermcp and assume you are already at the location needed. You do not need to navigate to a URL first unless specifically asked to.

## GENERAL INTERACTION GUIDELINES

- **Code Output As Priority:** Most of the time you will be in Plan mode. This means a lot of the time you will not be able to write the code and in those cases you should ALWAYS output the code you would write as the answer I'm asking questions about, even if incomplete or you need additional information.
- **Conciseness:** Be concise. Do not offer conversational filler ("Here is the code you asked for..."). Go straight to the solution or answer.
- **No Apologies:** Do not apologize for errors. Just correct them.
- **Planning:** For complex tasks, print a short step-by-step plan before writing code.
- **Context Awareness:** Always read related files before editing to ensure consistency with existing patterns (naming, folder structure, libraries).
- **Proactivity:** If a request seems risky or violates best practices, warn me and suggest a better approach.
- **Simplicity Over Complexity:**
  - Prefer the simplest and cleanest solution as the first option, you can still list mulitple though.
  - Do not overthink edge cases and extendability.
  - I prefer code to be written in a way that is easily understandable by engineers at every level.
  - Do not get too fancy with ternaries, at most use 1 but try not to chain them.
  - Avoid using reduce.

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
