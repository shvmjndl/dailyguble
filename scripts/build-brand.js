#!/usr/bin/env node
'use strict';
/* Rebuilds src/brand.js (the logo built into the paper) from the files in brand/. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const clean = (file, id) => fs.readFileSync(path.join(root, 'brand', file), 'utf8').trim()
  .replace(/<title>[^<]*<\/title>/, '')
  .replace(/ width="\d+" height="\d+"/, '')
  .replace(/ role="img" aria-label="[^"]*"/, ' aria-hidden="true" focusable="false"')
  .replace(/id="disc"/g, `id="${id}"`).replace(/url\(#disc\)/g, `url(#${id})`);
const out = '/* The Harbor Light logo, built into the page (generated from brand/*.svg). */\n' +
  'var BRAND_BADGE = ' + JSON.stringify(clean('guble-icon.svg', 'guble-disc')) + ';\n' +
  'var BRAND_WORDMARK_DARK = ' + JSON.stringify(clean('guble-wordmark-dark.svg', 'guble-w')) + ';\n';
fs.writeFileSync(path.join(root, 'src', 'brand.js'), out);
console.log('wrote src/brand.js');
