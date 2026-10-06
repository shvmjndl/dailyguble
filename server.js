'use strict';
/*
 * The Daily Guble — newspaper server.
 *
 *   GET  /                 today's edition (public)
 *   GET  /admin            sign-in page, or the newsroom editor once signed in
 *   POST /api/login        check the admin password, start a session
 *   POST /api/logout       end the session
 *   GET  /api/issue        today's edition as JSON (public)
 *   PUT  /api/issue        publish a new edition (admin, CSRF token required)
 *   GET  /api/history      published versions (admin)
 *   GET  /api/history/:id  one published version (admin)
 *   GET  /api/site         where the public website is published, and how the last push went (admin)
 *   POST /api/site/publish publish the current edition to the public website now (admin)
 *   GET  /healthz          liveness check
 *
 * No third-party packages: everything here is Node's standard library.
 */
const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const zlib = require('node:zlib');
const vm = require('node:vm');
const { buildSite, writeSite, pushToGitHub, DATA_SOURCES } = require('./publish');

const scrypt = promisify(crypto.scrypt);
const env = process.env;
const ROOT = __dirname;

/* ---------------- configuration ---------------- */
const PORT = Number(env.PORT) || 8080;
const HOST = env.HOST || undefined;                 // e.g. 127.0.0.1 to accept local connections only
const DATA_DIR = path.resolve(env.DATA_DIR || path.join(ROOT, 'data'));
const ISSUE_FILE = path.join(DATA_DIR, 'issue.json');
const META_FILE = path.join(DATA_DIR, 'meta.json');
const HISTORY_DIR = path.join(DATA_DIR, 'history');
const SEED_FILE = path.join(ROOT, 'seed', 'issue.json');

const ADMIN_USERNAME = env.ADMIN_USERNAME || 'editor';
const ADMIN_PASSWORD_HASH = (env.ADMIN_PASSWORD_HASH || '').trim();
const COOKIE_SECURE = env.COOKIE_SECURE !== 'false';
const TRUST_PROXY = env.TRUST_PROXY === 'true';
const HISTORY_KEEP = Math.max(5, Number(env.HISTORY_KEEP) || 60);

/* The public website: built as static files on every publish, and pushed to GitHub if configured. */
const SITE_DIR = path.resolve(env.SITE_DIR || path.join(DATA_DIR, 'site'));
const SITE_URL = (env.SITE_URL || '').trim();
const GITHUB = { token: (env.GITHUB_TOKEN || '').trim(), repo: (env.GITHUB_REPO || '').trim(), branch: (env.GITHUB_BRANCH || 'main').trim(), dir: (env.GITHUB_DIR || '').trim(), api: (env.GITHUB_API_URL || 'https://api.github.com').trim(),
  author: env.GITHUB_AUTHOR_NAME && env.GITHUB_AUTHOR_EMAIL ? { name: env.GITHUB_AUTHOR_NAME.trim(), email: env.GITHUB_AUTHOR_EMAIL.trim() } : null };
const PUSH_ENABLED = !!(GITHUB.token && GITHUB.repo);

const SESSION_IDLE_MS = 2 * 60 * 60 * 1000;      // signed out after 2 hours idle
const SESSION_MAX_MS = 12 * 60 * 60 * 1000;      // and after 12 hours regardless
const MAX_SESSIONS = 50;
const LOGIN_MAX_FAILS = 5;                       // per IP address...
const LOCK_MS = 15 * 60 * 1000;                  // ...then locked out for 15 minutes
const MAX_ISSUE_BYTES = 25 * 1024 * 1024;        // photos are embedded, so editions can be large
const MAX_SMALL_BODY = 8 * 1024;
const COOKIE = COOKIE_SECURE ? '__Host-guble_admin' : 'guble_admin';

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "manifest-src 'self'",
  "connect-src 'self' " + DATA_SOURCES.join(' '),
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'"
].join('; ');

/* ---------------- password hashing ---------------- */
/* Format: scrypt:N:r:p:salt:hash (salt and hash base64url). Made by scripts/hash-password.js. */
function parseHash(s) {
  const parts = s.split(':');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return null;
  const N = Number(parts[1]), r = Number(parts[2]), p = Number(parts[3]);
  const salt = Buffer.from(parts[4], 'base64url'), hash = Buffer.from(parts[5], 'base64url');
  const powerOfTwo = N > 1 && (N & (N - 1)) === 0;
  if (!powerOfTwo || N < 16384 || N > 1048576 || r < 8 || r > 32 || p < 1 || p > 4 || salt.length < 16 || hash.length < 32) return null;
  return { N, r, p, salt, hash };
}
const PASSWORD = ADMIN_PASSWORD_HASH ? parseHash(ADMIN_PASSWORD_HASH) : null;
if (ADMIN_PASSWORD_HASH && !PASSWORD) {
  console.error('ADMIN_PASSWORD_HASH is set but is not a valid hash. Generate one with: npm run hash-password');
  process.exit(1);
}
if (!PASSWORD) console.warn('[guble] ADMIN_PASSWORD_HASH is not set: the paper is public, but nobody can sign in to edit it.');
if (!COOKIE_SECURE) console.warn('[guble] COOKIE_SECURE=false: only use this for local testing over plain http.');

/* Only a few scrypt checks run at once, so a flood of logins can't exhaust memory. */
let scryptRunning = 0;
async function verifyPassword(password) {
  if (!PASSWORD) return false;
  if (scryptRunning >= 4) { const e = new Error('busy'); e.status = 503; throw e; }
  scryptRunning++;
  try {
    const { N, r, p, salt, hash } = PASSWORD;
    const got = await scrypt(String(password).normalize('NFKC'), salt, hash.length, { N, r, p, maxmem: 256 * N * r });
    return crypto.timingSafeEqual(got, hash);
  } finally { scryptRunning--; }
}
function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- sessions ---------------- */
/* The browser holds a random 256-bit id; the server keeps only its SHA-256. */
const sessions = new Map();
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}
function cookieHeader(value, maxAgeSec) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}` + (COOKIE_SECURE ? '; Secure' : '');
}
function createSession(res) {
  if (sessions.size >= MAX_SESSIONS) {
    const oldest = [...sessions.entries()].sort((a, b) => a[1].seen - b[1].seen)[0];
    if (oldest) sessions.delete(oldest[0]);
  }
  const id = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  sessions.set(sha256(id), { csrf: crypto.randomBytes(32).toString('base64url'), created: now, seen: now });
  res.setHeader('Set-Cookie', cookieHeader(id, SESSION_MAX_MS / 1000));
}
function getSession(req) {
  const id = parseCookies(req)[COOKIE];
  if (!id || id.length > 128) return null;
  const key = sha256(id), s = sessions.get(key);
  if (!s) return null;
  const now = Date.now();
  if (now - s.seen > SESSION_IDLE_MS || now - s.created > SESSION_MAX_MS) { sessions.delete(key); return null; }
  s.seen = now;
  return Object.assign({ key }, s);
}
function destroySession(req, res) {
  const id = parseCookies(req)[COOKIE];
  if (id) sessions.delete(sha256(id));
  res.setHeader('Set-Cookie', cookieHeader('', 0));
}
setInterval(() => {
  const now = Date.now();
  for (const [k, s] of sessions) if (now - s.seen > SESSION_IDLE_MS || now - s.created > SESSION_MAX_MS) sessions.delete(k);
  for (const [ip, a] of attempts) if (a.until < now && now - a.last > LOCK_MS) attempts.delete(ip);
}, 10 * 60 * 1000).unref();

/* ---------------- request checks ---------------- */
function clientIp(req) {
  if (TRUST_PROXY) {
    const parts = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];   // the address our own proxy saw
  }
  return req.socket.remoteAddress || 'unknown';
}
/* Writes must come from this site's own pages. */
function sameOrigin(req) {
  const host = req.headers.host;
  const origin = req.headers.origin;
  if (origin) { try { return new URL(origin).host === host; } catch { return false; } }
  return req.headers['sec-fetch-site'] === 'same-origin';
}
function isJson(req) { return /^application\/json\b/i.test(req.headers['content-type'] || ''); }
function requireAdmin(req, res, { write } = { write: false }) {
  const s = getSession(req);
  if (!s) { sendJson(res, 401, { error: 'signed_out' }); return null; }
  if (write) {
    if (!sameOrigin(req)) { sendJson(res, 403, { error: 'cross_site' }); return null; }
    if (!safeEqual(req.headers['x-csrf-token'] || '', s.csrf)) { sendJson(res, 403, { error: 'bad_csrf_token' }); return null; }
  } else if (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') {
    sendJson(res, 403, { error: 'cross_site' }); return null;
  }
  return s;
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length'] || 0);
    if (declared > limit) { const e = new Error('too_large'); e.status = 413; return reject(e); }
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { const e = new Error('too_large'); e.status = 413; reject(e); req.destroy(); }
      else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
async function readJson(req, limit) {
  const text = await readBody(req, limit);
  try { return JSON.parse(text); } catch { const e = new Error('bad_json'); e.status = 400; throw e; }
}

/* ---------------- responses ---------------- */
function baseHeaders(res) {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
  if (COOKIE_SECURE) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}
function sendJson(res, status, obj, headers = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, headers));
  res.end(body);
}
function sendText(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(text);
}
function sendHtml(res, html, cache) {
  const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cache || 'no-cache', Vary: 'Accept-Encoding' };
  if (res.__gzip) { headers['Content-Encoding'] = 'gzip'; res.writeHead(200, headers); return res.end(zlib.gzipSync(html, { level: 6 })); }
  res.writeHead(200, headers);
  res.end(html);
}
function sendAsset(req, res, asset, cache) {
  if (req.headers['if-none-match'] === asset.etag) { res.writeHead(304, { ETag: asset.etag, 'Cache-Control': cache }); return res.end(); }
  const headers = { 'Content-Type': asset.type, ETag: asset.etag, 'Cache-Control': cache, Vary: 'Accept-Encoding' };
  const gz = res.__gzip && asset.gz;
  if (gz) headers['Content-Encoding'] = 'gzip';
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : (gz ? asset.gz : asset.body));
}

/* ---------------- pages and bundles ---------------- */
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readBin = (p) => fs.readFileSync(path.join(ROOT, p));
/* Theme data (presets and typefaces) is shared with the browser code. */
const THEMES = (() => { const ctx = {}; vm.runInNewContext(read('src/themes.js'), ctx); return ctx; })();
function fontInfo(issue) {
  const t = THEMES.themeOf(issue), fams = [...new Set(THEMES.FONT_ROLES.map((r) => t.fonts[r[0]]))];
  return { href: THEMES.fontsHref(fams), list: fams.join('|') };
}
const VIEWS = { reader: read('views/reader.html'), admin: read('views/admin.html'), login: read('views/login.html'), site: read('views/site.html') };
function asset(body, type) {
  const a = { body, type, etag: '"' + crypto.createHash('sha1').update(body).digest('base64url') + '"' };
  if (/text|javascript|json|svg|manifest/.test(type)) a.gz = zlib.gzipSync(body, { level: 9 });   // compressed once, at start-up
  return a;
}
const bundle = (...files) => '(function(){"use strict";\n' + ['src/themes.js'].concat(files).map(read).join('\n') + '\n})();\n';
const PUBLIC_ASSETS = {
  '/paper.css': asset(read('public/paper.css'), 'text/css; charset=utf-8'),
  '/paper.js': asset(bundle('src/core.js', 'src/almanac.js', 'src/reader.js'), 'text/javascript; charset=utf-8'),
  '/login.css': asset(read('public/login.css'), 'text/css; charset=utf-8'),
  '/login.js': asset(read('public/login.js'), 'text/javascript; charset=utf-8'),
  '/favicon.svg': asset(read('public/favicon.svg'), 'image/svg+xml'),
  '/manifest.webmanifest': asset(read('public/manifest.webmanifest'), 'application/manifest+json; charset=utf-8'),
  '/icon-192.png': asset(readBin('public/icon-192.png'), 'image/png'),
  '/icon-512.png': asset(readBin('public/icon-512.png'), 'image/png'),
  '/apple-touch-icon.png': asset(readBin('public/apple-touch-icon.png'), 'image/png'),
  '/og-image.png': asset(readBin('public/og-image.png'), 'image/png')
};
const ADMIN_ASSETS = {
  '/admin/editor.css': asset(read('admin/editor.css'), 'text/css; charset=utf-8'),
  '/admin/editor.js': asset(bundle('src/core.js', 'src/almanac.js', 'src/editor.js'), 'text/javascript; charset=utf-8')
};
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function paperTitle() {
  const name = String((live.issue.masthead || {}).name || 'The Daily Guble').replace(/<[^>]*>/g, '');
  return escapeHtml(name.replace(/&amp;/g, '&').replace(/&[a-z]+;/gi, ' ').trim() || 'The Daily Guble');
}
/* JSON inside <script type="application/json">: escape "<" so the data can never close the tag. */
const LS = new RegExp('\\u2028', 'g'), PS = new RegExp('\\u2029', 'g');
const scriptSafe = (json) => json.replace(/</g, '\\u003c').replace(LS, '\\u2028').replace(PS, '\\u2029');
function fill(view, values) { return view.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in values ? values[k] : '')); }

/* ---------------- location (live values are worked out in readers' browsers) ---------------- */
function checkLocation(l) {
  const lat = Number(l.lat), lon = Number(l.lon);
  if (l.lat != null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) return 'latitude must be between -90 and 90';
  if (l.lon != null && (!Number.isFinite(lon) || lon < -180 || lon > 180)) return 'longitude must be between -180 and 180';
  if (l.timeZone != null) { try { new Intl.DateTimeFormat('en-US', { timeZone: String(l.timeZone) }); } catch { return 'unknown time zone'; } }
  if (l.tideStation && !/^\d{7}$/.test(String(l.tideStation))) return 'a NOAA tide station id is 7 digits';
  if (l.units != null && !['F', 'C'].includes(l.units)) return 'temperature units must be F or C';
  return null;
}

/* ---------------- the public website ---------------- */
let siteStatus = { url: SITE_URL || null, pushConfigured: PUSH_ENABLED, repo: PUSH_ENABLED ? GITHUB.repo : null, last: null };
function siteFiles() {
  return buildSite(live.issue, {
    fonts: fontInfo(live.issue), template: VIEWS.site, readerJs: PUBLIC_ASSETS['/paper.js'].body, paperCss: PUBLIC_ASSETS['/paper.css'].body,
    favicon: PUBLIC_ASSETS['/favicon.svg'].body, manifest: JSON.parse(PUBLIC_ASSETS['/manifest.webmanifest'].body),
    siteUrl: SITE_URL, ogImage: PUBLIC_ASSETS['/og-image.png'].body,
    icon192: PUBLIC_ASSETS['/icon-192.png'].body, icon512: PUBLIC_ASSETS['/icon-512.png'].body, appleIcon: PUBLIC_ASSETS['/apple-touch-icon.png'].body
  });
}
let publishing = Promise.resolve();
function publishSite(reason) {
  const run = async () => {
    const files = siteFiles();
    await writeSite(SITE_DIR, files);
    if (!PUSH_ENABLED) {
      siteStatus.last = { at: new Date().toISOString(), ok: true, pushed: false, version: live.version };
      return siteStatus.last;
    }
    try {
      const r = await pushToGitHub(files, Object.assign({}, GITHUB, { message: `Edition version ${live.version} (${reason})` }));
      siteStatus.last = { at: new Date().toISOString(), ok: true, pushed: true, changed: r.changed, commit: r.commit, version: live.version };
      console.log(`[guble] website: pushed version ${live.version} to ${GITHUB.repo} (${r.changed} file${r.changed === 1 ? '' : 's'} changed)`);
    } catch (err) {
      siteStatus.last = { at: new Date().toISOString(), ok: false, pushed: false, error: err.message, version: live.version };
      console.warn('[guble] website push failed:', err.message);
    }
    return siteStatus.last;
  };
  const p = publishing.then(run, run);
  publishing = p.catch(() => {});
  return p;
}

/* ---------------- the edition on disk ---------------- */
let live = { issue: null, json: '', version: 0, savedAt: null };
async function writeAtomic(file, data) {
  const tmp = `${file}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  const fh = await fsp.open(tmp, 'w', 0o600);
  try { await fh.writeFile(data); await fh.sync(); } finally { await fh.close(); }
  await fsp.rename(tmp, file);
}
async function loadEdition() {
  await fsp.mkdir(HISTORY_DIR, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(ISSUE_FILE)) {
    await writeAtomic(ISSUE_FILE, await fsp.readFile(SEED_FILE, 'utf8'));
    await writeAtomic(META_FILE, JSON.stringify({ version: 1, savedAt: new Date().toISOString() }));
    console.log('[guble] Started a new paper from the sample edition.');
  }
  const json = await fsp.readFile(ISSUE_FILE, 'utf8');
  let meta = { version: 1, savedAt: null };
  try { meta = JSON.parse(await fsp.readFile(META_FILE, 'utf8')); } catch { /* first run on old data */ }
  live = { issue: JSON.parse(json), json, version: Number(meta.version) || 1, savedAt: meta.savedAt };
}
let saving = Promise.resolve();
function saveEdition(issue) {
  const run = async () => {
    const json = JSON.stringify(issue);
    const version = live.version + 1, savedAt = new Date().toISOString();
    await writeAtomic(ISSUE_FILE, json);
    await writeAtomic(META_FILE, JSON.stringify({ version, savedAt }));
    await writeAtomic(path.join(HISTORY_DIR, `${Date.now()}-v${version}.json`), json);
    live = { issue, json, version, savedAt };
    const old = (await fsp.readdir(HISTORY_DIR)).filter((f) => HISTORY_NAME.test(f)).sort().reverse().slice(HISTORY_KEEP);
    await Promise.all(old.map((f) => fsp.unlink(path.join(HISTORY_DIR, f)).catch(() => {})));
    return { version, savedAt };
  };
  const p = saving.then(run, run);
  saving = p.catch(() => {});
  return p;
}
const HISTORY_NAME = /^(\d{13})-v(\d{1,9})\.json$/;

/* A structural check of an edition before it is saved. Text fields hold the
   editor's own HTML, which the page's Content-Security-Policy keeps inert. */
function validateIssue(x) {
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  if (!isObj(x)) return 'the edition must be an object';
  if (x.masthead != null && !isObj(x.masthead)) return 'the masthead must be an object';
  if (x.theme != null && !isObj(x.theme)) return 'the theme must be an object';
  if (x.location != null) { if (!isObj(x.location)) return 'the location must be an object'; const l = checkLocation(x.location); if (l) return l; }
  if (!Array.isArray(x.pages) || x.pages.length < 1 || x.pages.length > 64) return 'an edition needs between 1 and 64 pages';
  const checkBlocks = (list, depth) => {
    if (!Array.isArray(list) || list.length > 300) return 'a column can hold up to 300 blocks';
    for (const b of list) {
      if (!isObj(b) || typeof b.type !== 'string' || !/^[a-z]{1,20}$/.test(b.type)) return 'every block needs a type';
      if (b.blocks != null) {
        if (depth >= 4) return 'boxes can only be nested four deep';
        const e = checkBlocks(b.blocks, depth + 1); if (e) return e;
      }
    }
    return null;
  };
  for (const [i, page] of x.pages.entries()) {
    if (!isObj(page)) return `page ${i + 1} is not an object`;
    if (!Array.isArray(page.columns) || page.columns.length < 1 || page.columns.length > 8) return `page ${i + 1} needs between 1 and 8 columns`;
    if (page.strip != null && (!Array.isArray(page.strip) || page.strip.length > 6)) return `page ${i + 1} has too many footer boxes`;
    for (const c of page.columns.concat(page.strip || [])) {
      if (!isObj(c)) return `page ${i + 1} has a broken column`;
      const e = checkBlocks(c.blocks || [], 0); if (e) return `page ${i + 1}: ${e}`;
    }
  }
  return null;
}

/* ---------------- login throttling ---------------- */
const attempts = new Map();       // ip -> { fails, until, last }
let recentFailures = [];          // timestamps, for a site-wide slowdown under attack

async function handleLogin(req, res) {
  if (!sameOrigin(req)) return sendJson(res, 403, { error: 'cross_site' });
  if (!isJson(req)) return sendJson(res, 415, { error: 'json_only' });
  const ip = clientIp(req), now = Date.now();
  let rec = attempts.get(ip);
  if (rec && rec.until > now) {
    const retryAfter = Math.ceil((rec.until - now) / 1000);
    return sendJson(res, 429, { error: 'locked', retryAfter }, { 'Retry-After': String(retryAfter) });
  }
  if (rec && now - rec.last > LOCK_MS) rec = null;
  const body = await readJson(req, MAX_SMALL_BODY);
  const username = typeof body.username === 'string' ? body.username.slice(0, 200) : '';
  const password = typeof body.password === 'string' ? body.password.slice(0, 1024) : '';
  if (!PASSWORD) return sendJson(res, 503, { error: 'not_configured' });

  recentFailures = recentFailures.filter((t) => now - t < LOCK_MS);
  const slowdown = Math.min(3000, recentFailures.length * 30) + crypto.randomInt(50, 250);
  const userOk = safeEqual(username, ADMIN_USERNAME);
  const passOk = await verifyPassword(password);            // always runs, so timing doesn't reveal the username
  await sleep(slowdown);

  if (userOk && passOk) {
    attempts.delete(ip);
    destroySession(req, res);                                // never reuse a session id across a login
    createSession(res);
    console.log(`[guble] sign-in from ${ip}`);
    return sendJson(res, 200, { ok: true });
  }
  rec = rec || { fails: 0, until: 0, last: now };
  rec.fails++; rec.last = now;
  recentFailures.push(now);
  if (rec.fails >= LOGIN_MAX_FAILS) {
    rec.until = now + LOCK_MS; rec.fails = 0; attempts.set(ip, rec);
    console.warn(`[guble] ${ip} locked out after ${LOGIN_MAX_FAILS} failed sign-ins`);
    return sendJson(res, 429, { error: 'locked', retryAfter: LOCK_MS / 1000 }, { 'Retry-After': String(LOCK_MS / 1000) });
  }
  attempts.set(ip, rec);
  console.warn(`[guble] failed sign-in from ${ip}`);
  return sendJson(res, 401, { error: 'invalid', remaining: LOGIN_MAX_FAILS - rec.fails });
}

/* ---------------- routes ---------------- */
async function route(req, res) {
  baseHeaders(res);
  res.__gzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  const url = new URL(req.url, 'http://local');
  const p = url.pathname, m = req.method;

  if (p === '/healthz') return sendText(res, 200, 'ok');

  if (m === 'GET' || m === 'HEAD') {
    if (p === '/') {
      const f = fontInfo(live.issue);
      return sendHtml(res, fill(VIEWS.reader, { TITLE: paperTitle(), ISSUE: scriptSafe(live.json), FONTS: escapeHtml(f.href), FONTLIST: escapeHtml(f.list), OG_IMAGE: '/og-image.png' }));
    }
    if (PUBLIC_ASSETS[p]) return sendAsset(req, res, PUBLIC_ASSETS[p], 'no-cache');
    if (p === '/admin' || p === '/admin/') {
      const s = getSession(req);
      if (!s) return sendHtml(res, fill(VIEWS.login, { TITLE: paperTitle() }), 'no-store');
      const f = fontInfo(live.issue);
      return sendHtml(res, fill(VIEWS.admin, { TITLE: paperTitle(), ISSUE: scriptSafe(live.json), FONTS: escapeHtml(f.href), FONTLIST: escapeHtml(f.list), CSRF: s.csrf, VERSION: String(live.version) }), 'no-store');
    }
    if (ADMIN_ASSETS[p]) {
      if (!getSession(req)) return sendText(res, 404, 'Not found');
      return sendAsset(req, res, ADMIN_ASSETS[p], 'private, no-store');
    }
    if (p === '/api/issue') {
      res.setHeader('Cache-Control', 'no-cache');
      return sendJson(res, 200, { version: live.version, savedAt: live.savedAt, issue: live.issue }, { 'Cache-Control': 'no-cache' });
    }
    if (p === '/api/site') {
      if (!requireAdmin(req, res)) return;
      return sendJson(res, 200, siteStatus);
    }
    if (p === '/api/history') {
      if (!requireAdmin(req, res)) return;
      const names = (await fsp.readdir(HISTORY_DIR)).filter((f) => HISTORY_NAME.test(f)).sort().reverse();
      const items = names.map((f) => { const [, ts, v] = f.match(HISTORY_NAME); return { id: f.replace(/\.json$/, ''), version: Number(v), savedAt: new Date(Number(ts)).toISOString() }; });
      return sendJson(res, 200, { items });
    }
    const hist = p.match(/^\/api\/history\/(\d{13}-v\d{1,9})$/);
    if (hist) {
      if (!requireAdmin(req, res)) return;
      try { return sendJson(res, 200, { issue: JSON.parse(await fsp.readFile(path.join(HISTORY_DIR, hist[1] + '.json'), 'utf8')) }); }
      catch { return sendJson(res, 404, { error: 'not_found' }); }
    }
    return sendText(res, 404, 'Not found');
  }

  if (m === 'POST' && p === '/api/login') return handleLogin(req, res);
  if (m === 'POST' && p === '/api/logout') {
    if (!sameOrigin(req)) return sendJson(res, 403, { error: 'cross_site' });
    destroySession(req, res);
    return sendJson(res, 200, { ok: true });
  }
  if (m === 'PUT' && p === '/api/issue') {
    if (!requireAdmin(req, res, { write: true })) return;
    if (!isJson(req)) return sendJson(res, 415, { error: 'json_only' });
    const body = await readJson(req, MAX_ISSUE_BYTES);
    if (Number(body.baseVersion) !== live.version) return sendJson(res, 409, { error: 'conflict', version: live.version });
    const problem = validateIssue(body.issue);
    if (problem) return sendJson(res, 422, { error: problem });
    const saved = await saveEdition(body.issue);
    console.log(`[guble] published version ${saved.version} from ${clientIp(req)}`);
    const site = await publishSite('published from the newsroom');
    return sendJson(res, 200, Object.assign({}, saved, { site }));
  }
  if (m === 'POST' && p === '/api/site/publish') {
    if (!requireAdmin(req, res, { write: true })) return;
    return sendJson(res, 200, { site: await publishSite('published again from the newsroom') });
  }
  if (['/', '/admin', '/api/issue', '/api/login', '/api/logout'].includes(p)) return sendText(res, 405, 'Method not allowed');
  return sendText(res, 404, 'Not found');
}

const server = http.createServer((req, res) => {
  route(req, res).catch((err) => {
    const status = err && err.status;
    if (status === 413) return sendJson(res, 413, { error: 'too_large' });
    if (status === 400) return sendJson(res, 400, { error: 'bad_json' });
    if (status === 503) return sendJson(res, 503, { error: 'busy' }, { 'Retry-After': '2' });
    console.error('[guble] error:', err);
    if (!res.headersSent) sendJson(res, 500, { error: 'server_error' }); else res.end();
  });
});
server.headersTimeout = 15000;
server.requestTimeout = 60000;
server.keepAliveTimeout = 5000;

loadEdition().then(() => {
  publishSite('server started').catch(() => {});   // keep the site folder current; pushes only if something changed
  server.listen(PORT, HOST, () => console.log(`[guble] The Daily Guble is on port ${PORT} (edition version ${live.version})`));
}).catch((err) => { console.error('[guble] could not load the edition:', err); process.exit(1); });

for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 5000).unref(); });
