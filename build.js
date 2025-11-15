#!/usr/bin/env node

/**
 * Build script using esbuild to bundle the MCP Git Server
 * This bundles all dependencies into a single file for easy distribution
 */

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, chmodSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function build() {
  try {
    console.log('Building MCP Git Server with esbuild...');

    const outfile = join(__dirname, 'dist', 'index.js');

    // Bundle the application
    // Note: Using CommonJS format because some dependencies (simple-git) use dynamic requires
    await esbuild.build({
      entryPoints: [join(__dirname, 'src', 'index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: outfile,
      sourcemap: true,
      external: [],
      packages: 'bundle',
      mainFields: ['main', 'module'],
      logLevel: 'info',
    });

    // Read the bundled output and handle shebang
    let bundledCode = readFileSync(outfile, 'utf-8');
    
    // Remove any existing shebangs from the bundle (esbuild preserves them)
    bundledCode = bundledCode.replace(/^#!.*\n/gm, '');
    
    // Add a single shebang at the beginning
    writeFileSync(outfile, '#!/usr/bin/env node\n' + bundledCode);
    
    // Make the file executable
    chmodSync(outfile, 0o755);

    // Read package.json to get the version
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, 'package.json'), 'utf-8')
    );

    // Create a minimal package.json for the dist folder
    const distPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      main: 'index.js',
      bin: {
        'mcp-git-server': './index.js',
      },
      license: packageJson.license,
    };

    writeFileSync(
      join(__dirname, 'dist', 'package.json'),
      JSON.stringify(distPackageJson, null, 2) + '\n'
    );

    console.log('✓ Build completed successfully!');
    console.log('  - Bundled all dependencies into dist/index.js');
    console.log('  - Created dist/package.json');
    console.log('  - Generated source maps');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();

