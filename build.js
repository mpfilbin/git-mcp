#!/usr/bin/env node

/**
 * Build script using esbuild to bundle the MCP Git Server
 * This bundles all dependencies into a single file for easy distribution
 */

const esbuild = require('esbuild');
const { join } = require('path');
const {
  readFileSync,
  writeFileSync,
  chmodSync,
  rmSync,
  readdirSync,
  existsSync
} = require('fs');

const distDir = join(__dirname, 'dist');

function removeUnwantedDistArtifacts() {
  if (!existsSync(distDir)) return;

  rmSync(join(distDir, 'package.json'), { force: true });

  const removeIdeaDirs = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const fullPath = join(dir, entry.name);
      if (entry.name === '.idea') {
        rmSync(fullPath, { recursive: true, force: true });
      } else {
        removeIdeaDirs(fullPath);
      }
    }
  };

  removeIdeaDirs(distDir);
}

async function build() {
  try {
    console.log('Building MCP Git Server with esbuild...');

    const outfile = join(distDir, 'index.js');

    removeUnwantedDistArtifacts();

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
      logLevel: 'info'
    });

    // Read the bundled output and handle shebang
    let bundledCode = readFileSync(outfile, 'utf-8');

    // Remove any existing shebangs from the bundle (esbuild preserves them)
    bundledCode = bundledCode.replace(/^#!.*\n/gm, '');

    // Add a single shebang at the beginning
    writeFileSync(outfile, '#!/usr/bin/env node\n' + bundledCode);

    // Make the file executable
    chmodSync(outfile, 0o755);

    removeUnwantedDistArtifacts();

    console.log('✓ Build completed successfully!');
    console.log('  - Bundled all dependencies into dist/index.js');
    console.log('  - Generated source maps');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
