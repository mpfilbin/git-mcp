/**
 * Git operation tools for MCP server
 * Re-exports all configuration functions for Git operations organized by category
 */

// Repository Management
export { configureRepositoryManagement } from './repository-management.js';

// Branch Operations
export { configureBranchOperations } from './branch-operations.js';

// File Operations
export { configureFileOperations } from './file-operations.js';

// Commit Operations
export { configureCommitOperations } from './commit-operations.js';

// Advanced Operations
export { configureAdvancedOperations } from './advanced-operations.js';

// Remote Operations
export { configureRemoteOperations } from './remote-operations.js';

// Note: simple-git.ts is intentionally NOT exported - internal only
