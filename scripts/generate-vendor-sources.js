#!/usr/bin/env node
/**
 * Generates self-hosted TypeScript wrapper files for jQuery and form-render.
 * Run: node scripts/generate-vendor-sources.js
 *
 * The output files embed the minified JS as a string literal so the
 * call-form-renderer can inline them into the srcdoc iframe without relying
 * on any external CDN.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'src', 'lib', 'form-render');

fs.mkdirSync(outDir, { recursive: true });

function generate(srcRelative, outFile, exportName) {
  const src = fs.readFileSync(path.join(root, srcRelative), 'utf8');
  const content =
    '// Auto-generated – do not edit manually.\n' +
    '// Regenerate via: node scripts/generate-vendor-sources.js\n' +
    'const ' + exportName + ': string = ' + JSON.stringify(src) + ';\n' +
    'export default ' + exportName + ';\n';
  fs.writeFileSync(path.join(outDir, outFile), content, 'utf8');
  const size = fs.statSync(path.join(outDir, outFile)).size;
  console.log('Wrote', outFile, '(' + size + ' bytes)');
}

generate('assets/js/jquery-3.6.0.min.js', 'jquery-source.ts', 'jquerySource');
generate('assets/js/form-render.min.js', 'form-render-source.ts', 'formRenderSource');

console.log('Done.');
