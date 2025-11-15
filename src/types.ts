/**
 * Common types and interfaces for the Git MCP server
 */

/**
 * Standard response format for all Git operations
 */
export interface GitOperationResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Repository path parameter (optional, defaults to current directory)
 */
export interface RepoPathParam {
  repoPath?: string;
}

/**
 * Status response data
 */
export interface StatusData {
  modified: string[];
  added: string[];
  deleted: string[];
  renamed: string[];
  conflicted: string[];
  notAdded: string[];
  staged: string[];
  current: string | null;
  tracking: string | null;
  ahead: number;
  behind: number;
  isClean: boolean;
}

/**
 * Branch information
 */
export interface BranchInfo {
  name: string;
  current: boolean;
  commit: string;
}

/**
 * Commit information
 */
export interface CommitInfo {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
}

/**
 * Remote information
 */
export interface RemoteInfo {
  name: string;
  refs: {
    fetch: string;
    push: string;
  };
}

/**
 * Diff summary
 */
export interface DiffData {
  files: Array<{
    file: string;
    changes: number;
    insertions: number;
    deletions: number;
  }>;
  insertions: number;
  deletions: number;
  changed: number;
}

