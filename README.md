# MCP Git Server

A Model Context Protocol (MCP) server that exposes Git operations as tools for use with GitHub Copilot in VS Code or IntelliJ IDEA.

## Features

This MCP server provides comprehensive Git functionality through a standard set of tools:

### Repository Management
- `git_status` - Show working tree status
- `git_init` - Initialize a new repository
- `git_clone` - Clone a repository

### Branch Operations
- `git_branch_list` - List all branches
- `git_branch_create` - Create a new branch
- `git_branch_delete` - Delete a branch
- `git_checkout` - Switch branches or restore files
- `git_merge` - Merge branches

### File Operations
- `git_diff` - Show changes between commits, working tree, etc.
- `git_add` - Stage files
- `git_reset` - Unstage files
- `git_restore` - Restore working tree files

### Commit Operations
- `git_commit` - Record changes to the repository
- `git_log` - Show commit logs
- `git_show` - Show commit details

### Advanced Operations
- `git_rebase` - Reapply commits on top of another base
- `git_stash` - Stash changes
- `git_stash_pop` - Apply stashed changes
- `git_stash_list` - List stashed changes
- `git_cherry_pick` - Apply a commit to current branch

### Remote Operations
- `git_remote_list` - List remotes
- `git_remote_add` - Add a new remote
- `git_fetch` - Download objects and refs from remote
- `git_pull` - Fetch and merge from remote
- `git_push` - Update remote refs

## Installation

### Option 1: Using a Released Version (Recommended)

1. Go to the [Releases page](../../releases) of this repository

2. Download the latest `git-mcp_X_Y_Z.zip` file

3. Extract the zip file to a directory of your choice:

   ```bash
   # Example: extract to ~/mcp-servers/git
   mkdir -p ~/mcp-servers/git
   unzip git-mcp_1_0_0.zip -d ~/mcp-servers/git
   ```

4. Note the path to the extracted `index.js` file (e.g., `~/mcp-servers/git/index.js`)

5. Skip to the [Usage](#usage) section below to configure your IDE

### Option 2: Building from Source

If you want to modify the code or contribute to development:

1. Clone or download this repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the TypeScript code:

   ```bash
   npm run build
   ```

   The build process uses **esbuild** to create a single bundled file that includes all dependencies. This means:
   - No `node_modules` folder is needed for the built version
   - The entire application is contained in `dist/index.js` (plus source maps)
   - Easy to distribute and deploy

## Usage

### With GitHub Copilot

#### VS Code

1. Ensure you have the latest version of VS Code with GitHub Copilot extension installed.

2. Configure the MCP server by creating or updating your MCP settings. The location depends on your setup:
   - User settings: `~/.config/Code/User/globalStorage/github.copilot-chat/mcp.json`
   - Or through VS Code settings UI

3. Add this server to your `mcp.json`:

   **For downloaded release:**
   ```json
   {
     "mcpServers": {
       "git": {
         "command": "node",
         "args": ["/Users/yourusername/mcp-servers/git/index.js"]
       }
     }
   }
   ```

   **For source build:**
   ```json
   {
     "mcpServers": {
       "git": {
         "command": "node",
         "args": ["/absolute/path/to/mcp-git-server/dist/index.js"]
       }
     }
   }
   ```

   > **Note:** Use the absolute path to wherever you extracted the release or built the project.

4. Restart VS Code or reload the window.

#### IntelliJ IDEA

1. Ensure you have the latest version of IntelliJ IDEA with GitHub Copilot plugin installed.

2. Configure MCP servers in IntelliJ settings:
   - Go to Settings → Tools → GitHub Copilot → MCP Servers
   - Add a new server configuration

3. Add the server with:
   - **Name:** `git`
   - **Command:** `node`
   - **Arguments:** 
     - For downloaded release: `/Users/yourusername/mcp-servers/git/index.js`
     - For source build: `/absolute/path/to/mcp-git-server/dist/index.js`

   > **Note:** Use the absolute path to wherever you extracted the release or built the project.

4. Restart IntelliJ IDEA.

### Standalone Usage

You can also run the server standalone and communicate with it via stdio:

```bash
npm start
```

## Tool Usage Examples

All tools accept an optional `repoPath` parameter. If not provided, the current working directory is used.

### Check status

```javascript
{
  "name": "git_status",
  "arguments": {
    "repoPath": "/path/to/repo"  // optional
  }
}
```

### Stage files

```javascript
{
  "name": "git_add",
  "arguments": {
    "files": ["src/index.ts", "README.md"]
  }
}
```

### Create and checkout a new branch

```javascript
{
  "name": "git_checkout",
  "arguments": {
    "ref": "feature/new-feature",
    "createBranch": true
  }
}
```

### Commit changes

```javascript
{
  "name": "git_commit",
  "arguments": {
    "message": "Add new feature",
    "files": ["src/feature.ts"]  // optional, will stage these files first
  }
}
```

### View commit log

```javascript
{
  "name": "git_log",
  "arguments": {
    "maxCount": 10  // optional
  }
}
```

### Push to remote

```javascript
{
  "name": "git_push",
  "arguments": {
    "remote": "origin",
    "branch": "main",
    "setUpstream": true  // optional
  }
}
```

## Response Format

All tools return a consistent response format:

```typescript
{
  "success": boolean,      // true if operation succeeded
  "message": string,       // human-readable message
  "data": any             // optional additional data
}
```

### Example Success Response

```json
{
  "success": true,
  "message": "Staged 2 file(s): src/index.ts, README.md"
}
```

### Example Error Response

```json
{
  "success": false,
  "message": "Failed to stage files: pathspec 'nonexistent.txt' did not match any files"
}
```

## Development

### Build

Build the project using esbuild (bundles all dependencies):

```bash
npm run build
```

This creates:
- `dist/index.js` - Bundled application with all dependencies included
- `dist/index.js.map` - Source map for debugging
- `dist/package.json` - Minimal package.json for the distribution

The bundled output is **self-contained** and doesn't require `node_modules` to run.

### Build Type Definitions Only

If you need just TypeScript type definitions:

```bash
npm run build:types
```

### Watch Mode

For development with auto-rebuild on changes:

```bash
npm run watch
```

Note: This uses TypeScript's watch mode, not esbuild bundling.

### Clean

Remove build artifacts and release archives:

```bash
npm run clean
```

This removes:
- `dist/` directory
- All `git-mcp_*.zip` files

## Release Process

This project includes a release script that automates version bumping, building, and publishing to GitHub releases.

### Prerequisites

1. **GitHub Personal Access Token**: You need a GitHub personal access token with `repo` scope.
   
   To create one:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Select the `repo` scope (full control of private repositories)
   - Generate and copy the token

2. **Set the token as an environment variable**:

   ```bash
   export GHE_TOKEN="your_github_token_here"
   ```

   For persistence, add it to your `~/.zshrc` or `~/.bashrc`:
   
   ```bash
   echo 'export GHE_TOKEN="your_token"' >> ~/.zshrc
   source ~/.zshrc
   ```

### Running a Release

Execute the release script from the project root:

```bash
./bin/release
```

The script will:

1. **Prompt for version bump type**:
   - Option 1: Major version (breaking changes) - e.g., 1.0.0 → 2.0.0
   - Option 2: Minor version (new features) - e.g., 1.0.0 → 1.1.0
   - Option 3: Patch version (bug fixes) - e.g., 1.0.0 → 1.0.1

2. **Update `package.json`** with the new version

3. **Clean previous build artifacts** using `npm run clean`

4. **Build the project** using `npm run build`

5. **Create a zip archive** named `git-mcp_{major}_{minor}_{patch}.zip` containing the `dist/` folder

6. **Create a GitHub release** with tag `v{version}`

7. **Upload the zip file** as a release asset

### After Release

The script will remind you to commit and push the updated `package.json`:

```bash
git add package.json
git commit -m 'Bump version to X.Y.Z'
git push origin master
```

### Notes

- The script supports both GitHub.com and GitHub Enterprise
- It automatically detects your repository from the git remote
- The script will exit with an error if any step fails

### Project Structure

```
mcp-git-server/
├── src/
│   ├── index.ts        # Main server entry point
│   ├── git-tools.ts    # Git operation implementations
│   └── types.ts        # TypeScript type definitions
├── dist/               # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## Requirements

- Node.js 18 or higher
- Git installed and available in PATH
- GitHub Copilot (for integration with VS Code or IntelliJ)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

