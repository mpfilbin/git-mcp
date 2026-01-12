/**
 * Repository Management Tools
 */

import {
  GitOperationResponse,
  GitProviderFactoryImplementing,
  GitStatus
} from '../providers/git-provider';
import * as path from 'path';

export interface StatusData {
  modified: string[];
  added: string[];
  deleted: string[];
  renamed: string[];
  conflicted: string[];
  notAdded: string[];
  staged: string[];
  current: string | null;
  tracking: string | null;
  ahead: number;
  behind: number;
  isClean: boolean;
}

export const configureRepositoryManagement = (
  getGit: GitProviderFactoryImplementing<'status' | 'init' | 'clone'>
) => ({
  gitStatus: async (args: { repoPath?: string }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath });
      const status: GitStatus = await git.status();

      const data: StatusData = {
        modified: status.modified,
        added: status.created,
        deleted: status.deleted,
        renamed: status.renamed.map(r => `${r.from} -> ${r.to}`),
        conflicted: status.conflicted,
        notAdded: status.not_added,
        staged: status.staged,
        current: status.current,
        tracking: status.tracking,
        ahead: status.ahead,
        behind: status.behind,
        isClean: status.isClean()
      };

      return {
        success: true,
        message: status.isClean() ? 'Working tree clean' : 'Working tree has changes',
        data
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to get status: ${error.message}`
      };
    }
  },

  gitInit: async (args: { repoPath?: string }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath, required: false });
      await git.init();

      return {
        success: true,
        message: `Initialized empty Git repository in ${args.repoPath || process.cwd()}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to initialize repository: ${error.message}`
      };
    }
  },

  gitClone: async (args: {
    url: string;
    targetPath?: string;
    repoPath?: string;
  }): Promise<GitOperationResponse> => {
    try {
      const git = await getGit({ repoPath: args.repoPath, required: false });
      const target = args.targetPath || path.basename(args.url, '.git');

      await git.clone(args.url, target);

      return {
        success: true,
        message: `Cloned repository from ${args.url} to ${target}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to clone repository: ${error.message}`
      };
    }
  }
});
