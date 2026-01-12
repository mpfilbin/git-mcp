/**
 * Mock GitProvider for testing
 */

import type {
  GitProvider,
  GitStatus,
  GitBranchSummary,
  GitCommitResult,
  GitLogResult,
  GitCommit,
  GitDiffSummary,
  GitMergeResult,
  GitStashList,
  GitRemote,
  GitLogOptions,
  GitCommitOptions,
  GitPullOptions,
  GitProviderFactory
} from '../../providers/git-provider';

export class MockGitProvider implements GitProvider {
  // Mock data that can be configured for tests
  public mockStatus: GitStatus = {
    modified: [],
    created: [],
    deleted: [],
    renamed: [],
    conflicted: [],
    not_added: [],
    staged: [],
    current: 'main',
    tracking: 'origin/main',
    ahead: 0,
    behind: 0,
    isClean: () => true
  };

  public mockBranches: GitBranchSummary = {
    detached: false,
    current: 'main',
    all: ['main'],
    branches: {
      main: {
        name: 'main',
        commit: 'abc123',
        label: 'main',
        current: true
      }
    }
  };

  public mockCommits: GitCommit[] = [
    {
      hash: 'abc123',
      date: '2024-01-01',
      message: 'Initial commit',
      author_name: 'Test User',
      author_email: 'test@example.com',
      body: '',
      refs: ''
    }
  ];

  public mockDiffOutput: string = 'diff --git a/file.txt b/file.txt\n+added line';

  public mockDiffSummary: GitDiffSummary = {
    files: [
      {
        file: 'file.txt',
        changes: 1,
        insertions: 1,
        deletions: 0,
        binary: false
      }
    ],
    insertions: 1,
    deletions: 0,
    changed: 1
  };

  public mockCommitResult: GitCommitResult = {
    commit: 'def456',
    branch: 'main',
    author: 'Test User <test@example.com>',
    summary: {
      changes: 1,
      insertions: 1,
      deletions: 0
    }
  };

  public mockMergeResult: GitMergeResult = {
    merges: ['feature-branch'],
    conflicts: [],
    result: 'success',
    summary: {
      changes: 1,
      insertions: 1,
      deletions: 0
    }
  };

  public mockStashList: GitStashList = {
    all: [],
    total: 0,
    latest: null
  };

  public mockRemotes: GitRemote[] = [
    {
      name: 'origin',
      refs: {
        fetch: 'https://github.com/user/repo.git',
        push: 'https://github.com/user/repo.git'
      }
    }
  ];

  // Track method calls for verification
  public calls: Record<string, any[]> = {};

  // Control whether methods should throw errors
  public shouldThrow: Record<string, boolean> = {};

  private recordCall(method: string, args: any): void {
    if (!this.calls[method]) {
      this.calls[method] = [];
    }
    this.calls[method].push(args);
  }

  private checkThrow(method: string): void {
    if (this.shouldThrow[method]) {
      throw new Error(`Mock error for ${method}`);
    }
  }

  async checkIsRepo(): Promise<boolean> {
    this.recordCall('checkIsRepo', {});
    this.checkThrow('checkIsRepo');
    return true;
  }

  async status(): Promise<GitStatus> {
    this.recordCall('status', {});
    this.checkThrow('status');
    return this.mockStatus;
  }

  async init(): Promise<void> {
    this.recordCall('init', {});
    this.checkThrow('init');
  }

  async clone(url: string, targetPath: string): Promise<void> {
    this.recordCall('clone', { url, targetPath });
    this.checkThrow('clone');
  }

  async branch(): Promise<GitBranchSummary>;
  async branch(args: string[]): Promise<void>;
  async branch(args?: string[]): Promise<GitBranchSummary | void> {
    this.recordCall('branch', { args });
    this.checkThrow('branch');
    if (args === undefined) {
      return this.mockBranches;
    }
  }

  async checkout(ref: string): Promise<void> {
    this.recordCall('checkout', { ref });
    this.checkThrow('checkout');
  }

  async checkoutBranch(branchName: string, startPoint: string): Promise<void> {
    this.recordCall('checkoutBranch', { branchName, startPoint });
    this.checkThrow('checkoutBranch');
  }

  async merge(args: string[]): Promise<GitMergeResult> {
    this.recordCall('merge', { args });
    this.checkThrow('merge');
    return this.mockMergeResult;
  }

  async diff(args: string[]): Promise<string> {
    this.recordCall('diff', { args });
    this.checkThrow('diff');
    return this.mockDiffOutput;
  }

  async diffSummary(args: string[]): Promise<GitDiffSummary> {
    this.recordCall('diffSummary', { args });
    this.checkThrow('diffSummary');
    return this.mockDiffSummary;
  }

  async add(files: string[]): Promise<void> {
    this.recordCall('add', { files });
    this.checkThrow('add');
  }

  async reset(args: string[]): Promise<void> {
    this.recordCall('reset', { args });
    this.checkThrow('reset');
  }

  async raw(args: string[]): Promise<string> {
    this.recordCall('raw', { args });
    this.checkThrow('raw');
    return '';
  }

  async commit(
    message: string,
    files?: string[],
    options?: GitCommitOptions
  ): Promise<GitCommitResult> {
    this.recordCall('commit', { message, files, options });
    this.checkThrow('commit');
    return this.mockCommitResult;
  }

  async log(options?: GitLogOptions): Promise<GitLogResult> {
    this.recordCall('log', { options });
    this.checkThrow('log');
    return {
      all: this.mockCommits,
      total: this.mockCommits.length,
      latest: this.mockCommits[0] || null
    };
  }

  async show(args: string[]): Promise<string> {
    this.recordCall('show', { args });
    this.checkThrow('show');
    return 'commit abc123\nAuthor: Test User\nDate: 2024-01-01\n\nInitial commit';
  }

  async rebase(args: string[]): Promise<void> {
    this.recordCall('rebase', { args });
    this.checkThrow('rebase');
  }

  async stash(args: string[]): Promise<void> {
    this.recordCall('stash', { args });
    this.checkThrow('stash');
  }

  async stashList(): Promise<GitStashList> {
    this.recordCall('stashList', {});
    this.checkThrow('stashList');
    return this.mockStashList;
  }

  async getRemotes(verbose: boolean): Promise<GitRemote[]> {
    this.recordCall('getRemotes', { verbose });
    this.checkThrow('getRemotes');
    return this.mockRemotes;
  }

  async addRemote(name: string, url: string): Promise<void> {
    this.recordCall('addRemote', { name, url });
    this.checkThrow('addRemote');
  }

  async fetch(): Promise<void>;
  async fetch(remote: string): Promise<void>;
  async fetch(remote: string, branch: string): Promise<void>;
  async fetch(remote?: string, branch?: string): Promise<void> {
    this.recordCall('fetch', { remote, branch });
    this.checkThrow('fetch');
  }

  async pull(remote?: string, branch?: string, options?: GitPullOptions): Promise<void> {
    this.recordCall('pull', { remote, branch, options });
    this.checkThrow('pull');
  }

  async push(remote?: string, branch?: string, options?: string[]): Promise<void> {
    this.recordCall('push', { remote, branch, options });
    this.checkThrow('push');
  }

  // Helper methods for test configuration
  resetMock(): void {
    this.calls = {};
    this.shouldThrow = {};
  }

  setError(method: string, shouldThrow: boolean = true): void {
    this.shouldThrow[method] = shouldThrow;
  }

  getCalls(method: string): any[] {
    return this.calls[method] || [];
  }
}

/**
 * Create a mock GitProviderFactory for testing
 */
export const createMockGitProviderFactory = (provider: MockGitProvider): GitProviderFactory => {
  return async ({ repoPath, required = true }) => {
    if (required) {
      const isRepo = await provider.checkIsRepo();
      if (!isRepo) {
        throw new Error(`Not a git repository: ${repoPath || process.cwd()}`);
      }
    }
    return provider;
  };
};
