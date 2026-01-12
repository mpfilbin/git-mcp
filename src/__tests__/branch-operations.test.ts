/**
 * Tests for Branch Operations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { configureBranchOperations } from '../git-tools';
import { MockGitProvider, createMockGitProviderFactory } from './utils/mock-git-provider';

describe('Branch Operations', () => {
  let mockProvider: MockGitProvider;
  let getGit: ReturnType<typeof createMockGitProviderFactory>;
  let operations: ReturnType<typeof configureBranchOperations>;

  beforeEach(() => {
    mockProvider = new MockGitProvider();
    getGit = createMockGitProviderFactory(mockProvider);
    operations = configureBranchOperations(getGit);
  });

  describe('gitBranchList', () => {
    it('should list branches', async () => {
      const result = await operations.gitBranchList({});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Found 1 branches');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('main');
      expect(result.data[0].current).toBe(true);
      expect(result.data[0].commit).toBe('abc123');
    });

    it('should list multiple branches', async () => {
      mockProvider.mockBranches = {
        detached: false,
        current: 'main',
        all: ['main', 'feature-1', 'feature-2'],
        branches: {
          main: {
            name: 'main',
            commit: 'abc123',
            label: 'main',
            current: true
          },
          'feature-1': {
            name: 'feature-1',
            commit: 'def456',
            label: 'feature-1',
            current: false
          },
          'feature-2': {
            name: 'feature-2',
            commit: 'ghi789',
            label: 'feature-2',
            current: false
          }
        }
      };

      const result = await operations.gitBranchList({});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Found 3 branches');
      expect(result.data).toHaveLength(3);
      expect(result.data.find((b: any) => b.name === 'feature-1')).toBeDefined();
      expect(result.data.find((b: any) => b.name === 'feature-2')).toBeDefined();
    });

    it('should mark current branch correctly', async () => {
      mockProvider.mockBranches = {
        detached: false,
        current: 'feature-1',
        all: ['main', 'feature-1'],
        branches: {
          main: {
            name: 'main',
            commit: 'abc123',
            label: 'main',
            current: false
          },
          'feature-1': {
            name: 'feature-1',
            commit: 'def456',
            label: 'feature-1',
            current: true
          }
        }
      };

      const result = await operations.gitBranchList({});

      expect(result.success).toBe(true);
      const feature1 = result.data.find((b: any) => b.name === 'feature-1');
      const main = result.data.find((b: any) => b.name === 'main');
      expect(feature1?.current).toBe(true);
      expect(main?.current).toBe(false);
    });

    it('should handle missing commit info', async () => {
      mockProvider.mockBranches = {
        detached: false,
        current: 'main',
        all: ['main', 'no-commit'],
        branches: {
          main: {
            name: 'main',
            commit: 'abc123',
            label: 'main',
            current: true
          },
          'no-commit': {
            name: 'no-commit',
            commit: '',
            label: 'no-commit',
            current: false
          }
        }
      };

      const result = await operations.gitBranchList({});

      expect(result.success).toBe(true);
      const noCommitBranch = result.data.find((b: any) => b.name === 'no-commit');
      expect(noCommitBranch?.commit).toBe('');
    });

    it('should handle errors', async () => {
      mockProvider.setError('branch', true);

      const result = await operations.gitBranchList({});

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to list branches');
    });
  });

  describe('gitBranchCreate', () => {
    it('should create a branch', async () => {
      const branchName = 'new-feature';
      const result = await operations.gitBranchCreate({ branchName });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Created branch '${branchName}'`);

      const calls = mockProvider.getCalls('branch');
      expect(calls).toHaveLength(1);
      expect(calls[0].args).toEqual([branchName]);
    });

    it('should handle branch names with special characters', async () => {
      const branchName = 'feature/user-auth';
      const result = await operations.gitBranchCreate({ branchName });

      expect(result.success).toBe(true);
      expect(result.message).toContain(branchName);
    });

    it('should handle errors', async () => {
      mockProvider.setError('branch', true);

      const result = await operations.gitBranchCreate({ branchName: 'new-branch' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to create branch');
    });
  });

  describe('gitBranchDelete', () => {
    it('should delete a branch with default flag', async () => {
      const branchName = 'old-feature';
      const result = await operations.gitBranchDelete({ branchName });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Deleted branch '${branchName}'`);

      const calls = mockProvider.getCalls('branch');
      expect(calls).toHaveLength(1);
      expect(calls[0].args).toEqual(['-d', branchName]);
    });

    it('should force delete a branch', async () => {
      const branchName = 'unmerged-feature';
      const result = await operations.gitBranchDelete({ branchName, force: true });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Deleted branch '${branchName}'`);

      const calls = mockProvider.getCalls('branch');
      expect(calls[0].args).toEqual(['-D', branchName]);
    });

    it('should handle errors', async () => {
      mockProvider.setError('branch', true);

      const result = await operations.gitBranchDelete({ branchName: 'branch' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to delete branch');
    });
  });

  describe('gitCheckout', () => {
    it('should checkout existing branch', async () => {
      const ref = 'feature-branch';
      const result = await operations.gitCheckout({ ref });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Switched to '${ref}'`);

      const calls = mockProvider.getCalls('checkout');
      expect(calls).toHaveLength(1);
      expect(calls[0].ref).toBe(ref);
    });

    it('should checkout commit', async () => {
      const ref = 'abc123';
      const result = await operations.gitCheckout({ ref });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Switched to '${ref}'`);
    });

    it('should create and checkout new branch', async () => {
      const ref = 'new-branch';
      const result = await operations.gitCheckout({ ref, createBranch: true });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Created and switched to branch '${ref}'`);

      const calls = mockProvider.getCalls('checkoutBranch');
      expect(calls).toHaveLength(1);
      expect(calls[0].branchName).toBe(ref);
      expect(calls[0].startPoint).toBe('HEAD');
    });

    it('should handle errors', async () => {
      mockProvider.setError('checkout', true);

      const result = await operations.gitCheckout({ ref: 'branch' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to checkout');
    });
  });

  describe('gitMerge', () => {
    it('should merge a branch with default options', async () => {
      const branch = 'feature-branch';
      const result = await operations.gitMerge({ branch });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Merged branch '${branch}'`);
      expect(result.data).toBeDefined();

      const calls = mockProvider.getCalls('merge');
      expect(calls).toHaveLength(1);
      expect(calls[0].args).toEqual([branch]);
    });

    it('should merge with no-fast-forward', async () => {
      const branch = 'feature-branch';
      const result = await operations.gitMerge({ branch, noFastForward: true });

      expect(result.success).toBe(true);

      const calls = mockProvider.getCalls('merge');
      expect(calls[0].args).toEqual(['--no-ff', branch]);
    });

    it('should return merge result data', async () => {
      mockProvider.mockMergeResult = {
        merges: ['feature-branch'],
        conflicts: ['file.txt'],
        result: 'conflict',
        summary: {
          changes: 5,
          insertions: 10,
          deletions: 2
        }
      };

      const result = await operations.gitMerge({ branch: 'feature-branch' });

      expect(result.success).toBe(true);
      expect(result.data.conflicts).toEqual(['file.txt']);
      expect(result.data.summary.changes).toBe(5);
    });

    it('should handle errors', async () => {
      mockProvider.setError('merge', true);

      const result = await operations.gitMerge({ branch: 'feature' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to merge');
    });
  });
});
