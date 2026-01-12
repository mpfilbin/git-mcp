# MCP Git Server Copilot Instructions

When performing source control operations using git, **ALWAYS** use the tooling provided by the `git` MCP server, like: `git_add`, `git_clone`, `git_status` etc.

## Architecture Overview

This is a **Model Context Protocol (MCP) server** that exposes Git operations as tools for GitHub Copilot. The architecture follows a clean layered design:

- **MCP Tools Layer** (`src/index.ts`): Tool definitions and MCP server setup
- **Git Tools Layer** (`src/git-tools/`): Business logic organized by operation type
- **Provider Abstraction** (`src/providers/`): Clean interface abstracting Git operations
- **SimpleGit Adapter** (`src/providers/simple-git/`): Concrete Git implementation

### Key Architectural Patterns

**Provider Pattern**: All Git operations go through `GitProvider` interface. Never directly import `simple-git` in business logic - always use the provider factory pattern from `git-tools/` modules.

**Tool Organization**: Git operations are grouped by category in separate modules:
- `repository-management.ts` - status, init, clone
- `branch-operations.ts` - branch, checkout, merge  
- `file-operations.ts` - diff, add, reset, restore
- `commit-operations.ts` - commit, log, show
- `advanced-operations.ts` - rebase, stash operations
- `remote-operations.ts` - fetch, pull, push, remotes

## Development Workflow

### Build System
- **Single Bundle**: `npm run build` uses esbuild to create `dist/index.js` with all dependencies bundled
- **No node_modules**: The built artifact is self-contained for distribution
- **Development**: Use `npm run dev` to build and test locally

### Testing Strategy
- **Provider Mocking**: Tests use `MockGitProvider` class from `src/__tests__/utils/mock-git-provider.ts`
- **Category Coverage**: Each git-tools module has corresponding tests (e.g., `branch-operations.test.ts`)
- **Tool Response Format**: All operations return `{ success: boolean, message: string, data?: any }`

### Error Handling Pattern
All Git operations follow consistent error handling:
```typescript
try {
  const git = await getGit({ repoPath: args.repoPath });
  // perform operation
  return { success: true, message: "...", data: result };
} catch (error: any) {
  return { success: false, message: `Failed to ...: ${error.message}` };
}
```

### Type Safety
- **Provider Types**: Use `GitProviderFactoryImplementing<'operation1' | 'operation2'>` to specify required Git capabilities
- **Interface Definitions**: All Git data structures are typed in `git-provider.ts` 
- **Tool Schemas**: MCP tool schemas in `index.ts` define parameter validation

## Critical Implementation Rules

1. **Provider Factory Pattern**: Always configure tools with `getGit` factory, never instantiate providers directly
2. **Path Handling**: Use `repoPath` parameter for Git operations, defaults to current directory
3. **Error Boundaries**: Wrap all Git operations in try-catch returning GitOperationResponse
4. **Test Coverage**: New Git tools require corresponding tests with MockGitProvider
5. **Tool Registration**: New Git operations need both tool definition in `index.ts` AND route handler

## Adding New Git Operations

1. Add interface definition to `GitProvider` in `git-provider.ts`
2. Implement in `SimpleGitAdapter` class
3. Create/update relevant git-tools module with configuration function
4. Add tool definition to `tools` array in `index.ts` 
5. Add request handler in main switch statement
6. Write tests using `MockGitProvider`

Example: See `src/git-tools/branch-operations.ts` and corresponding test file for the complete pattern.
