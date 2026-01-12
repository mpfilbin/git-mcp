/**
 * Tests for Commit Operations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { configureCommitOperations } from '../git-tools';
import { MockGitProvider, createMockGitProviderFactory } from './utils/mock-git-provider';

describe('Commit Operations', () => {
  let mockProvider: MockGitProvider;
  let getGit: ReturnType<typeof createMockGitProviderFactory>;
  let operations: ReturnType<typeof configureCommitOperations>;

  beforeEach(() => {
    mockProvider = new MockGitProvider();
    getGit = createMockGitProviderFactory(mockProvider);
    operations = configureCommitOperations(getGit);
  });

  describe('gitCommit', () => {
    it('should commit with message only', async () => {
      const message = 'Test commit message';
      const result = await operations.gitCommit({ message });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Committed changes');
      expect(result.data.commit).toBe('def456');
      expect(result.data.summary).toBeDefined();

      const calls = mockProvider.getCalls('commit');
      expect(calls).toHaveLength(1);
      expect(calls[0].message).toBe(message);
    });

    it('should commit with specific files', async () => {
      const message = 'Commit specific files';
      const files = ['file1.ts', 'file2.ts'];

      const result = await operations.gitCommit({ message, files });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Committed changes');

      const addCalls = mockProvider.getCalls('add');
      expect(addCalls).toHaveLength(1);
      expect(addCalls[0].files).toEqual(files);

      const commitCalls = mockProvider.getCalls('commit');
      expect(commitCalls).toHaveLength(1);
      expect(commitCalls[0].message).toBe(message);
    });

    it('should support amend flag', async () => {
      const message = 'Amended commit';
      const result = await operations.gitCommit({ message, amend: true });

      expect(result.success).toBe(true);

      const calls = mockProvider.getCalls('commit');
      expect(calls).toHaveLength(1);
      expect(calls[0].options).toEqual({ '--amend': null });
    });

    it('should commit files with amend', async () => {
      const message = 'Amended with files';
      const files = ['file1.ts'];

      const result = await operations.gitCommit({ message, files, amend: true });

      expect(result.success).toBe(true);

      const addCalls = mockProvider.getCalls('add');
      expect(addCalls).toHaveLength(1);

      const commitCalls = mockProvider.getCalls('commit');
      expect(commitCalls[0].options).toEqual({ '--amend': null });
    });

    it('should handle errors', async () => {
      mockProvider.setError('commit', true);

      const result = await operations.gitCommit({ message: 'Test' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to commit');
    });
  });

  describe('gitLog', () => {
    it('should retrieve commit log', async () => {
      const result = await operations.gitLog({});

      expect(result.success).toBe(true);
      expect(result.message).toContain('Retrieved 1 commit(s)');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].hash).toBe('abc123');
      expect(result.data[0].message).toBe('Initial commit');
      expect(result.data[0].author_name).toBe('Test User');
    });

    it('should limit commit count', async () => {
      const result = await operations.gitLog({ maxCount: 5 });

      expect(result.success).toBe(true);

      const calls = mockProvider.getCalls('log');
      expect(calls).toHaveLength(1);
      expect(calls[0].options.maxCount).toBe(5);
    });

    it('should filter by file', async () => {
      const file = 'src/index.ts';
      const result = await operations.gitLog({ file });

      expect(result.success).toBe(true);

      const calls = mockProvider.getCalls('log');
      expect(calls[0].options.file).toBe(file);
    });

    it('should combine maxCount and file filter', async () => {
      const result = await operations.gitLog({ maxCount: 10, file: 'README.md' });

      expect(result.success).toBe(true);

      const calls = mockProvider.getCalls('log');
      expect(calls[0].options.maxCount).toBe(10);
      expect(calls[0].options.file).toBe('README.md');
    });

    it('should handle multiple commits', async () => {
      mockProvider.mockCommits = [
        {
          hash: 'abc123',
          date: '2024-01-01',
          message: 'First commit',
          author_name: 'User 1',
          author_email: 'user1@example.com',
          body: '',
          refs: ''
        },
        {
          hash: 'def456',
          date: '2024-01-02',
          message: 'Second commit',
          author_name: 'User 2',
          author_email: 'user2@example.com',
          body: '',
          refs: ''
        }
      ];

      const result = await operations.gitLog({});

      expect(result.success).toBe(true);
      expect(result.message).toContain('Retrieved 2 commit(s)');
      expect(result.data).toHaveLength(2);
    });

    it('should omit body and refs from commit data', async () => {
      const result = await operations.gitLog({});

      expect(result.success).toBe(true);
      expect(result.data[0].body).toBeUndefined();
      expect(result.data[0].refs).toBeUndefined();
    });

    it('should handle errors', async () => {
      mockProvider.setError('log', true);

      const result = await operations.gitLog({});

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to get log');
    });
  });

  describe('gitShow', () => {
    it('should show HEAD by default', async () => {
      const result = await operations.gitShow({});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Details for HEAD');
      expect(result.data).toBeDefined();

      const calls = mockProvider.getCalls('show');
      expect(calls).toHaveLength(1);
      expect(calls[0].args).toEqual(['HEAD']);
    });

    it('should show specific ref', async () => {
      const ref = 'abc123';
      const result = await operations.gitShow({ ref });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Details for ${ref}`);

      const calls = mockProvider.getCalls('show');
      expect(calls[0].args).toEqual([ref]);
    });

    it('should show branch', async () => {
      const ref = 'feature-branch';
      const result = await operations.gitShow({ ref });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Details for ${ref}`);
    });

    it('should handle errors', async () => {
      mockProvider.setError('show', true);

      const result = await operations.gitShow({ ref: 'abc123' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to show commit');
    });
  });
});
