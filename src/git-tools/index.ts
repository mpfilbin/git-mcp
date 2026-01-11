/**
 * Git operation tools for MCP server
 * Re-exports all configuration functions for Git operations organized by category
 */

// Repository Management
export { configureRepositoryManagement } from './repository-management';

// Branch Operations
export { configureBranchOperations } from './branch-operations';

// File Operations
export { configureFileOperations } from './file-operations';

// Commit Operations
export { configureCommitOperations } from './commit-operations';

// Advanced Operations
export { configureAdvancedOperations } from './advanced-operations';

// Remote Operations
export { configureRemoteOperations } from './remote-operations';

// Note: simple-git.ts is intentionally NOT exported - internal only
