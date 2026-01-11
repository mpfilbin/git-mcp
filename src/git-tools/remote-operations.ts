/**
 * Remote Operations
 */

import {
  GitOperationResponse,
  GitProviderFactoryImplementing,
  GitRemote
} from '../providers/git-provider';

export const configureRemoteOperations = (
  getGit: GitProviderFactoryImplementing<'getRemotes' | 'addRemote' | 'fetch' | 'pull' | 'push'>
) => ({
  gitRemoteList: async (args: { repoPath?: string }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });
      const remotes = await git.getRemotes(true);

      const data: GitRemote[] = remotes.map(remote => ({
        name: remote.name,
        refs: {
          fetch: remote.refs.fetch || '',
          push: remote.refs.push || ''
        }
      }));

      return {
        success: true,
        message: `Found ${data.length} remote(s)`,
        data
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to list remotes: ${error.message}`
      };
    }
  },

  gitRemoteAdd: async (args: {
    name: string;
    url: string;
    repoPath?: string;
  }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });
      await git.addRemote(args.name, args.url);

      return {
        success: true,
        message: `Added remote '${args.name}' (${args.url})`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to add remote: ${error.message}`
      };
    }
  },

  gitFetch: async (args: {
    remote?: string;
    branch?: string;
    repoPath?: string;
  }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });

      if (args.remote && args.branch) {
        await git.fetch(args.remote, args.branch);
      } else if (args.remote) {
        await git.fetch(args.remote);
      } else {
        await git.fetch();
      }

      return {
        success: true,
        message: args.remote
          ? `Fetched from '${args.remote}'${args.branch ? ` (${args.branch})` : ''}`
          : 'Fetched from all remotes'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to fetch: ${error.message}`
      };
    }
  },

  gitPull: async (args: {
    remote?: string;
    branch?: string;
    rebase?: boolean;
    repoPath?: string;
  }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });

      const options: any = {};
      if (args.rebase) {
        options['--rebase'] = null;
      }

      await git.pull(args.remote, args.branch, options);

      return {
        success: true,
        message: `Pulled from ${args.remote || 'origin'}${args.branch ? `/${args.branch}` : ''}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to pull: ${error.message}`
      };
    }
  },

  gitPush: async (args: {
    remote?: string;
    branch?: string;
    force?: boolean;
    setUpstream?: boolean;
    repoPath?: string;
  }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });

      const options: string[] = [];
      if (args.force) {
        options.push('--force');
      }
      if (args.setUpstream) {
        options.push('--set-upstream');
      }

      await git.push(args.remote, args.branch, options);

      return {
        success: true,
        message: `Pushed to ${args.remote || 'origin'}${args.branch ? `/${args.branch}` : ''}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to push: ${error.message}`
      };
    }
  }
});
