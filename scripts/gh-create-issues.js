/**
 * Create GitHub issues from markdown drafts in .github/ISSUE_DRAFTS
 *
 * Env vars:
 *  - GH_TOKEN or GITHUB_TOKEN: personal access token or Actions token
 *  - GH_REPO or GITHUB_REPOSITORY: "owner/repo"
 *
 * Usage:
 *  node scripts/gh-create-issues.js            # create issues
 *  DRY_RUN=1 node scripts/gh-create-issues.js  # dry run (prints payloads)
 */
import fs from 'fs';
import path from 'path';

const draftsDir = path.resolve(process.cwd(), '.github/ISSUE_DRAFTS');
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
const repo = process.env.GH_REPO || process.env.GITHUB_REPOSITORY || '';
const dryRun = !!process.env.DRY_RUN || process.argv.includes('--dry-run');

if (!fs.existsSync(draftsDir)) {
  console.error('[issues] Drafts dir not found:', draftsDir);
  process.exit(1);
}

if (!token && !dryRun) {
  console.error('[issues] Missing GH_TOKEN/GITHUB_TOKEN. Use DRY_RUN=1 for a dry run.');
  process.exit(1);
}
if (!repo && !dryRun) {
  console.error('[issues] Missing GH_REPO/GITHUB_REPOSITORY (expected owner/repo).');
  process.exit(1);
}

function parseFrontMatter(md) {
  if (!md.startsWith('---')) return { fm: {}, body: md };
  const end = md.indexOf('\n---', 3);
  if (end === -1) return { fm: {}, body: md };
  const raw = md.slice(3, end).trim();
  const body = md.slice(end + 4).replace(/^\s*\n/, '');
  const fm = {};
  for (const line of raw.split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val.startsWith('[') && val.endsWith(']')) {
      // parse simple array of strings
      val = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, ''))
        .filter(Boolean);
    }
    fm[key] = val;
  }
  return { fm, body };
}

async function createIssue(ownerRepo, issue, token) {
  const url = `https://api.github.com/repos/${ownerRepo}/issues`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(issue),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  const files = fs.readdirSync(draftsDir).filter((f) => f.endsWith('.md'));
  if (!files.length) {
    console.log('[issues] No draft files found.');
    return;
  }
  for (const file of files) {
    const full = path.join(draftsDir, file);
    const md = fs.readFileSync(full, 'utf8');
    const { fm, body } = parseFrontMatter(md);
    const title = fm.title || path.basename(file, '.md');
    const labels = Array.isArray(fm.labels) ? fm.labels : [];
    const assignees = Array.isArray(fm.assignees) ? fm.assignees : [];
    const payload = { title, body, labels, assignees };
    if (dryRun) {
      console.log('[issues] DRY_RUN payload for', file, '\n', JSON.stringify(payload, null, 2));
      continue;
    }
    try {
      const json = await createIssue(repo, payload, token);
      console.log('[issues] Created:', json.html_url);
    } catch (e) {
      console.error('[issues] Failed for', file, e.message);
      process.exitCode = 1;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
