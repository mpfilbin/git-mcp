/**
 * File Operations
 */

import {GitProviderFactory, GitOperationResponse, GitDiffSummary} from '../providers/git-provider';

export const configureFileOperations = (getGit: GitProviderFactory) => ({
    gitDiff: async (args: {
        files?: string[];
        cached?: boolean;
        fromCommit?: string;
        toCommit?: string;
        useThreeDotRange?: boolean;
        repoPath?: string
    }): Promise<GitOperationResponse> => {
        try {
            const git = await getGit({repoPath: args.repoPath});

            let diff: string;
            const diffArgs: string[] = [];

            // Build the diff command arguments
            if (args.cached) {
                diffArgs.push('--cached');
            }

            // Handle commit ranges
            if (args.fromCommit || args.toCommit) {
                if (args.fromCommit && args.toCommit) {
                    // Both commits specified - use range
                    const rangeOperator = args.useThreeDotRange ? '...' : '..';
                    diffArgs.push(`${args.fromCommit}${rangeOperator}${args.toCommit}`);
                } else if (args.fromCommit) {
                    // Only fromCommit specified - compare with working tree
                    diffArgs.push(args.fromCommit);
                } else if (args.toCommit) {
                    // Only toCommit specified - compare with working tree (unusual but supported)
                    diffArgs.push(args.toCommit);
                }
            }

            // Add files if specified
            if (args.files && args.files.length > 0) {
                diffArgs.push('--', ...args.files);
            }

            diff = await git.diff(diffArgs);

            // Get diff summary with the same arguments (excluding the files separator)
            const summaryArgs = diffArgs.filter(arg => arg !== '--');
            const diffSummary = await git.diffSummary(summaryArgs);

            const data: GitDiffSummary = {
                files: diffSummary.files.map(f => ({
                    file: f.file,
                    changes: 'changes' in f ? f.changes : 0,
                    insertions: 'insertions' in f ? f.insertions : 0,
                    deletions: 'deletions' in f ? f.deletions : 0,
                    binary: f.binary,
                })),
                insertions: diffSummary.insertions,
                deletions: diffSummary.deletions,
                changed: diffSummary.changed
            };

            let message: string;
            if (args.fromCommit && args.toCommit) {
                const rangeOperator = args.useThreeDotRange ? '...' : '..';
                message = `Diff for ${args.fromCommit}${rangeOperator}${args.toCommit}`;
            } else if (args.fromCommit) {
                message = `Diff from ${args.fromCommit} to working tree`;
            } else if (args.toCommit) {
                message = `Diff to ${args.toCommit}`;
            } else if (args.cached) {
                message = 'Diff for staged changes';
            } else {
                message = `Diff for ${args.files?.length || 'all'} file(s)`;
            }

            return {
                success: true,
                message,
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
    },

    gitAdd: async (args: { files: string[]; repoPath?: string }): Promise<GitOperationResponse> => {
        try {
            const git = await getGit({repoPath: args.repoPath});
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
    },

    gitReset: async (args: {
        files?: string[];
        mode?: 'soft' | 'mixed' | 'hard';
        commit?: string;
        repoPath?: string
    }): Promise<GitOperationResponse> => {
        try {
            const git = await getGit({repoPath: args.repoPath});

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
    },

    gitRestore: async (args: {
        files: string[];
        staged?: boolean;
        repoPath?: string
    }): Promise<GitOperationResponse> => {
        try {
            const git = await getGit({repoPath: args.repoPath});

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
});
