/**
 * Commit Operations
 */

import {GitProviderFactory, GitOperationResponse, GitLogResult, GitCommit} from '../providers/git-provider';

export const configureCommitOperations = (getGit: GitProviderFactory) => ({
  gitCommit: async (args: { message: string; files?: string[]; amend?: boolean; repoPath?: string }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });

      const options: any = {};
      if (args.amend) {
        options['--amend'] = null;
      }

      let result;
      if (args.files && args.files.length > 0) {
        // Add files first, then commit
        await git.add(args.files);
        result = await git.commit(args.message, undefined, options);
      } else {
        result = await git.commit(args.message, undefined, options);
      }

      return {
        success: true,
        message: `Committed changes: ${result.commit}`,
        data: {
          commit: result.commit,
          summary: result.summary
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to commit: ${error.message}`
      };
    }
  },

  gitLog: async (args: { maxCount?: number; file?: string; repoPath?: string }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });

      const options: any = {};
      if (args.maxCount) {
        options.maxCount = args.maxCount;
      }
      if (args.file) {
        options.file = args.file;
      }

      const log: GitLogResult = await git.log(options);

      const commits: Omit<GitCommit, "body" | "refs">[] = log.all.map(commit => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author_name: commit.author_name,
        author_email: commit.author_email
      }));

      return {
        success: true,
        message: `Retrieved ${commits.length} commit(s)`,
        data: commits
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to get log: ${error.message}`
      };
    }
  },

  gitShow: async (args: { ref?: string; repoPath?: string }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });
      const ref = args.ref || 'HEAD';

      const show = await git.show([ref]);

      return {
        success: true,
        message: `Details for ${ref}`,
        data: show
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to show commit: ${error.message}`
      };
    }
  }
});
