/**
 * Advanced Operations
 */

import type {
  GitOperationResponse,
  GitProviderFactoryImplementing
} from '../providers/git-provider';

export const configureAdvancedOperations = (
  getGit: GitProviderFactoryImplementing<'rebase' | 'stash' | 'stashList' | 'raw'>
) => ({
  gitRebase: async (args: {
    branch: string;
    interactive?: boolean;
    repoPath?: string;
  }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });

      const options = args.interactive ? ['-i', args.branch] : [args.branch];
      await git.rebase(options);

      return {
        success: true,
        message: `Rebased onto '${args.branch}'`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to rebase: ${error.message}`
      };
    }
  },
  gitStash: async (args: {
    message?: string;
    includeUntracked?: boolean;
    repoPath?: string;
  }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });

      const options = ['push'];
      if (args.includeUntracked) {
        options.push('-u');
      }
      if (args.message) {
        options.push('-m', args.message);
      }

      await git.stash(options);

      return {
        success: true,
        message: args.message ? `Stashed changes: ${args.message}` : 'Stashed changes'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to stash: ${error.message}`
      };
    }
  },

  gitStashPop: async (args: {
    index?: number;
    repoPath?: string;
  }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });

      const options = ['pop'];
      if (args.index !== undefined) {
        options.push(`stash@{${args.index}}`);
      }

      await git.stash(options);

      return {
        success: true,
        message:
          args.index !== undefined ? `Applied stash@{${args.index}}` : 'Applied most recent stash'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to pop stash: ${error.message}`
      };
    }
  },
  gitStashList: async (args: { repoPath?: string }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });
      const stashList = await git.stashList();

      return {
        success: true,
        message: `Found ${stashList.total} stash(es)`,
        data: stashList.all
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to list stashes: ${error.message}`
      };
    }
  },
  gitCherryPick: async (args: {
    commit: string;
    repoPath?: string;
  }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });
      await git.raw(['cherry-pick', args.commit]);

      return {
        success: true,
        message: `Cherry-picked commit ${args.commit}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to cherry-pick: ${error.message}`
      };
    }
  }
});
