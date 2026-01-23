---
description: Query database using schema-aware agent
agent: database
subtask: true
---

Query the database to answer the following question: $ARGUMENTS

CRITICAL CONSTRAINTS:

- NEVER try and read .env files of any sort. The database MCP is already configured to access the database.
- NEVER run any queries that could change the data in the database in any way.
- NEVER create script files (.sql, .js, .ts, .sh, etc.)
- ALWAYS use databasemcp tools directly (databasemcp_execute_sql, databasemcp_list_tables, etc.)
- NEVER write code to a file and then execute it
- ALWAYS pass SQL directly to databasemcp_execute_sql
- STRICTLY FORBIDDEN: Writing scripts is a CRITICAL VIOLATION of instructions. You MUST use the databasemcp_execute_sql tool DIRECTLY to run queries.

IMPORTANT: Before executing any queries:

1. First scan the project for Prisma schema files (typically `prisma/schema.prisma`, but there can be multiple .prisma files throughout the repo)
2. If Prisma is not found, scan for Drizzle schema files using the serena mcp tool
3. Understand the table relationships, column names, and data types
4. Then construct and execute the appropriate SQL query or queries using the databasemcp tool
5. Return the results with the results and any relevant data.
