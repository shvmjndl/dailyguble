'use strict';
/*
 * Builds the public paper as plain static files and publishes them.
 *
 *   buildSite()      the files: index.html (today's edition built in), script, styles, icons
 *   writeSite()      writes them to a folder (any static host can serve it)
 *   pushToGitHub()   commits them to a GitHub repo, which Cloudflare Pages, Netlify or
 *                    GitHub Pages redeploy automatically. Only changed files are uploaded.
 *
 * Standard library only.
 */
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

/* Readers' browsers fetch tides and weather themselves, straight from these public services.
   The news comes from the site itself (/api/news, a Cloudflare Pages Function in functions/). */
const DATA_SOURCES = ['https://api.tidesandcurrents.noaa.gov', 'https://api.weather.gov', 'https://api.open-meteo.com', 'https://api-bdc.io'];
const SITE_CSP = [
  "default-src 'none'", "script-src 'self'", "style-src 'self' https://fonts.googleapis.com", "font-src https://fonts.gstatic.com",
  "img-src 'self' data: blob:", "connect-src 'self' " + DATA_SOURCES.join(' '), "manifest-src 'self'",
  "base-uri 'none'", "form-action 'none'", "object-src 'none'"
].join('; ');

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const scriptSafe = (json) => json.replace(/</g, '\\u003c').replace(new RegExp('\\u2028', 'g'), '\\u2028').replace(new RegExp('\\u2029', 'g'), '\\u2029');
const fill = (view, values) => view.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in values ? values[k] : ''));

function plainTitle(issue) {
  const name = String((issue.masthead || {}).name || 'The Daily Guble').replace(/<[^>]*>/g, '');
  return escapeHtml(name.replace(/&amp;/g, '&').replace(/&[a-z]+;/gi, ' ').trim() || 'The Daily Guble');
}

/* Uploaded photos live in the edition as data: URLs. On the public site each one becomes
   its own file, named by its content, so the page stays small and browsers cache photos forever. */
function extractImages(issue) {
  const files = [], seen = new Set(), copy = JSON.parse(JSON.stringify(issue));
  (function walk(o) {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== 'object') return;
    for (const k of Object.keys(o)) {
      const v = o[k], m = k === 'src' && typeof v === 'string' && v.match(/^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
      if (m) {
        const buf = Buffer.from(m[2], 'base64'), name = `img/${crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16)}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
        if (!seen.has(name)) { seen.add(name); files.push({ path: name, data: buf }); }
        o[k] = name;
      } else walk(v);
    }
  })(copy);
  return { issue: copy, files };
}

/* The editor's filter choices, for the news function on Cloudflare. */
function newsSettings(issue) {
  const n = issue.news || {}, list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
  return { blockWords: list(n.blockWords), allowWords: list(n.allowWords), blockOutlets: list(n.blockOutlets), allow: list(n.allow) };
}

/* assets: { template, fonts, readerJs, paperCss, favicon, manifest (object), icon192, icon512, appleIcon } */
function buildSite(rawIssue, assets) {
  const { issue, files: images } = extractImages(rawIssue);
  const version = crypto.createHash('sha1').update(assets.readerJs).update(assets.paperCss).digest('hex').slice(0, 10);
  const manifest = Object.assign({}, assets.manifest, {
    start_url: './', scope: './',
    icons: assets.manifest.icons.map((i) => Object.assign({}, i, { src: i.src.replace(/^\//, '') }))
  });
  const fonts = assets.fonts || { href: '', list: '' };
  // link previews need a full address for the image; fall back to a relative one
  const ogImage = assets.siteUrl ? assets.siteUrl.replace(/\/+$/, '') + '/og-image.png' : 'og-image.png';
  const index = fill(assets.template, { TITLE: plainTitle(issue), ISSUE: scriptSafe(JSON.stringify(issue)), CSP: escapeHtml(SITE_CSP), V: version, FONTS: escapeHtml(fonts.href), FONTLIST: escapeHtml(fonts.list), OG_IMAGE: escapeHtml(ogImage) });
  const headers = [
    '/*',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: no-referrer',
    '  X-Frame-Options: DENY',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(), usb=()',  // location only when a reader taps the button
    '  Content-Security-Policy: ' + SITE_CSP + "; frame-ancestors 'none'",
    '/',
    '  Cache-Control: no-cache',
    '/index.html',
    '  Cache-Control: no-cache',
    // the page asks for paper.js?v=<hash>, so a new version is a new address: cache the files for a year
    '/paper.js',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/paper.css',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/img/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/*.png',
    '  Cache-Control: public, max-age=604800',
    '/news-settings.json',
    '  Cache-Control: no-cache',
    ''
  ].join('\n');
  return [
    { path: 'index.html', data: Buffer.from(index) },
    { path: 'paper.js', data: Buffer.from(assets.readerJs) },
    { path: 'paper.css', data: Buffer.from(assets.paperCss) },
    { path: 'favicon.svg', data: Buffer.from(assets.favicon) },
    { path: 'manifest.webmanifest', data: Buffer.from(JSON.stringify(manifest, null, 1)) },
    { path: 'icon-192.png', data: assets.icon192 },
    { path: 'icon-512.png', data: assets.icon512 },
    { path: 'apple-touch-icon.png', data: assets.appleIcon },
    ...(assets.ogImage ? [{ path: 'og-image.png', data: assets.ogImage }] : []),
    { path: '_headers', data: Buffer.from(headers) },       // Cloudflare Pages and Netlify read this
    { path: 'news-settings.json', data: Buffer.from(JSON.stringify(newsSettings(issue))) },   // the filter settings /api/news uses
    { path: '.nojekyll', data: Buffer.from('') }             // GitHub Pages: serve files as they are
  ].concat(images);
}

async function writeSite(dir, files) {
  await fsp.mkdir(dir, { recursive: true });
  for (const f of files) {
    const tmp = path.join(dir, `.${f.path}.${crypto.randomBytes(4).toString('hex')}.tmp`);
    await fsp.writeFile(tmp, f.data);
    await fsp.rename(tmp, path.join(dir, f.path));
  }
}

/* ---------------- GitHub ---------------- */
const gitBlobSha = (buf) => crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

async function pushToGitHub(files, { token, repo, branch = 'main', dir = '', message, api = 'https://api.github.com', author = null }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '')) throw new Error('GITHUB_REPO must look like owner/name');
  const base = `${api.replace(/\/+$/, '')}/repos/${repo}`;
  async function gh(p, init = {}) {
    const res = await fetch(base + p, Object.assign({}, init, {
      signal: AbortSignal.timeout(20000),
      headers: Object.assign({
        Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'daily-guble-newsroom'
      }, init.body ? { 'Content-Type': 'application/json' } : {})
    }));
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = new Error(res.status === 409 ? 'the repository is empty: add a README on GitHub first' :
        res.status === 404 ? `can't see ${repo} (or branch ${branch}): check the name and that the token can access it` :
        res.status === 401 ? 'GitHub rejected the token' :
        res.status === 403 ? 'the token is not allowed to write to this repository (it needs Contents: read and write)' :
        `GitHub said ${res.status}: ${body.message || 'unknown error'}`);
      e.status = res.status; throw e;
    }
    return body;
  }
  // Who the commits are by; without this GitHub uses the token owner's account email.
  const signed = (c) => (author && author.name && author.email ? Object.assign(c, { author, committer: author }) : c);
  const prefix = dir ? dir.replace(/^\/+|\/+$/g, '') + '/' : '';
  let ref;
  try { ref = await gh(`/git/ref/heads/${encodeURIComponent(branch)}`); }
  catch (err) {
    if (err.status !== 404) throw err;
    // The branch doesn't exist yet: start it with just the website files, unrelated to the code.
    await gh('');                                              // repo itself must be visible, or this throws the real error
    const tree = [];
    for (const f of files) {
      const blob = await gh('/git/blobs', { method: 'POST', body: JSON.stringify({ content: f.data.toString('base64'), encoding: 'base64' }) });
      tree.push({ path: prefix + f.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const t = await gh('/git/trees', { method: 'POST', body: JSON.stringify({ tree }) });
    const c = await gh('/git/commits', { method: 'POST', body: JSON.stringify(signed({ message, tree: t.sha, parents: [] })) });
    await gh('/git/refs', { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: c.sha }) });
    return { commit: c.sha, changed: files.length };
  }
  const head = await gh(`/git/commits/${ref.object.sha}`);
  const existing = await gh(`/git/trees/${head.tree.sha}?recursive=1`);
  const have = new Map((existing.tree || []).filter((t) => t.type === 'blob').map((t) => [t.path, t.sha]));
  const changed = files.filter((f) => have.get(prefix + f.path) !== gitBlobSha(f.data));
  if (!changed.length) return { commit: head.sha, changed: 0 };
  const tree = [];
  for (const f of changed) {
    const blob = await gh('/git/blobs', { method: 'POST', body: JSON.stringify({ content: f.data.toString('base64'), encoding: 'base64' }) });
    tree.push({ path: prefix + f.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const newTree = await gh('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: head.tree.sha, tree }) });
  const commit = await gh('/git/commits', { method: 'POST', body: JSON.stringify(signed({ message, tree: newTree.sha, parents: [head.sha] })) });
  await gh(`/git/refs/heads/${encodeURIComponent(branch)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) });
  return { commit: commit.sha, changed: changed.length };
}

module.exports = { buildSite, writeSite, pushToGitHub, SITE_CSP, DATA_SOURCES };
