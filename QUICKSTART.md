# Quick Start Guide

Get your MCP Git Server up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Git installed
- VS Code or IntelliJ IDEA with GitHub Copilot

## Installation Steps

### 1. Install Dependencies

```bash
cd /Users/mike.filbin/Projects/Personal/mcp/git
npm install
```

### 2. Build the Project

```bash
npm run build
```

This compiles the TypeScript code to JavaScript in the `dist/` directory.

### 3. Configure GitHub Copilot

#### For VS Code

1. Find or create your MCP configuration file. Typical locations:
   - macOS/Linux: `~/.config/Code/User/globalStorage/github.copilot-chat/mcp.json`
   - Windows: `%APPDATA%\Code\User\globalStorage\github.copilot-chat\mcp.json`

2. Add this configuration (replace with your actual path):

```json
{
  "mcpServers": {
    "git": {
      "command": "node",
      "args": ["/Users/mike.filbin/Projects/Personal/mcp/git/dist/index.js"]
    }
  }
}
```

3. Restart VS Code

#### For IntelliJ IDEA

1. Open Settings (Cmd+, on macOS, Ctrl+Alt+S on Windows/Linux)
2. Navigate to: Tools → GitHub Copilot → MCP Servers
3. Click "Add" and configure:
   - Name: `git`
   - Command: `node`
   - Arguments: `/Users/mike.filbin/Projects/Personal/mcp/git/dist/index.js`
4. Apply and restart IntelliJ

### 4. Verify Installation

Open GitHub Copilot Chat in your IDE and try:

```
Show me the git status
```

or

```
List all branches
```

You should see the MCP server respond with Git information!

## Quick Usage Examples

Once configured, you can use natural language with Copilot:

### View Status
```
What's my git status?
Show me which files have changed
```

### Branch Operations
```
Create a new branch called feature/awesome
Switch to the main branch
List all my branches
```

### Stage and Commit
```
Stage all modified files
Commit with message "Add new feature"
Show me the last 3 commits
```

### Remote Operations
```
Pull from origin
Push to origin main
Fetch from upstream
```

### Advanced
```
Stash my changes
Show me the diff
Rebase onto main
```

## Troubleshooting

### Server Not Found

If Copilot can't find the server:
1. Verify the path in your `mcp.json` is absolute and correct
2. Ensure `npm run build` completed successfully
3. Check that `dist/index.js` exists
4. Restart your IDE

### Git Errors

If you get Git errors:
1. Ensure Git is installed: `git --version`
2. Verify you're in or pointing to a valid Git repository
3. Check repository permissions

### Node.js Errors

If you get Node.js errors:
1. Check Node version: `node --version` (should be 18+)
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Rebuild: `npm run build`

## Next Steps

- Read the full [README.md](README.md) for all available tools
- Check out [examples/usage-examples.md](examples/usage-examples.md) for detailed usage
- Explore all 29 Git tools available in the server

## Development Mode

For development, you can use watch mode:

```bash
npm run watch
```

This automatically rebuilds when you change TypeScript files.

## Support

For issues or questions:
1. Check the [README.md](README.md) documentation
2. Review [examples/usage-examples.md](examples/usage-examples.md)
3. Verify your Git repository is properly initialized

Happy coding with MCP Git Server! 🚀

