# Usage Examples

This document provides examples of how to use the MCP Git Server tools with GitHub Copilot.

## Natural Language Usage with Copilot

Once the MCP server is configured, you can use natural language with GitHub Copilot to perform Git operations:

### Status and Information

- "Show me the git status"
- "What branches do I have?"
- "Show me the last 5 commits"
- "What files have changed?"
- "Show me the diff for src/index.ts"

### Branch Operations

- "Create a new branch called feature/authentication"
- "Switch to the main branch"
- "Delete the old-feature branch"
- "Merge the feature branch into current branch"
- "List all remotes"

### Staging and Committing

- "Stage all files"
- "Stage src/index.ts and README.md"
- "Unstage the config file"
- "Commit these changes with message 'Add authentication feature'"
- "Show me the last commit details"

### Remote Operations

- "Pull from origin"
- "Push to origin main"
- "Fetch from upstream"
- "Push with force to my-remote feature-branch"

### Advanced Operations

- "Stash my current changes"
- "Pop the stashed changes"
- "List all stashes"
- "Rebase onto main"
- "Cherry-pick commit abc123"

## Direct Tool Invocation Examples

If you're using the MCP server directly or need specific parameters:

### Basic Status Check

```json
{
  "tool": "git_status",
  "arguments": {}
}
```

Response:
```json
{
  "success": true,
  "message": "Working tree has changes",
  "data": {
    "modified": ["src/index.ts"],
    "added": [],
    "deleted": [],
    "renamed": [],
    "conflicted": [],
    "notAdded": ["new-file.ts"],
    "staged": ["README.md"],
    "current": "main",
    "tracking": "origin/main",
    "ahead": 1,
    "behind": 0,
    "isClean": false
  }
}
```

### Stage Multiple Files

```json
{
  "tool": "git_add",
  "arguments": {
    "files": ["src/index.ts", "src/simple-git.ts", "README.md"]
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Staged 3 file(s): src/index.ts, src/simple-git.ts, README.md"
}
```

### Create and Switch to New Branch

```json
{
  "tool": "git_checkout",
  "arguments": {
    "ref": "feature/new-api",
    "createBranch": true
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Created and switched to branch 'feature/new-api'"
}
```

### Commit with Message

```json
{
  "tool": "git_commit",
  "arguments": {
    "message": "Add new API endpoints for user management",
    "files": ["src/api/users.ts", "src/routes.ts"]
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Committed changes: a1b2c3d",
  "data": {
    "commit": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
    "summary": {
      "changes": 2,
      "insertions": 45,
      "deletions": 3
    }
  }
}
```

### View Commit History

```json
{
  "tool": "git_log",
  "arguments": {
    "maxCount": 5
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Retrieved 5 commit(s)",
  "data": [
    {
      "hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
      "date": "2025-10-21T10:30:00-07:00",
      "message": "Add new API endpoints for user management",
      "author_name": "John Doe",
      "author_email": "john@example.com"
    }
  ]
}
```

### Get Diff of Staged Changes

```json
{
  "tool": "git_diff",
  "arguments": {
    "cached": true
  }
}
```

### Push to Remote with Upstream

```json
{
  "tool": "git_push",
  "arguments": {
    "remote": "origin",
    "branch": "feature/new-api",
    "setUpstream": true
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Pushed to origin/feature/new-api"
}
```

### Stash Changes with Message

```json
{
  "tool": "git_stash",
  "arguments": {
    "message": "WIP: refactoring authentication logic",
    "includeUntracked": true
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Stashed changes: WIP: refactoring authentication logic"
}
```

### List All Stashes

```json
{
  "tool": "git_stash_list",
  "arguments": {}
}
```

Response:
```json
{
  "success": true,
  "message": "Found 2 stash(es)",
  "data": [
    {
      "hash": "stash@{0}",
      "date": "2025-10-21 10:00:00 -0700",
      "message": "WIP: refactoring authentication logic"
    },
    {
      "hash": "stash@{1}",
      "date": "2025-10-20 15:30:00 -0700",
      "message": "WIP on main: previous work"
    }
  ]
}
```

### Rebase onto Main

```json
{
  "tool": "git_rebase",
  "arguments": {
    "branch": "main"
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Rebased onto 'main'"
}
```

### Clone a Repository

```json
{
  "tool": "git_clone",
  "arguments": {
    "url": "https://github.com/user/repo.git",
    "targetPath": "my-project"
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Cloned repository from https://github.com/user/repo.git to my-project"
}
```

## Working with Different Repositories

All tools accept an optional `repoPath` parameter to work with repositories other than the current directory:

```json
{
  "tool": "git_status",
  "arguments": {
    "repoPath": "/path/to/other/repo"
  }
}
```

## Error Handling

When an operation fails, you'll receive a structured error response:

```json
{
  "success": false,
  "message": "Failed to checkout: pathspec 'nonexistent-branch' did not match any file(s) known to git"
}
```

This consistent error format makes it easy for Copilot to understand what went wrong and suggest corrections.

## Tips for Using with Copilot

1. **Be specific**: Instead of "commit", say "commit the changes to auth.ts with message 'Fix login bug'"
2. **Chain operations**: You can ask Copilot to perform multiple operations in sequence
3. **Check status first**: Before complex operations, ask to "show git status" to understand the current state
4. **Use natural language**: The MCP server is designed to work with Copilot's natural language understanding

