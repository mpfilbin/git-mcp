/**
 * Tests for Advanced Operations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { configureAdvancedOperations } from '../git-tools';
import { MockGitProvider, createMockGitProviderFactory } from './utils/mock-git-provider';

describe('Advanced Operations', () => {
  let mockProvider: MockGitProvider;
  let getGit: ReturnType<typeof createMockGitProviderFactory>;
  let operations: ReturnType<typeof configureAdvancedOperations>;

  beforeEach(() => {
    mockProvider = new MockGitProvider();
    getGit = createMockGitProviderFactory(mockProvider);
    operations = configureAdvancedOperations(getGit);
  });

  describe('gitRebase', () => {
    it('should rebase onto a branch', async () => {
      const branch = 'main';
      const result = await operations.gitRebase({ branch });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Rebased onto '${branch}'`);

      const calls = mockProvider.getCalls('rebase');
      expect(calls).toHaveLength(1);
      expect(calls[0].args).toEqual([branch]);
    });

    it('should rebase interactively', async () => {
      const branch = 'main';
      const result = await operations.gitRebase({ branch, interactive: true });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Rebased onto '${branch}'`);

      const calls = mockProvider.getCalls('rebase');
      expect(calls[0].args).toEqual(['-i', branch]);
    });

    it('should handle errors', async () => {
      mockProvider.setError('rebase', true);

      const result = await operations.gitRebase({ branch: 'main' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to rebase');
    });
  });

  describe('gitStash', () => {
    it('should stash changes without message', async () => {
      const result = await operations.gitStash({});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Stashed changes');

      const calls = mockProvider.getCalls('stash');
      expect(calls).toHaveLength(1);
      expect(calls[0].args).toEqual(['push']);
    });

    it('should stash changes with message', async () => {
      const message = 'WIP: feature implementation';
      const result = await operations.gitStash({ message });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Stashed changes: ${message}`);

      const calls = mockProvider.getCalls('stash');
      expect(calls[0].args).toEqual(['push', '-m', message]);
    });

    it('should stash including untracked files', async () => {
      const result = await operations.gitStash({ includeUntracked: true });

      expect(result.success).toBe(true);

      const calls = mockProvider.getCalls('stash');
      expect(calls[0].args).toEqual(['push', '-u']);
    });

    it('should stash with message and untracked files', async () => {
      const message = 'Saving work';
      const result = await operations.gitStash({ message, includeUntracked: true });

      expect(result.success).toBe(true);
      expect(result.message).toContain(message);

      const calls = mockProvider.getCalls('stash');
      expect(calls[0].args).toEqual(['push', '-u', '-m', message]);
    });

    it('should handle errors', async () => {
      mockProvider.setError('stash', true);

      const result = await operations.gitStash({});

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to stash');
    });
  });

  describe('gitStashPop', () => {
    it('should pop most recent stash', async () => {
      const result = await operations.gitStashPop({});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Applied most recent stash');

      const calls = mockProvider.getCalls('stash');
      expect(calls).toHaveLength(1);
      expect(calls[0].args).toEqual(['pop']);
    });

    it('should pop specific stash by index', async () => {
      const index = 2;
      const result = await operations.gitStashPop({ index });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Applied stash@{${index}}`);

      const calls = mockProvider.getCalls('stash');
      expect(calls[0].args).toEqual(['pop', `stash@{${index}}`]);
    });

    it('should pop stash at index 0', async () => {
      const result = await operations.gitStashPop({ index: 0 });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Applied stash@{0}');

      const calls = mockProvider.getCalls('stash');
      expect(calls[0].args).toEqual(['pop', 'stash@{0}']);
    });

    it('should handle errors', async () => {
      mockProvider.setError('stash', true);

      const result = await operations.gitStashPop({});

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to pop stash');
    });
  });

  describe('gitStashList', () => {
    it('should list empty stash', async () => {
      const result = await operations.gitStashList({});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Found 0 stash(es)');
      expect(result.data).toEqual([]);
    });

    it('should list stashes', async () => {
      mockProvider.mockStashList = {
        all: [
          {
            hash: 'abc123',
            date: '2024-01-01',
            message: 'WIP on main',
            index: 0
          },
          {
            hash: 'def456',
            date: '2024-01-02',
            message: 'WIP on feature',
            index: 1
          }
        ],
        total: 2,
        latest: {
          hash: 'abc123',
          date: '2024-01-01',
          message: 'WIP on main',
          index: 0
        }
      };

      const result = await operations.gitStashList({});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Found 2 stash(es)');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].hash).toBe('abc123');
      expect(result.data[0].message).toBe('WIP on main');
      expect(result.data[1].hash).toBe('def456');
    });

    it('should handle errors', async () => {
      mockProvider.setError('stashList', true);

      const result = await operations.gitStashList({});

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to list stashes');
    });
  });

  describe('gitCherryPick', () => {
    it('should cherry-pick a commit', async () => {
      const commit = 'abc123';
      const result = await operations.gitCherryPick({ commit });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Cherry-picked commit ${commit}`);

      const calls = mockProvider.getCalls('raw');
      expect(calls).toHaveLength(1);
      expect(calls[0].args).toEqual(['cherry-pick', commit]);
    });

    it('should cherry-pick with full hash', async () => {
      const commit = 'abc123def456789012345678901234567890abcd';
      const result = await operations.gitCherryPick({ commit });

      expect(result.success).toBe(true);
      expect(result.message).toContain(commit);

      const calls = mockProvider.getCalls('raw');
      expect(calls[0].args).toEqual(['cherry-pick', commit]);
    });

    it('should handle errors', async () => {
      mockProvider.setError('raw', true);

      const result = await operations.gitCherryPick({ commit: 'abc123' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to cherry-pick');
    });
  });
});
