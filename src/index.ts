#!/usr/bin/env node

/**
 * MCP Git Server
 *
 * An MCP server that exposes Git operations as tools for use with GitHub Copilot
 * in VS Code or IntelliJ.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import * as gitTools from './git-tools.js';

/**
 * Tool definitions for the MCP server
 */
const tools: Tool[] = [
  // Repository Management
  {
    name: 'git_status',
    description: 'Show the working tree status including modified, staged, and untracked files',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
    },
    annotations: {
      readOnly: true,
    },
  },
  {
    name: 'git_init',
    description: 'Initialize a new git repository',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: {
          type: 'string',
          description: 'Path where to initialize the repository (defaults to current directory)',
        },
      },
    },
  },
  {
    name: 'git_clone',
    description: 'Clone a repository from a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL of the repository to clone',
        },
        targetPath: {
          type: 'string',
          description: 'The path where to clone the repository',
        },
        repoPath: {
          type: 'string',
          description: 'Base path for the clone operation (defaults to current directory)',
        },
      },
      required: ['url'],
    },
  },

  // Branch Operations
  {
    name: 'git_branch_list',
    description: 'List all branches in the repository',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
    },
    annotations: {
      readOnly: true,
    },
  },
  {
    name: 'git_branch_create',
    description: 'Create a new branch',
    inputSchema: {
      type: 'object',
      properties: {
        branchName: {
          type: 'string',
          description: 'Name of the branch to create',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
      required: ['branchName'],
    },
  },
  {
    name: 'git_branch_delete',
    description: 'Delete a branch',
    inputSchema: {
      type: 'object',
      properties: {
        branchName: {
          type: 'string',
          description: 'Name of the branch to delete',
        },
        force: {
          type: 'boolean',
          description: 'Force delete the branch even if not fully merged',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
      required: ['branchName'],
    },
    annotations: {
      dangerous: true,
      requiresConfirmation: true,
    },
  },
  {
    name: 'git_checkout',
    description: 'Switch branches or restore working tree files',
    inputSchema: {
      type: 'object',
      properties: {
        ref: {
          type: 'string',
          description: 'The branch name, tag, or commit to checkout',
        },
        createBranch: {
          type: 'boolean',
          description: 'Create a new branch before checking out',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
      required: ['ref'],
    },
  },
  {
    name: 'git_merge',
    description: 'Merge a branch into the current branch',
    inputSchema: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: 'The branch to merge into the current branch',
        },
        noFastForward: {
          type: 'boolean',
          description: 'Create a merge commit even when the merge resolves as a fast-forward',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
      required: ['branch'],
    },
  },

  // File Operations
  {
    name: 'git_diff',
    description: 'Show changes between commits, commit and working tree, etc. Supports commit ranges like HEAD...origin/master',
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific files to show diff for (defaults to all files)',
        },
        cached: {
          type: 'boolean',
          description: 'Show diff of staged changes',
        },
        fromCommit: {
          type: 'string',
          description: 'Starting commit/branch for comparison (e.g., "HEAD", "main", commit hash)',
        },
        toCommit: {
          type: 'string',
          description: 'Ending commit/branch for comparison (e.g., "origin/master", commit hash). Defaults to working tree if not specified',
        },
        useThreeDotRange: {
          type: 'boolean',
          description: 'Use three-dot range (fromCommit...toCommit) to show changes on toCommit since it diverged from fromCommit',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
    },
    annotations: {
      readOnly: true,
    },
  },
  {
    name: 'git_add',
    description: 'Add file contents to the staging area',
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files to stage (use ["."] to stage all files)',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
      required: ['files'],
    },
  },
  {
    name: 'git_reset',
    description: 'Unstage files or reset current HEAD to specified state',
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific files to unstage (if not provided, resets to commit)',
        },
        mode: {
          type: 'string',
          enum: ['soft', 'mixed', 'hard'],
          description: 'Reset mode: soft (keep changes staged), mixed (keep changes unstaged), hard (discard changes)',
        },
        commit: {
          type: 'string',
          description: 'Commit hash or reference to reset to (defaults to HEAD)',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
    },
    annotations: {
      dangerous: true,
      requiresConfirmation: true,
    },
  },
  {
    name: 'git_restore',
    description: 'Restore working tree files',
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files to restore',
        },
        staged: {
          type: 'boolean',
          description: 'Restore files in the staging area',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
      required: ['files'],
    },
    annotations: {
      dangerous: true,
      requiresConfirmation: true,
    },
  },

  // Commit Operations
  {
    name: 'git_commit',
    description: 'Record changes to the repository',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Commit message',
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific files to commit (will be staged automatically)',
        },
        amend: {
          type: 'boolean',
          description: 'Amend the previous commit',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'git_log',
    description: 'Show commit logs',
    inputSchema: {
      type: 'object',
      properties: {
        maxCount: {
          type: 'number',
          description: 'Maximum number of commits to show',
        },
        file: {
          type: 'string',
          description: 'Show commits for a specific file',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
    },
    annotations: {
      readOnly: true,
    },
  },
  {
    name: 'git_show',
    description: 'Show details of a commit',
    inputSchema: {
      type: 'object',
      properties: {
        ref: {
          type: 'string',
          description: 'The commit reference to show (defaults to HEAD)',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
    },
    annotations: {
      readOnly: true,
    },
  },

  // Advanced Operations
  {
    name: 'git_rebase',
    description: 'Reapply commits on top of another base tip',
    inputSchema: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: 'The branch to rebase onto',
        },
        interactive: {
          type: 'boolean',
          description: 'Start an interactive rebase',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
      required: ['branch'],
    },
    annotations: {
      dangerous: true,
      requiresConfirmation: true,
    },
  },
  {
    name: 'git_stash',
    description: 'Stash the changes in a dirty working directory',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Message to describe the stash',
        },
        includeUntracked: {
          type: 'boolean',
          description: 'Include untracked files in the stash',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
    },
  },
  {
    name: 'git_stash_pop',
    description: 'Apply stashed changes and remove them from stash list',
    inputSchema: {
      type: 'object',
      properties: {
        index: {
          type: 'number',
          description: 'Index of the stash to pop (defaults to most recent)',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
    },
  },
  {
    name: 'git_stash_list',
    description: 'List all stashed changes',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
    },
    annotations: {
      readOnly: true,
    },
  },
  {
    name: 'git_cherry_pick',
    description: 'Apply the changes introduced by an existing commit',
    inputSchema: {
      type: 'object',
      properties: {
        commit: {
          type: 'string',
          description: 'The commit hash to cherry-pick',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
      required: ['commit'],
    },
  },

  // Remote Operations
  {
    name: 'git_remote_list',
    description: 'List all configured remotes',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
    },
    annotations: {
      readOnly: true,
    },
  },
  {
    name: 'git_remote_add',
    description: 'Add a new remote',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the remote',
        },
        url: {
          type: 'string',
          description: 'URL of the remote repository',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
      required: ['name', 'url'],
    },
  },
  {
    name: 'git_fetch',
    description: 'Download objects and refs from another repository',
    inputSchema: {
      type: 'object',
      properties: {
        remote: {
          type: 'string',
          description: 'Name of the remote to fetch from',
        },
        branch: {
          type: 'string',
          description: 'Specific branch to fetch',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
    },
    annotations: {
      readOnly: true,
    },
  },
  {
    name: 'git_pull',
    description: 'Fetch from and integrate with another repository or local branch',
    inputSchema: {
      type: 'object',
      properties: {
        remote: {
          type: 'string',
          description: 'Name of the remote to pull from',
        },
        branch: {
          type: 'string',
          description: 'Branch to pull',
        },
        rebase: {
          type: 'boolean',
          description: 'Rebase instead of merge',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
    },
  },
  {
    name: 'git_push',
    description: 'Update remote refs along with associated objects',
    inputSchema: {
      type: 'object',
      properties: {
        remote: {
          type: 'string',
          description: 'Name of the remote to push to',
        },
        branch: {
          type: 'string',
          description: 'Branch to push',
        },
        force: {
          type: 'boolean',
          description: 'Force push',
        },
        setUpstream: {
          type: 'boolean',
          description: 'Set upstream tracking',
        },
        repoPath: {
          type: 'string',
          description: 'Path to git repository (defaults to current directory)',
        },
      },
    },
    annotations: {
      dangerous: true,
      requiresConfirmation: true,
    },
  },
];

/**
 * Map tool names to their implementation functions
 */
const toolHandlers: Record<string, (args: any) => Promise<any>> = {
  // Repository Management
  git_status: gitTools.gitStatus,
  git_init: gitTools.gitInit,
  git_clone: gitTools.gitClone,

  // Branch Operations
  git_branch_list: gitTools.gitBranchList,
  git_branch_create: gitTools.gitBranchCreate,
  git_branch_delete: gitTools.gitBranchDelete,
  git_checkout: gitTools.gitCheckout,
  git_merge: gitTools.gitMerge,

  // File Operations
  git_diff: gitTools.gitDiff,
  git_add: gitTools.gitAdd,
  git_reset: gitTools.gitReset,
  git_restore: gitTools.gitRestore,

  // Commit Operations
  git_commit: gitTools.gitCommit,
  git_log: gitTools.gitLog,
  git_show: gitTools.gitShow,

  // Advanced Operations
  git_rebase: gitTools.gitRebase,
  git_stash: gitTools.gitStash,
  git_stash_pop: gitTools.gitStashPop,
  git_stash_list: gitTools.gitStashList,
  git_cherry_pick: gitTools.gitCherryPick,

  // Remote Operations
  git_remote_list: gitTools.gitRemoteList,
  git_remote_add: gitTools.gitRemoteAdd,
  git_fetch: gitTools.gitFetch,
  git_pull: gitTools.gitPull,
  git_push: gitTools.gitPush,
};

/**
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: 'mcp-git-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

/**
 * Handler for tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const handler = toolHandlers[name];
  if (!handler) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            message: `Unknown tool: ${name}`,
          }),
        },
      ],
    };
  }

  try {
    const result = await handler(args || {});
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            message: `Error executing tool: ${error.message}`,
          }),
        },
      ],
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr since stdout is used for MCP communication
  console.error('MCP Git Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

