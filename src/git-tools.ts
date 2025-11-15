/**
 * Git operation tools for MCP server
 */

import simpleGit, { SimpleGit, StatusResult, BranchSummary, LogResult } from 'simple-git';
import { GitOperationResponse, StatusData, BranchInfo, CommitInfo, RemoteInfo, DiffData } from './types.js';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Get SimpleGit instance for a given repository path
 */
function getGit(repoPath?: string): SimpleGit {
  const basePath = repoPath || process.cwd();
  return simpleGit(basePath);
}

/**
 * Verify that a path is a git repository
 */
async function verifyGitRepo(repoPath?: string): Promise<GitOperationResponse | null> {
  try {
    const git = getGit(repoPath);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return {
        success: false,
        message: `Not a git repository: ${repoPath || process.cwd()}`
      };
    }
    return null; // No error
  } catch (error: any) {
    return {
      success: false,
      message: `Error verifying repository: ${error.message}`
    };
  }
}

/**
 * Repository Management Tools
 */

export async function gitStatus(args: { repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    const status: StatusResult = await git.status();

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
}

export async function gitInit(args: { repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const git = getGit(args.repoPath);
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
}

export async function gitClone(args: { url: string; targetPath?: string; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const git = getGit(args.repoPath);
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

/**
 * Branch Operations
 */

export async function gitBranchList(args: { repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    const branches: BranchSummary = await git.branch();

    const data: BranchInfo[] = branches.all.map(name => ({
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
}

export async function gitBranchCreate(args: { branchName: string; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
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
}

export async function gitBranchDelete(args: { branchName: string; force?: boolean; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
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
}

export async function gitCheckout(args: { ref: string; createBranch?: boolean; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    
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
}

export async function gitMerge(args: { branch: string; noFastForward?: boolean; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
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

/**
 * File Operations
 */

export async function gitDiff(args: { files?: string[]; cached?: boolean; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    
    let diff: string;
    if (args.cached) {
      diff = await git.diff(['--cached', ...(args.files || [])]);
    } else {
      diff = await git.diff(args.files || []);
    }

    // Also get diff summary
    const diffSummary = await git.diffSummary(args.cached ? ['--cached'] : []);

    const data: DiffData = {
      files: diffSummary.files.map(f => ({
        file: f.file,
        changes: 'changes' in f ? f.changes : 0,
        insertions: 'insertions' in f ? f.insertions : 0,
        deletions: 'deletions' in f ? f.deletions : 0
      })),
      insertions: diffSummary.insertions,
      deletions: diffSummary.deletions,
      changed: diffSummary.changed
    };

    return {
      success: true,
      message: `Diff for ${args.files?.length || 'all'} file(s)`,
      data: {
        summary: data,
        diff
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to get diff: ${error.message}`
    };
  }
}

export async function gitAdd(args: { files: string[]; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    await git.add(args.files);

    return {
      success: true,
      message: `Staged ${args.files.length} file(s): ${args.files.join(', ')}`
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to stage files: ${error.message}`
    };
  }
}

export async function gitReset(args: { files?: string[]; mode?: 'soft' | 'mixed' | 'hard'; commit?: string; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    
    if (args.files && args.files.length > 0) {
      // Unstage specific files
      const ref = args.commit || 'HEAD';
      await git.reset([ref, ...args.files]);
      return {
        success: true,
        message: `Unstaged ${args.files.length} file(s): ${args.files.join(', ')}`
      };
    } else {
      // Reset to a specific commit with mode
      const mode = args.mode || 'mixed';
      const target = args.commit || 'HEAD';
      await git.reset([`--${mode}`, target]);
      return {
        success: true,
        message: `Reset to ${target} (${mode} mode)`
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to reset: ${error.message}`
    };
  }
}

export async function gitRestore(args: { files: string[]; staged?: boolean; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    
    const options = args.staged ? ['--staged', ...args.files] : args.files;
    await git.raw(['restore', ...options]);

    return {
      success: true,
      message: args.staged 
        ? `Restored ${args.files.length} file(s) from staging`
        : `Restored ${args.files.length} file(s) from HEAD`
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to restore files: ${error.message}`
    };
  }
}

/**
 * Commit Operations
 */

export async function gitCommit(args: { message: string; files?: string[]; amend?: boolean; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    
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
}

export async function gitLog(args: { maxCount?: number; file?: string; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    
    const options: any = {};
    if (args.maxCount) {
      options.maxCount = args.maxCount;
    }
    if (args.file) {
      options.file = args.file;
    }
    
    const log: LogResult = await git.log(options);

    const commits: CommitInfo[] = log.all.map(commit => ({
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
}

export async function gitShow(args: { ref?: string; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
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

/**
 * Advanced Operations
 */

export async function gitRebase(args: { branch: string; interactive?: boolean; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    
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
}

export async function gitStash(args: { message?: string; includeUntracked?: boolean; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    
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
}

export async function gitStashPop(args: { index?: number; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    
    const options = ['pop'];
    if (args.index !== undefined) {
      options.push(`stash@{${args.index}}`);
    }
    
    await git.stash(options);

    return {
      success: true,
      message: args.index !== undefined 
        ? `Applied stash@{${args.index}}`
        : 'Applied most recent stash'
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to pop stash: ${error.message}`
    };
  }
}

export async function gitStashList(args: { repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
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
}

export async function gitCherryPick(args: { commit: string; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
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

/**
 * Remote Operations
 */

export async function gitRemoteList(args: { repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    const remotes = await git.getRemotes(true);

    const data: RemoteInfo[] = remotes.map(remote => ({
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
}

export async function gitRemoteAdd(args: { name: string; url: string; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
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
}

export async function gitFetch(args: { remote?: string; branch?: string; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    
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
}

export async function gitPull(args: { remote?: string; branch?: string; rebase?: boolean; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    
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
}

export async function gitPush(args: { remote?: string; branch?: string; force?: boolean; setUpstream?: boolean; repoPath?: string }): Promise<GitOperationResponse> {
  try {
    const error = await verifyGitRepo(args.repoPath);
    if (error) return error;

    const git = getGit(args.repoPath);
    
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

