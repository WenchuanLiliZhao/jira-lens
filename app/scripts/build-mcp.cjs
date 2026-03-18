// Build script for MCP server and CLI tools using esbuild.
// Uses ESM output with __dirname/__filename polyfills for CJS-bundled dependencies.
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const banner = {
  js: [
    `import { fileURLToPath as __jtoBuildFileURLToPath } from 'url';`,
    `import { dirname as __jtoBuildDirname } from 'path';`,
    `const __filename = __jtoBuildFileURLToPath(import.meta.url);`,
    `const __dirname = __jtoBuildDirname(__filename);`,
  ].join('\n'),
};

const common = {
  bundle: true,
  platform: 'node',
  format: 'esm',
  external: ['vscode'],
  banner,
};

esbuild.buildSync({
  ...common,
  entryPoints: ['src/mcp/server.ts'],
  outfile: 'out/mcp/mcp/server.js',
});

esbuild.buildSync({
  ...common,
  entryPoints: [
    'src/cli/query.ts',
    'src/cli/bulk-move.ts',
    'src/cli/bulk-assign.ts',
    'src/cli/bulk-transition.ts',
  ],
  outdir: 'out/mcp/cli',
});

fs.mkdirSync(path.join('out', 'mcp'), { recursive: true });
fs.writeFileSync(path.join('out', 'mcp', 'package.json'), JSON.stringify({ type: 'module' }));

console.log('MCP build complete.');
