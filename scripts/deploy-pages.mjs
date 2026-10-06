import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const build = join(project, 'build');
if (!existsSync(join(build, 'index.html'))) throw new Error('Run npm run build before deploying.');

function git(args, cwd = project, accepted = [0]) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (!accepted.includes(result.status)) throw new Error(`git ${args[0]} failed: ${result.stderr}`);
  return result;
}

const remote = git(['remote', 'get-url', 'origin']).stdout.trim();
const name = git(['config', 'user.name'], project, [0, 1]).stdout.trim();
const email = git(['config', 'user.email'], project, [0, 1]).stdout.trim();
if (!name || !email) throw new Error('Configure git user.name and user.email before deploying.');
const existing = git(['ls-remote', '--exit-code', '--heads', remote, 'refs/heads/gh-pages'], project, [0, 2]);
const staging = mkdtempSync(join(tmpdir(), 'pages-deploy-'));
try {
  git(['init', '--quiet'], staging);
  git(['remote', 'add', 'origin', remote], staging);
  git(['config', 'user.name', name], staging);
  git(['config', 'user.email', email], staging);
  if (existing.status === 0) {
    git(['fetch', '--depth=1', 'origin', 'gh-pages'], staging);
    git(['checkout', '--quiet', '-B', 'gh-pages', 'FETCH_HEAD'], staging);
  } else {
    git(['checkout', '--quiet', '--orphan', 'gh-pages'], staging);
  }
  const cname = existsSync(join(staging, 'CNAME')) ? readFileSync(join(staging, 'CNAME')) : null;
  for (const entry of readdirSync(staging)) {
    if (entry !== '.git') rmSync(join(staging, entry), { recursive: true, force: true });
  }
  cpSync(build, staging, { recursive: true });
  if (cname && !existsSync(join(staging, 'CNAME'))) writeFileSync(join(staging, 'CNAME'), cname);
  writeFileSync(join(staging, '.nojekyll'), '');
  git(['add', '--all'], staging);
  const changed = git(['diff', '--cached', '--quiet'], staging, [0, 1]).status === 1;
  if (changed) {
    git(['commit', '--quiet', '-m', 'Deploy production build'], staging);
    git(['push', 'origin', 'HEAD:refs/heads/gh-pages'], staging);
    console.log('Production build published to gh-pages.');
  } else {
    console.log('Production build is already published.');
  }
} finally {
  rmSync(staging, { recursive: true, force: true });
}
