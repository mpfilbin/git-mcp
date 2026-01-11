/**
 * Tests for File Operations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { configureFileOperations } from '../git-tools';
import { MockGitProvider, createMockGitProviderFactory } from './utils/mock-git-provider';

describe('File Operations', () => {
  let mockProvider: MockGitProvider;
  let getGit: ReturnType<typeof createMockGitProviderFactory>;
  let operations: ReturnType<typeof configureFileOperations>;

  beforeEach(() => {
    mockProvider = new MockGitProvider();
    getGit = createMockGitProviderFactory(mockProvider);
    operations = configureFileOperations(getGit);
  });

  describe('gitDiff', () => {
    it('should get diff for all files', async () => {
      const result = await operations.gitDiff({});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Diff for all file(s)');
      expect(result.data.diff).toBeDefined();
      expect(result.data.summary).toBeDefined();
      expect(result.data.summary.changed).toBe(1);
    });

    it('should get diff for specific files', async () => {
      const files = ['file1.ts', 'file2.ts'];
      const result = await operations.gitDiff({ files });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Diff for 2 file(s)');

      const diffCalls = mockProvider.getCalls('diff');
      expect(diffCalls[0].args).toContain('--');
      expect(diffCalls[0].args).toContain('file1.ts');
      expect(diffCalls[0].args).toContain('file2.ts');
    });

    it('should get cached diff', async () => {
      const result = await operations.gitDiff({ cached: true });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Diff for staged changes');

      const calls = mockProvider.getCalls('diff');
      expect(calls[0].args).toContain('--cached');
    });

    it('should get diff from a commit', async () => {
      const fromCommit = 'abc123';
      const result = await operations.gitDiff({ fromCommit });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Diff from ${fromCommit} to working tree`);

      const calls = mockProvider.getCalls('diff');
      expect(calls[0].args).toContain(fromCommit);
    });

    it('should get diff to a commit', async () => {
      const toCommit = 'def456';
      const result = await operations.gitDiff({ toCommit });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Diff to ${toCommit}`);

      const calls = mockProvider.getCalls('diff');
      expect(calls[0].args).toContain(toCommit);
    });

    it('should get diff between two commits with two-dot range', async () => {
      const fromCommit = 'abc123';
      const toCommit = 'def456';
      const result = await operations.gitDiff({ fromCommit, toCommit });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Diff for ${fromCommit}..${toCommit}`);

      const calls = mockProvider.getCalls('diff');
      expect(calls[0].args).toContain(`${fromCommit}..${toCommit}`);
    });

    it('should get diff between two commits with three-dot range', async () => {
      const fromCommit = 'abc123';
      const toCommit = 'def456';
      const result = await operations.gitDiff({ fromCommit, toCommit, useThreeDotRange: true });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Diff for ${fromCommit}...${toCommit}`);

      const calls = mockProvider.getCalls('diff');
      expect(calls[0].args).toContain(`${fromCommit}...${toCommit}`);
    });

    it('should combine commit range with specific files', async () => {
      const fromCommit = 'abc123';
      const toCommit = 'def456';
      const files = ['src/index.ts'];

      const result = await operations.gitDiff({ fromCommit, toCommit, files });

      expect(result.success).toBe(true);

      const calls = mockProvider.getCalls('diff');
      expect(calls[0].args).toContain(`${fromCommit}..${toCommit}`);
      expect(calls[0].args).toContain('--');
      expect(calls[0].args).toContain('src/index.ts');
    });

    it('should return diff summary with file details', async () => {
      mockProvider.mockDiffSummary = {
        files: [
          {
            file: 'file1.ts',
            changes: 10,
            insertions: 8,
            deletions: 2,
            binary: false
          },
          {
            file: 'file2.ts',
            changes: 5,
            insertions: 3,
            deletions: 2,
            binary: false
          }
        ],
        insertions: 11,
        deletions: 4,
        changed: 2
      };

      const result = await operations.gitDiff({});

      expect(result.success).toBe(true);
      expect(result.data.summary.files).toHaveLength(2);
      expect(result.data.summary.insertions).toBe(11);
      expect(result.data.summary.deletions).toBe(4);
      expect(result.data.summary.changed).toBe(2);
    });

    it('should handle binary files', async () => {
      mockProvider.mockDiffSummary = {
        files: [
          {
            file: 'image.png',
            binary: true,
            changes: 0,
            insertions: 0,
            deletions: 0
          }
        ],
        insertions: 0,
        deletions: 0,
        changed: 1
      };

      const result = await operations.gitDiff({});

      expect(result.success).toBe(true);
      expect(result.data.summary.files[0].binary).toBe(true);
    });

    it('should handle errors', async () => {
      mockProvider.setError('diff', true);

      const result = await operations.gitDiff({});

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to get diff');
    });
  });

  describe('gitAdd', () => {
    it('should add files to staging', async () => {
      const files = ['file1.ts', 'file2.ts'];
      const result = await operations.gitAdd({ files });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Staged 2 file(s): file1.ts, file2.ts');

      const calls = mockProvider.getCalls('add');
      expect(calls).toHaveLength(1);
      expect(calls[0].files).toEqual(files);
    });

    it('should add a single file', async () => {
      const files = ['single.ts'];
      const result = await operations.gitAdd({ files });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Staged 1 file(s)');
    });

    it('should handle all files pattern', async () => {
      const files = ['.'];
      const result = await operations.gitAdd({ files });

      expect(result.success).toBe(true);

      const calls = mockProvider.getCalls('add');
      expect(calls[0].files).toEqual(['.']);
    });

    it('should handle errors', async () => {
      mockProvider.setError('add', true);

      const result = await operations.gitAdd({ files: ['file.ts'] });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to stage files');
    });
  });

  describe('gitReset', () => {
    it('should unstage specific files', async () => {
      const files = ['file1.ts', 'file2.ts'];
      const result = await operations.gitReset({ files });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Unstaged 2 file(s): file1.ts, file2.ts');

      const calls = mockProvider.getCalls('reset');
      expect(calls).toHaveLength(1);
      expect(calls[0].args).toEqual(['HEAD', ...files]);
    });

    it('should unstage files from specific commit', async () => {
      const files = ['file.ts'];
      const commit = 'abc123';
      const result = await operations.gitReset({ files, commit });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Unstaged 1 file(s)');

      const calls = mockProvider.getCalls('reset');
      expect(calls[0].args[0]).toBe(commit);
    });

    it('should reset to commit with mixed mode (default)', async () => {
      const commit = 'abc123';
      const result = await operations.gitReset({ commit });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Reset to ${commit} (mixed mode)`);

      const calls = mockProvider.getCalls('reset');
      expect(calls[0].args).toEqual(['--mixed', commit]);
    });

    it('should reset with soft mode', async () => {
      const commit = 'abc123';
      const result = await operations.gitReset({ commit, mode: 'soft' });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Reset to ${commit} (soft mode)`);

      const calls = mockProvider.getCalls('reset');
      expect(calls[0].args).toEqual(['--soft', commit]);
    });

    it('should reset with hard mode', async () => {
      const commit = 'abc123';
      const result = await operations.gitReset({ commit, mode: 'hard' });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Reset to ${commit} (hard mode)`);

      const calls = mockProvider.getCalls('reset');
      expect(calls[0].args).toEqual(['--hard', commit]);
    });

    it('should reset to HEAD by default', async () => {
      const result = await operations.gitReset({});

      expect(result.success).toBe(true);
      expect(result.message).toContain('Reset to HEAD');

      const calls = mockProvider.getCalls('reset');
      expect(calls[0].args).toContain('HEAD');
    });

    it('should handle errors', async () => {
      mockProvider.setError('reset', true);

      const result = await operations.gitReset({ files: ['file.ts'] });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to reset');
    });
  });

  describe('gitRestore', () => {
    it('should restore files from HEAD', async () => {
      const files = ['file1.ts', 'file2.ts'];
      const result = await operations.gitRestore({ files });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Restored 2 file(s) from HEAD');

      const calls = mockProvider.getCalls('raw');
      expect(calls).toHaveLength(1);
      expect(calls[0].args).toEqual(['restore', ...files]);
    });

    it('should restore files from staging', async () => {
      const files = ['file.ts'];
      const result = await operations.gitRestore({ files, staged: true });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Restored 1 file(s) from staging');

      const calls = mockProvider.getCalls('raw');
      expect(calls[0].args).toEqual(['restore', '--staged', ...files]);
    });

    it('should handle single file', async () => {
      const files = ['single.ts'];
      const result = await operations.gitRestore({ files });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Restored 1 file(s)');
    });

    it('should handle errors', async () => {
      mockProvider.setError('raw', true);

      const result = await operations.gitRestore({ files: ['file.ts'] });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to restore files');
    });
  });
});
