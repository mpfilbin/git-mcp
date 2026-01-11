/**
 * Internal utility functions for Git operations
 */

import simpleGit from 'simple-git';
import {GitProvider, GitProviderFactory} from "../git-provider";


export const getGit: GitProviderFactory = async ({repoPath, required = true}) => {
    const basePath = repoPath || process.cwd();
    const git = simpleGit(basePath) as unknown as GitProvider
    if (required && !await git.checkIsRepo()) {
        throw new Error(`Not a git repository: ${basePath}`)
    }
    return git;
}
