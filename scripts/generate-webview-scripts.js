#!/usr/bin/env node
/* eslint-env node */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const jquery = fs.readFileSync(path.join(root, 'assets/js/jquery-3.6.0.min.js'), 'utf8');
const formRender = fs.readFileSync(path.join(root, 'assets/js/form-render.min.js'), 'utf8');

// Escape content for safe embedding in a JS template literal
function escapeForTemplateLiteral(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

const output = [
  '// AUTO-GENERATED — do not edit by hand.',
  '// Regenerate with: node scripts/generate-webview-scripts.js',
  '//',
  '// jquery-3.6.0.min.js — jQuery v3.6.0, MIT License',
  '//   Source: https://code.jquery.com/jquery-3.6.0.min.js',
  '// form-render.min.js — jQuery formBuilder formRender plugin, MIT License',
  '//   Source: https://formbuilder.online/assets/js/form-render.min.js',
  '//   Retrieved: 2026-03-12',
  '',
  '/* eslint-disable */',
  '// prettier-ignore',
  'export const jquerySource = `' + escapeForTemplateLiteral(jquery) + '`;',
  '',
  '// prettier-ignore',
  'export const formRenderSource = `' + escapeForTemplateLiteral(formRender) + '`;',
  '',
].join('\n');

const outPath = path.join(root, 'src/utils/webview-scripts.ts');
fs.writeFileSync(outPath, output, 'utf8');
console.log('Generated', outPath, '(' + Math.round(Buffer.byteLength(output) / 1024) + ' KB)');
