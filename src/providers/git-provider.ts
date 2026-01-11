/**
 * Git Provider Interface
 *
 * Abstraction layer for Git operations, decoupled from any specific Git library implementation.
 * This interface defines all Git operations used by the MCP Git Server without depending on simple-git.
 */


export interface GitOperationResponse {
  success: boolean;
  message: string;
  data?: any;
}


/**
 * Status information for a Git repository
 */
export interface GitStatus {
  modified: string[];
  created: string[];
  deleted: string[];
  renamed: Array<{ from: string; to: string }>;
  conflicted: string[];
  not_added: string[];
  staged: string[];
  current: string | null;
  tracking: string | null;
  ahead: number;
  behind: number;
  isClean(): boolean;
}

/**
 * Information about a single branch
 */
export interface GitBranchInfo {
  name: string;
  commit: string;
  label: string;
  current: boolean;
}

/**
 * Summary of all branches in a repository
 */
export interface GitBranchSummary {
  detached: boolean;
  current: string;
  all: string[];
  branches: Record<string, GitBranchInfo>;
}

/**
 * Information about a single commit
 */
export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
  body: string;
  refs: string;
}

/**
 * Result of a log operation
 */
export interface GitLogResult {
  all: GitCommit[];
  total: number;
  latest: GitCommit | null;
}

/**
 * Summary of changes for a single file in a diff
 */
export interface GitDiffFileResult {
  file: string;
  changes?: number;
  insertions?: number;
  deletions?: number;
  binary: boolean;
}

/**
 * Summary of all changes in a diff
 */
export interface GitDiffSummary {
  files: GitDiffFileResult[];
  insertions: number;
  deletions: number;
  changed: number;
}

/**
 * Result of a commit operation
 */
export interface GitCommitResult {
  commit: string;
  branch: string;
  author: string | null;
  summary: {
    changes: number;
    insertions: number;
    deletions: number;
  };
}

/**
 * Result of a merge operation
 */
export interface GitMergeResult {
  merges: string[];
  conflicts: string[];
  result: string;
  summary: {
    changes: number;
    insertions: number;
    deletions: number;
  };
}

/**
 * Information about a single stash entry
 */
export interface GitStashEntry {
  hash: string;
  date: string;
  message: string;
  index: number;
}

/**
 * List of stash entries
 */
export interface GitStashList {
  all: GitStashEntry[];
  total: number;
  latest: GitStashEntry | null;
}

/**
 * Information about a Git remote
 */
export interface GitRemote {
  name: string;
  refs: {
    fetch: string;
    push: string;
  };
}

/**
 * Options for log operations
 */
export interface GitLogOptions {
  maxCount?: number;
  file?: string;
  from?: string;
  to?: string;
}

/**
 * Options for commit operations
 */
export interface GitCommitOptions {
  '--amend'?: null;
  [key: string]: any;
}

/**
 * Options for pull operations
 */
export interface GitPullOptions {
  '--rebase'?: null;
  [key: string]: any;
}

/**
 * Git Provider Interface
 *
 * Defines all Git operations used by the MCP Git Server.
 * Implementations of this interface can use any Git library or tool.
 */
export interface GitProvider {
  /**
   * Check if the current directory is a Git repository
   */
  checkIsRepo(): Promise<boolean>;

  /**
   * Get the status of the working tree
   */
  status(): Promise<GitStatus>;

  /**
   * Initialize a new Git repository
   */
  init(): Promise<void>;

  /**
   * Clone a repository from a URL
   */
  clone(url: string, targetPath: string): Promise<void>;

  /**
   * Get branch information
   * - No arguments: returns all branches
   * - With arguments: performs branch operations (create, delete, etc.)
   */
  branch(): Promise<GitBranchSummary>;
  branch(args: string[]): Promise<void>;

  /**
   * Checkout a branch or commit
   */
  checkout(ref: string): Promise<void>;

  /**
   * Checkout and create a new branch
   */
  checkoutBranch(branchName: string, startPoint: string): Promise<void>;

  /**
   * Merge a branch
   */
  merge(args: string[]): Promise<GitMergeResult>;

  /**
   * Get diff output
   */
  diff(args: string[]): Promise<string>;

  /**
   * Get diff summary
   */
  diffSummary(args: string[]): Promise<GitDiffSummary>;

  /**
   * Add files to staging area
   */
  add(files: string[]): Promise<void>;

  /**
   * Reset files or commits
   */
  reset(args: string[]): Promise<void>;

  /**
   * Execute raw git commands
   */
  raw(args: string[]): Promise<string>;

  /**
   * Commit changes
   */
  commit(message: string, files?: string[], options?: GitCommitOptions): Promise<GitCommitResult>;

  /**
   * Get commit log
   */
  log(options?: GitLogOptions): Promise<GitLogResult>;

  /**
   * Show details of a commit
   */
  show(args: string[]): Promise<string>;

  /**
   * Rebase commits
   */
  rebase(args: string[]): Promise<void>;

  /**
   * Stash changes
   */
  stash(args: string[]): Promise<void>;

  /**
   * Get list of stashes
   */
  stashList(): Promise<GitStashList>;

  /**
   * Get list of remotes
   */
  getRemotes(verbose: boolean): Promise<GitRemote[]>;

  /**
   * Add a new remote
   */
  addRemote(name: string, url: string): Promise<void>;

  /**
   * Fetch from remote
   */
  fetch(): Promise<void>;
  fetch(remote: string): Promise<void>;
  fetch(remote: string, branch: string): Promise<void>;

  /**
   * Pull from remote
   */
  pull(remote?: string, branch?: string, options?: GitPullOptions): Promise<void>;

  /**
   * Push to remote
   */
  push(remote?: string, branch?: string, options?: string[]): Promise<void>;
}

/**
 * Factory function type for creating GitProvider instances
 */
export type GitProviderFactory = (args: { repoPath?: string, required?: boolean}) => Promise<GitProvider>;
