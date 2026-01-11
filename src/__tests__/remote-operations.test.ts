/**
 * Tests for Remote Operations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { configureRemoteOperations } from '../git-tools';
import { MockGitProvider, createMockGitProviderFactory } from './utils/mock-git-provider';

describe('Remote Operations', () => {
  let mockProvider: MockGitProvider;
  let getGit: ReturnType<typeof createMockGitProviderFactory>;
  let operations: ReturnType<typeof configureRemoteOperations>;

  beforeEach(() => {
    mockProvider = new MockGitProvider();
    getGit = createMockGitProviderFactory(mockProvider);
    operations = configureRemoteOperations(getGit);
  });

  describe('gitRemoteList', () => {
    it('should list remotes', async () => {
      const result = await operations.gitRemoteList({});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Found 1 remote(s)');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('origin');
      expect(result.data[0].refs.fetch).toBe('https://github.com/user/repo.git');
      expect(result.data[0].refs.push).toBe('https://github.com/user/repo.git');

      const calls = mockProvider.getCalls('getRemotes');
      expect(calls).toHaveLength(1);
      expect(calls[0].verbose).toBe(true);
    });

    it('should list multiple remotes', async () => {
      mockProvider.mockRemotes = [
        {
          name: 'origin',
          refs: {
            fetch: 'https://github.com/user/repo.git',
            push: 'https://github.com/user/repo.git'
          }
        },
        {
          name: 'upstream',
          refs: {
            fetch: 'https://github.com/org/repo.git',
            push: 'https://github.com/org/repo.git'
          }
        }
      ];

      const result = await operations.gitRemoteList({});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Found 2 remote(s)');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('origin');
      expect(result.data[1].name).toBe('upstream');
    });

    it('should handle empty remotes', async () => {
      mockProvider.mockRemotes = [];

      const result = await operations.gitRemoteList({});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Found 0 remote(s)');
      expect(result.data).toEqual([]);
    });

    it('should handle different fetch and push URLs', async () => {
      mockProvider.mockRemotes = [
        {
          name: 'origin',
          refs: {
            fetch: 'https://github.com/user/repo.git',
            push: 'git@github.com:user/repo.git'
          }
        }
      ];

      const result = await operations.gitRemoteList({});

      expect(result.success).toBe(true);
      expect(result.data[0].refs.fetch).toBe('https://github.com/user/repo.git');
      expect(result.data[0].refs.push).toBe('git@github.com:user/repo.git');
    });

    it('should handle errors', async () => {
      mockProvider.setError('getRemotes', true);

      const result = await operations.gitRemoteList({});

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to list remotes');
    });
  });

  describe('gitRemoteAdd', () => {
    it('should add a remote', async () => {
      const name = 'upstream';
      const url = 'https://github.com/org/repo.git';

      const result = await operations.gitRemoteAdd({ name, url });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Added remote '${name}' (${url})`);

      const calls = mockProvider.getCalls('addRemote');
      expect(calls).toHaveLength(1);
      expect(calls[0].name).toBe(name);
      expect(calls[0].url).toBe(url);
    });

    it('should add remote with SSH URL', async () => {
      const name = 'origin';
      const url = 'git@github.com:user/repo.git';

      const result = await operations.gitRemoteAdd({ name, url });

      expect(result.success).toBe(true);
      expect(result.message).toContain(name);
      expect(result.message).toContain(url);
    });

    it('should handle errors', async () => {
      mockProvider.setError('addRemote', true);

      const result = await operations.gitRemoteAdd({
        name: 'upstream',
        url: 'https://github.com/org/repo.git'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to add remote');
    });
  });

  describe('gitFetch', () => {
    it('should fetch from all remotes', async () => {
      const result = await operations.gitFetch({});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Fetched from all remotes');

      const calls = mockProvider.getCalls('fetch');
      expect(calls).toHaveLength(1);
      expect(calls[0].remote).toBeUndefined();
      expect(calls[0].branch).toBeUndefined();
    });

    it('should fetch from specific remote', async () => {
      const remote = 'origin';
      const result = await operations.gitFetch({ remote });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Fetched from '${remote}'`);

      const calls = mockProvider.getCalls('fetch');
      expect(calls[0].remote).toBe(remote);
    });

    it('should fetch specific branch from remote', async () => {
      const remote = 'origin';
      const branch = 'main';

      const result = await operations.gitFetch({ remote, branch });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Fetched from '${remote}' (${branch})`);

      const calls = mockProvider.getCalls('fetch');
      expect(calls[0].remote).toBe(remote);
      expect(calls[0].branch).toBe(branch);
    });

    it('should handle errors', async () => {
      mockProvider.setError('fetch', true);

      const result = await operations.gitFetch({});

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to fetch');
    });
  });

  describe('gitPull', () => {
    it('should pull with defaults', async () => {
      const result = await operations.gitPull({});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Pulled from origin');

      const calls = mockProvider.getCalls('pull');
      expect(calls).toHaveLength(1);
    });

    it('should pull from specific remote', async () => {
      const remote = 'upstream';
      const result = await operations.gitPull({ remote });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Pulled from ${remote}`);

      const calls = mockProvider.getCalls('pull');
      expect(calls[0].remote).toBe(remote);
    });

    it('should pull specific branch', async () => {
      const remote = 'origin';
      const branch = 'main';

      const result = await operations.gitPull({ remote, branch });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Pulled from ${remote}/${branch}`);

      const calls = mockProvider.getCalls('pull');
      expect(calls[0].remote).toBe(remote);
      expect(calls[0].branch).toBe(branch);
    });

    it('should pull with rebase', async () => {
      const result = await operations.gitPull({ rebase: true });

      expect(result.success).toBe(true);

      const calls = mockProvider.getCalls('pull');
      expect(calls[0].options).toEqual({ '--rebase': null });
    });

    it('should pull with remote, branch, and rebase', async () => {
      const remote = 'origin';
      const branch = 'develop';

      const result = await operations.gitPull({ remote, branch, rebase: true });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Pulled from ${remote}/${branch}`);

      const calls = mockProvider.getCalls('pull');
      expect(calls[0].remote).toBe(remote);
      expect(calls[0].branch).toBe(branch);
      expect(calls[0].options).toEqual({ '--rebase': null });
    });

    it('should handle errors', async () => {
      mockProvider.setError('pull', true);

      const result = await operations.gitPull({});

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to pull');
    });
  });

  describe('gitPush', () => {
    it('should push with defaults', async () => {
      const result = await operations.gitPush({});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Pushed to origin');

      const calls = mockProvider.getCalls('push');
      expect(calls).toHaveLength(1);
    });

    it('should push to specific remote', async () => {
      const remote = 'upstream';
      const result = await operations.gitPush({ remote });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Pushed to ${remote}`);

      const calls = mockProvider.getCalls('push');
      expect(calls[0].remote).toBe(remote);
    });

    it('should push specific branch', async () => {
      const remote = 'origin';
      const branch = 'main';

      const result = await operations.gitPush({ remote, branch });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Pushed to ${remote}/${branch}`);

      const calls = mockProvider.getCalls('push');
      expect(calls[0].remote).toBe(remote);
      expect(calls[0].branch).toBe(branch);
    });

    it('should push with force', async () => {
      const result = await operations.gitPush({ force: true });

      expect(result.success).toBe(true);

      const calls = mockProvider.getCalls('push');
      expect(calls[0].options).toContain('--force');
    });

    it('should push with set-upstream', async () => {
      const result = await operations.gitPush({ setUpstream: true });

      expect(result.success).toBe(true);

      const calls = mockProvider.getCalls('push');
      expect(calls[0].options).toContain('--set-upstream');
    });

    it('should push with force and set-upstream', async () => {
      const result = await operations.gitPush({ force: true, setUpstream: true });

      expect(result.success).toBe(true);

      const calls = mockProvider.getCalls('push');
      expect(calls[0].options).toContain('--force');
      expect(calls[0].options).toContain('--set-upstream');
    });

    it('should push with all options', async () => {
      const remote = 'origin';
      const branch = 'feature-branch';

      const result = await operations.gitPush({
        remote,
        branch,
        force: true,
        setUpstream: true
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(`Pushed to ${remote}/${branch}`);

      const calls = mockProvider.getCalls('push');
      expect(calls[0].remote).toBe(remote);
      expect(calls[0].branch).toBe(branch);
      expect(calls[0].options).toContain('--force');
      expect(calls[0].options).toContain('--set-upstream');
    });

    it('should handle errors', async () => {
      mockProvider.setError('push', true);

      const result = await operations.gitPush({});

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to push');
    });
  });
});
