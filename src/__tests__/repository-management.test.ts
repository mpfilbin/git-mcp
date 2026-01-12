/**
 * Tests for Repository Management Operations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { configureRepositoryManagement } from '../git-tools';
import { MockGitProvider, createMockGitProviderFactory } from './utils/mock-git-provider';

describe('Repository Management Operations', () => {
  let mockProvider: MockGitProvider;
  let getGit: ReturnType<typeof createMockGitProviderFactory>;
  let operations: ReturnType<typeof configureRepositoryManagement>;

  beforeEach(() => {
    mockProvider = new MockGitProvider();
    getGit = createMockGitProviderFactory(mockProvider);
    operations = configureRepositoryManagement(getGit);
  });

  describe('gitStatus', () => {
    it('should return clean working tree status', async () => {
      const result = await operations.gitStatus({ repoPath: '/test/repo' });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Working tree clean');
      expect(result.data).toBeDefined();
      expect(result.data.isClean).toBe(true);
      expect(result.data.current).toBe('main');
      expect(result.data.tracking).toBe('origin/main');
    });

    it('should return status with modified files', async () => {
      mockProvider.mockStatus = {
        modified: ['file1.ts', 'file2.ts'],
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
        isClean: () => false
      };

      const result = await operations.gitStatus({ repoPath: '/test/repo' });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Working tree has changes');
      expect(result.data.modified).toEqual(['file1.ts', 'file2.ts']);
      expect(result.data.isClean).toBe(false);
    });

    it('should return status with staged files', async () => {
      mockProvider.mockStatus = {
        modified: [],
        created: ['new-file.ts'],
        deleted: [],
        renamed: [],
        conflicted: [],
        not_added: [],
        staged: ['new-file.ts'],
        current: 'main',
        tracking: 'origin/main',
        ahead: 0,
        behind: 0,
        isClean: () => false
      };

      const result = await operations.gitStatus({ repoPath: '/test/repo' });

      expect(result.success).toBe(true);
      expect(result.data.added).toEqual(['new-file.ts']);
      expect(result.data.staged).toEqual(['new-file.ts']);
    });

    it('should handle renamed files', async () => {
      mockProvider.mockStatus = {
        modified: [],
        created: [],
        deleted: [],
        renamed: [{ from: 'old.ts', to: 'new.ts' }],
        conflicted: [],
        not_added: [],
        staged: [],
        current: 'main',
        tracking: 'origin/main',
        ahead: 0,
        behind: 0,
        isClean: () => false
      };

      const result = await operations.gitStatus({ repoPath: '/test/repo' });

      expect(result.success).toBe(true);
      expect(result.data.renamed).toEqual(['old.ts -> new.ts']);
    });

    it('should show ahead/behind status', async () => {
      mockProvider.mockStatus = {
        modified: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
        not_added: [],
        staged: [],
        current: 'main',
        tracking: 'origin/main',
        ahead: 2,
        behind: 1,
        isClean: () => true
      };

      const result = await operations.gitStatus({ repoPath: '/test/repo' });

      expect(result.success).toBe(true);
      expect(result.data.ahead).toBe(2);
      expect(result.data.behind).toBe(1);
    });

    it('should handle errors', async () => {
      mockProvider.setError('status', true);

      const result = await operations.gitStatus({ repoPath: '/test/repo' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to get status');
    });
  });

  describe('gitInit', () => {
    it('should initialize a repository', async () => {
      const result = await operations.gitInit({ repoPath: '/test/new-repo' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Initialized empty Git repository');
      expect(result.message).toContain('/test/new-repo');
      expect(mockProvider.getCalls('init')).toHaveLength(1);
    });

    it('should initialize in current directory when no path provided', async () => {
      const result = await operations.gitInit({});

      expect(result.success).toBe(true);
      expect(result.message).toContain('Initialized empty Git repository');
      expect(mockProvider.getCalls('init')).toHaveLength(1);
    });

    it('should handle errors', async () => {
      mockProvider.setError('init', true);

      const result = await operations.gitInit({ repoPath: '/test/new-repo' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to initialize repository');
    });
  });

  describe('gitClone', () => {
    it('should clone a repository', async () => {
      const url = 'https://github.com/user/repo.git';
      const result = await operations.gitClone({ url });

      expect(result.success).toBe(true);
      expect(result.message).toContain(`Cloned repository from ${url}`);
      expect(result.message).toContain('to repo');

      const calls = mockProvider.getCalls('clone');
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(url);
      expect(calls[0].targetPath).toBe('repo');
    });

    it('should clone to specified target path', async () => {
      const url = 'https://github.com/user/repo.git';
      const targetPath = 'custom-dir';

      const result = await operations.gitClone({ url, targetPath });

      expect(result.success).toBe(true);
      expect(result.message).toContain(`to ${targetPath}`);

      const calls = mockProvider.getCalls('clone');
      expect(calls[0].targetPath).toBe(targetPath);
    });

    it('should handle errors', async () => {
      mockProvider.setError('clone', true);

      const result = await operations.gitClone({
        url: 'https://github.com/user/repo.git'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to clone repository');
    });
  });
});
