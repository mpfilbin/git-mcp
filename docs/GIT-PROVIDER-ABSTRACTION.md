# Git Provider Abstraction Layer

## Overview

The `GitProvider` interface provides a clean abstraction layer for Git operations, decoupling the MCP Git Server from the `simple-git` library. This design enables:

- **Easier testing**: Mock implementations for unit tests
- **Flexibility**: Swap Git implementations without changing business logic
- **Type safety**: Well-defined interfaces independent of third-party libraries
- **Future-proofing**: Easy migration to different Git libraries or direct Git CLI usage

## Architecture

```
┌─────────────────────────────────────┐
│   Git Tools (Business Logic)       │
│   - repository-management.ts        │
│   - branch-operations.ts            │
│   - etc.                            │
└─────────────┬───────────────────────┘
              │ depends on
              ▼
┌─────────────────────────────────────┐
│   GitProvider Interface             │
│   (git-provider.ts)                 │
│   - Defines all Git operations      │
│   - No dependencies on simple-git   │
└─────────────┬───────────────────────┘
              │ implemented by
              ▼
┌─────────────────────────────────────┐
│   SimpleGitAdapter                  │
│   (simple-git-adapter.ts)           │
│   - Implements GitProvider          │
│   - Wraps simple-git library        │
└─────────────────────────────────────┘
```

## Files

### `git-provider.ts`

Defines the core abstraction:

- **Interfaces for Git data structures**:
  - `GitStatus` - Repository status information
  - `GitBranchSummary` - Branch information
  - `GitLogResult` - Commit history
  - `GitDiffSummary` - File changes
  - `GitCommitResult` - Commit results
  - `GitMergeResult` - Merge results
  - `GitStashList` - Stash entries
  - `GitRemote` - Remote repository info

- **GitProvider interface**: Defines all Git operations
  - Repository management: `checkIsRepo()`, `init()`, `clone()`
  - Branch operations: `branch()`, `checkout()`, `merge()`
  - File operations: `diff()`, `add()`, `reset()`, `raw()`
  - Commit operations: `commit()`, `log()`, `show()`
  - Advanced operations: `rebase()`, `stash()`, `stashList()`
  - Remote operations: `getRemotes()`, `fetch()`, `pull()`, `push()`

- **GitProviderFactory type**: Factory function signature for creating providers

### `simple-git-adapter.ts`

Implements `GitProvider` using the `simple-git` library:

- `SimpleGitAdapter` class - Wraps simple-git and implements GitProvider
- `createSimpleGitAdapter()` factory - Creates adapter instances

## Usage Examples

### Current Usage (Direct simple-git)

```typescript
import simpleGit from 'simple-git';

const git = simpleGit('/path/to/repo');
const status = await git.status();
```

### With GitProvider Abstraction

```typescript
import { GitProvider } from './git-provider.js';
import { createSimpleGitAdapter } from './simple-git-adapter.js';

const git: GitProvider = createSimpleGitAdapter('/path/to/repo');
const status = await git.status();
```

### Creating a Mock Implementation for Testing

```typescript
import { GitProvider, GitStatus } from './git-provider.js';

class MockGitProvider implements GitProvider {
  async checkIsRepo(): Promise<boolean> {
    return true;
  }

  async status(): Promise<GitStatus> {
    return {
      modified: ['file1.ts'],
      created: [],
      deleted: [],
      renamed: [],
      conflicted: [],
      not_added: [],
      staged: ['file1.ts'],
      current: 'main',
      tracking: 'origin/main',
      ahead: 0,
      behind: 0,
      isClean: () => false,
    };
  }

  // Implement other methods...
}

// Use in tests
const mockGit = new MockGitProvider();
const status = await mockGit.status();
```

### Creating a Custom Implementation

```typescript
import { GitProvider } from './git-provider.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git provider that uses the native git CLI instead of simple-git
 */
class NativeGitProvider implements GitProvider {
  constructor(private basePath: string) {}

  async checkIsRepo(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { cwd: this.basePath });
      return true;
    } catch {
      return false;
    }
  }

  async status(): Promise<GitStatus> {
    const { stdout } = await execAsync('git status --porcelain', {
      cwd: this.basePath,
    });

    // Parse git output and return GitStatus
    // ... implementation details
  }

  // Implement other methods using git CLI commands...
}
```

## Migrating to the Abstraction

To migrate existing code to use the `GitProvider` abstraction:

### Step 1: Update `simple-git.ts`

**Before:**
```typescript
import simpleGit, { SimpleGit } from 'simple-git';

function getGit(repoPath?: string): SimpleGit {
  const basePath = repoPath || process.cwd();
  return simpleGit(basePath);
}
```

**After:**
```typescript
import { GitProvider } from './git-provider.js';
import { createSimpleGitAdapter } from './simple-git-adapter.js';

function getGit(repoPath?: string): GitProvider {
  const basePath = repoPath || process.cwd();
  return createSimpleGitAdapter(basePath);
}
```

### Step 2: Update Type Imports

**Before:**
```typescript
import { StatusResult, BranchSummary, LogResult } from 'simple-git';
```

**After:**
```typescript
import { GitStatus, GitBranchSummary, GitLogResult } from './git-provider.js';
```

### Step 3: Update Type Annotations

**Before:**
```typescript
const status: StatusResult = await git.status();
const branches: BranchSummary = await git.branch();
const log: LogResult = await git.log(options);
```

**After:**
```typescript
const status: GitStatus = await git.status();
const branches: GitBranchSummary = await git.branch();
const log: GitLogResult = await git.log(options);
```

## Benefits

### 1. **Testability**

Mock implementations make unit testing easier without actual Git operations:

```typescript
// Test without touching the file system
const mockGit = new MockGitProvider();
const result = await gitStatus({ repoPath: '/test' }, mockGit);
```

### 2. **Flexibility**

Swap implementations based on environment or requirements:

```typescript
const git: GitProvider = process.env.USE_NATIVE_GIT
  ? new NativeGitProvider(basePath)
  : createSimpleGitAdapter(basePath);
```

### 3. **Type Safety**

Interface defines exact contracts, catching errors at compile time:

```typescript
// TypeScript ensures all required methods are implemented
class CustomGitProvider implements GitProvider {
  // Must implement all GitProvider methods or compilation fails
}
```

### 4. **Decoupling**

Business logic is independent of library implementation details:

- If simple-git API changes, only update the adapter
- If switching to a different library, create a new adapter
- Core git-tools code remains unchanged

## Type Mapping

| simple-git Type | GitProvider Type | Description |
|-----------------|------------------|-------------|
| `SimpleGit` | `GitProvider` | Main interface |
| `StatusResult` | `GitStatus` | Repository status |
| `BranchSummary` | `GitBranchSummary` | Branch information |
| `LogResult` | `GitLogResult` | Commit history |
| `DiffSummary` | `GitDiffSummary` | File changes summary |
| N/A | `GitCommitResult` | Commit operation result |
| N/A | `GitMergeResult` | Merge operation result |
| N/A | `GitStashList` | Stash list |
| N/A | `GitRemote` | Remote information |

## Future Enhancements

Potential improvements to the abstraction:

1. **Dependency Injection**: Pass GitProvider instances to functions instead of creating them internally
2. **Configuration**: GitProvider factory with configuration options
3. **Caching**: Decorator pattern for caching Git operations
4. **Logging**: Built-in logging for all Git operations
5. **Retry Logic**: Automatic retry for transient failures
6. **Performance Monitoring**: Track operation duration and performance metrics

## Example: Dependency Injection Pattern

```typescript
// Instead of creating git instance internally
export const gitStatus = async (args: { repoPath?: string }): Promise<GitOperationResponse> => {
  const git = getGit(args.repoPath);  // Created internally
  const status = await git.status();
  // ...
};

// Use dependency injection
export const gitStatus = async (
  args: { repoPath?: string },
  gitProvider?: GitProvider  // Injected dependency
): Promise<GitOperationResponse> => {
  const git = gitProvider || getGit(args.repoPath);
  const status = await git.status();
  // ...
};

// Testing becomes trivial
const mockGit = new MockGitProvider();
const result = await gitStatus({ repoPath: '/test' }, mockGit);
```

## Conclusion

The `GitProvider` abstraction provides a solid foundation for maintainable, testable, and flexible Git operations. While the current implementation uses simple-git, the abstraction allows for easy migration to alternative implementations as requirements evolve.
