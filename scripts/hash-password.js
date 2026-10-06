#!/usr/bin/env node
'use strict';
/*
 * Turns the admin password into the hash the server stores.
 *   npm run hash-password
 * Paste the printed line into .env as ADMIN_PASSWORD_HASH=...
 * The password itself is never written anywhere.
 */
const crypto = require('node:crypto');

const N = 32768, r = 8, p = 1, KEYLEN = 64, MIN_LENGTH = 12;

function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    if (!stdin.isTTY) {
      let data = '';
      stdin.setEncoding('utf8');
      stdin.on('data', (c) => { data += c; });
      stdin.on('end', () => { process.stdout.write('\n'); resolve(data.split(/\r?\n/)[0]); });
      return;
    }
    let value = '';
    stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
    const onData = (ch) => {
      for (const c of ch) {
        if (c === '\r' || c === '\n') { stdin.setRawMode(false); stdin.pause(); stdin.removeListener('data', onData); process.stdout.write('\n'); return resolve(value); }
        if (c === '\u0003') { process.stdout.write('\n'); process.exit(130); }
        if (c === '\u007f' || c === '\b') value = value.slice(0, -1); else value += c;
      }
    };
    stdin.on('data', onData);
  });
}

(async () => {
  const pw = await askHidden('New admin password: ');
  if (pw.length < MIN_LENGTH) { console.error(`Use at least ${MIN_LENGTH} characters. A few random words work well.`); process.exit(1); }
  if (process.stdin.isTTY) {
    const again = await askHidden('Type it again: ');
    if (again !== pw) { console.error('The two passwords don’t match. Nothing was changed.'); process.exit(1); }
  }
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw.normalize('NFKC'), salt, KEYLEN, { N, r, p, maxmem: 256 * N * r });
  console.log('\nAdd this line to your .env file:\n');
  console.log(`ADMIN_PASSWORD_HASH=scrypt:${N}:${r}:${p}:${salt.toString('base64url')}:${hash.toString('base64url')}\n`);
})();
