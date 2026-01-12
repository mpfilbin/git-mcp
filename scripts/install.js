#!/usr/bin/env node

/**
 * Install script - copies dist/index.js to a specified location
 * Usage: npm run install:mcp <target-path>
 */

const { copyFileSync, existsSync, mkdirSync } = require('fs');
const { join, dirname } = require('path');

const targetPath = process.argv[2];

if (!targetPath) {
  console.error('Error: Target path is required');
  console.error('Usage: npm run install:mcp <target-path>');
  console.error('Example: npm run install:mcp /usr/local/bin/git-mcp');
  process.exit(1);
}

const sourceFile = join(__dirname, '..', 'dist', 'index.js');

if (!existsSync(sourceFile)) {
  console.error('Error: dist/index.js not found');
  console.error('Please run "npm run build" first');
  process.exit(1);
}

// Create target directory if it doesn't exist
const targetDir = dirname(targetPath);
if (!existsSync(targetDir)) {
  try {
    mkdirSync(targetDir, { recursive: true });
    console.log(`Created directory: ${targetDir}`);
  } catch (error) {
    console.error(`Error creating directory ${targetDir}:`, error.message);
    process.exit(1);
  }
}

// Copy the file
try {
  copyFileSync(sourceFile, targetPath);
  console.log(`✓ Installed successfully!`);
  console.log(`  Source: ${sourceFile}`);
  console.log(`  Target: ${targetPath}`);

  // Make the file executable on Unix-like systems
  if (process.platform !== 'win32') {
    const { chmodSync } = require('fs');
    chmodSync(targetPath, 0o755);
    console.log(`  Permissions: Executable (755)`);
  }
} catch (error) {
  console.error(`Error copying file:`, error.message);
  process.exit(1);
}
