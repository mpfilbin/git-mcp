/**
 * Branch Operations
 */

import {GitOperationResponse, GitProviderFactory, GitBranchInfo, GitBranchSummary} from '../providers/git-provider';

export const configureBranchOperations = (getGit: GitProviderFactory) => ({
  gitBranchList: async (args: { repoPath?: string }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });
      const branches: GitBranchSummary = await git.branch();

      const data: Omit<GitBranchInfo, "label">[] = branches.all.map(name => ({
        name,
        current: name === branches.current,
        commit: branches.branches[name]?.commit || ''
      }));

      return {
        success: true,
        message: `Found ${data.length} branches`,
        data
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to list branches: ${error.message}`
      };
    }
  },

  gitBranchCreate: async (args: { branchName: string; repoPath?: string }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });
      await git.branch([args.branchName]);

      return {
        success: true,
        message: `Created branch '${args.branchName}'`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create branch: ${error.message}`
      };
    }
  },

  gitBranchDelete: async (args: { branchName: string; force?: boolean; repoPath?: string }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });
      const deleteFlag = args.force ? '-D' : '-d';
      await git.branch([deleteFlag, args.branchName]);

      return {
        success: true,
        message: `Deleted branch '${args.branchName}'`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to delete branch: ${error.message}`
      };
    }
  },

  gitCheckout: async (args: { ref: string; createBranch?: boolean; repoPath?: string }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });

      if (args.createBranch) {
        await git.checkoutBranch(args.ref, 'HEAD');
      } else {
        await git.checkout(args.ref);
      }

      return {
        success: true,
        message: args.createBranch
          ? `Created and switched to branch '${args.ref}'`
          : `Switched to '${args.ref}'`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to checkout: ${error.message}`
      };
    }
  },

  gitMerge: async (args: { branch: string; noFastForward?: boolean; repoPath?: string }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });
      const options = args.noFastForward ? ['--no-ff'] : [];

      const result = await git.merge([...options, args.branch]);

      return {
        success: true,
        message: `Merged branch '${args.branch}'`,
        data: result
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to merge: ${error.message}`
      };
    }
  }
});
